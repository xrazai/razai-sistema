using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;
using Windows.ApplicationModel.DataTransfer;
using Windows.Foundation;
using Windows.Storage;
using WinRT;

namespace Razai.WindowsShare
{
    public class Program
    {
        [ComImport]
        [Guid("3A3DCD6C-3EAB-43DC-BCDE-45671CE800C8")]
        [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
        public interface IDataTransferManagerInterop
        {
            [PreserveSig]
            int GetForWindow([In] IntPtr appWindow, [In] ref Guid riid, out IntPtr ppv);

            [PreserveSig]
            int ShowShareUIForWindow([In] IntPtr appWindow);
        }

        [DllImport("combase.dll", CharSet = CharSet.Unicode)]
        private static extern int RoGetActivationFactory(
            IntPtr activatableClassId,
            [In] ref Guid iid,
            out IntPtr factory
        );

        [DllImport("combase.dll", CharSet = CharSet.Unicode)]
        private static extern int WindowsCreateString(
            string sourceString,
            int length,
            out IntPtr hstring
        );

        [DllImport("combase.dll")]
        private static extern int WindowsDeleteString(IntPtr hstring);

        private static readonly Guid IInspectableGuid = new Guid("AF86E2E0-B12D-4C6A-9C5A-D7AA65101E90");
        private static readonly Guid IDataTransferManagerInteropGuid = new Guid("3A3DCD6C-3EAB-43DC-BCDE-45671CE800C8");

        [STAThread]
        public static int Main(string[] args)
        {
            string? filePath = null;
            string title = "Compartilhar Pedido";

            for (int i = 0; i < args.Length; i++)
            {
                if ((args[i] == "--file" || args[i] == "-f") && i + 1 < args.Length)
                {
                    filePath = args[++i];
                }
                else if ((args[i] == "--title" || args[i] == "-t") && i + 1 < args.Length)
                {
                    title = args[++i];
                }
            }

            if (string.IsNullOrWhiteSpace(filePath))
            {
                Console.Error.WriteLine("Erro: Caminho do arquivo não fornecido (--file <caminho>)");
                return 1;
            }

            string fullPath = Path.GetFullPath(filePath);
            if (!File.Exists(fullPath))
            {
                Console.Error.WriteLine($"Erro: Arquivo não encontrado: {fullPath}");
                return 2;
            }

            try
            {
                Application.EnableVisualStyles();
                Application.SetCompatibleTextRenderingDefault(false);

                StorageFile file = WaitWinRt(StorageFile.GetFileFromPathAsync(fullPath));

                using Form hostForm = CreateHostForm();
                IntPtr hostHwnd = hostForm.Handle;

                IDataTransferManagerInterop interop = GetInteropFactory();

                Guid dtmGuid = IInspectableGuid;
                int hr = interop.GetForWindow(hostHwnd, ref dtmGuid, out IntPtr dtmPtr);
                if (hr != 0 || dtmPtr == IntPtr.Zero)
                {
                    throw new InvalidOperationException($"GetForWindow falhou com HRESULT 0x{hr:X8}");
                }

                DataTransferManager dtm = MarshalInterface<DataTransferManager>.FromAbi(dtmPtr);
                Marshal.Release(dtmPtr);

                dtm.DataRequested += (_, e) =>
                {
                    DataRequestDeferral deferral = e.Request.GetDeferral();
                    try
                    {
                        DataPackage data = e.Request.Data;
                        data.Properties.Title = title;
                        data.Properties.Description = Path.GetFileName(fullPath);
                        data.Properties.FileTypes.Clear();
                        data.Properties.FileTypes.Add(".pdf");
                        data.RequestedOperation = DataPackageOperation.Copy;
                        data.SetStorageItems(new IStorageItem[] { file }, true);
                    }
                    catch (Exception ex)
                    {
                        Console.Error.WriteLine($"[WindowsShare] Erro em DataRequested: {ex}");
                    }
                    finally
                    {
                        deferral.Complete();
                    }
                };

                System.Windows.Forms.Timer? closeTimer = null;
                void scheduleClose(int delayMs)
                {
                    if (hostForm.IsDisposed) return;
                    closeTimer?.Stop();
                    closeTimer?.Dispose();
                    closeTimer = new System.Windows.Forms.Timer { Interval = delayMs };
                    closeTimer.Tick += (_, _) =>
                    {
                        closeTimer?.Stop();
                        if (!hostForm.IsDisposed) hostForm.Close();
                    };
                    closeTimer.Start();
                }

                dtm.TargetApplicationChosen += (_, _) => scheduleClose(15000);

                bool shareShown = false;
                int shareHr = 0;
                hostForm.Shown += (_, _) =>
                {
                    if (shareShown) return;
                    shareShown = true;

                    shareHr = interop.ShowShareUIForWindow(hostHwnd);
                    if (shareHr != 0)
                    {
                        Console.Error.WriteLine($"ShowShareUIForWindow falhou com HRESULT 0x{shareHr:X8}");
                        hostForm.DialogResult = DialogResult.Abort;
                        hostForm.Close();
                        return;
                    }

                    scheduleClose(90000);
                };

                Application.Run(hostForm);
                closeTimer?.Dispose();

                if (shareHr != 0)
                {
                    return 3;
                }

                GC.KeepAlive(dtm);
                GC.KeepAlive(interop);
                return 0;
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[WindowsShare] Exceção completa:\n{ex}");
                return 3;
            }
        }

        private static Form CreateHostForm()
        {
            System.Drawing.Color chroma = System.Drawing.Color.FromArgb(255, 1, 0, 1);
            return new Form
            {
                Text = string.Empty,
                FormBorderStyle = FormBorderStyle.None,
                StartPosition = FormStartPosition.CenterScreen,
                ShowInTaskbar = false,
                ControlBox = false,
                TopMost = false,
                ClientSize = new System.Drawing.Size(8, 8),
                BackColor = chroma,
                TransparencyKey = chroma,
                Opacity = 1
            };
        }

        private static IDataTransferManagerInterop GetInteropFactory()
        {
            const string className = "Windows.ApplicationModel.DataTransfer.DataTransferManager";
            int hr = WindowsCreateString(className, className.Length, out IntPtr hstring);
            if (hr != 0 || hstring == IntPtr.Zero)
            {
                throw new InvalidOperationException($"WindowsCreateString falhou com HRESULT 0x{hr:X8}");
            }

            Guid interopGuid = IDataTransferManagerInteropGuid;
            hr = RoGetActivationFactory(hstring, ref interopGuid, out IntPtr factoryPtr);
            WindowsDeleteString(hstring);

            if (hr != 0 || factoryPtr == IntPtr.Zero)
            {
                throw new InvalidOperationException($"RoGetActivationFactory falhou com HRESULT 0x{hr:X8}");
            }

            IDataTransferManagerInterop interop = (IDataTransferManagerInterop)Marshal.GetObjectForIUnknown(factoryPtr);
            Marshal.Release(factoryPtr);
            return interop;
        }

        private static T WaitWinRt<T>(IAsyncOperation<T> operation)
        {
            if (operation.Status == AsyncStatus.Started)
            {
                using ManualResetEvent done = new ManualResetEvent(false);
                operation.Completed = (_, _) => done.Set();
                while (!done.WaitOne(20))
                {
                    Application.DoEvents();
                }
            }

            if (operation.Status != AsyncStatus.Completed)
            {
                throw new InvalidOperationException($"Operação WinRT falhou: {operation.Status}");
            }

            return operation.GetResults();
        }
    }
}
