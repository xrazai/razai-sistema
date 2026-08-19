using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;
using Windows.ApplicationModel.DataTransfer;
using Windows.Storage;
using WinRT;

namespace Razai.WindowsShare;

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

    [DllImport("user32.dll", EntryPoint = "SetWindowLongPtr")]
    private static extern IntPtr SetWindowLongPtr64(IntPtr hWnd, int nIndex, IntPtr dwNewLong);

    [DllImport("user32.dll", EntryPoint = "SetWindowLong")]
    private static extern int SetWindowLong32(IntPtr hWnd, int nIndex, int dwNewLong);

    private static IntPtr SetWindowLongPtr(IntPtr hWnd, int nIndex, IntPtr dwNewLong)
    {
        if (IntPtr.Size == 8)
            return SetWindowLongPtr64(hWnd, nIndex, dwNewLong);
        return new IntPtr(SetWindowLong32(hWnd, nIndex, dwNewLong.ToInt32()));
    }

    private const int GWLP_HWNDPARENT = -8;

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
        IntPtr parentHwnd = IntPtr.Zero;

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
            else if ((args[i] == "--hwnd" || args[i] == "-h") && i + 1 < args.Length)
            {
                if (long.TryParse(args[++i], out long parsedHwnd))
                {
                    parentHwnd = new IntPtr(parsedHwnd);
                }
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
            // 1. Cria formulário host transparente no thread STA atual
            using Form hostForm = new Form
            {
                Opacity = 0,
                ShowInTaskbar = false,
                FormBorderStyle = FormBorderStyle.None,
                Size = new System.Drawing.Size(1, 1),
                StartPosition = FormStartPosition.Manual,
                Location = new System.Drawing.Point(-2000, -2000)
            };

            IntPtr hostHwnd = hostForm.Handle;

            if (parentHwnd != IntPtr.Zero)
            {
                SetWindowLongPtr(hostHwnd, GWLP_HWNDPARENT, parentHwnd);
            }

            // 2. Obtém factory COM IDataTransferManagerInterop
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

            // 3. Obtém o DataTransferManager (IInspectable) para o host HWND
            Guid dtmGuid = IInspectableGuid;
            hr = interop.GetForWindow(hostHwnd, ref dtmGuid, out IntPtr dtmPtr);
            if (hr != 0 || dtmPtr == IntPtr.Zero)
            {
                throw new InvalidOperationException($"GetForWindow falhou com HRESULT 0x{hr:X8}");
            }

            DataTransferManager dtm = MarshalInterface<DataTransferManager>.FromAbi(dtmPtr);
            Marshal.Release(dtmPtr);

            bool dataAttached = false;

            dtm.DataRequested += async (sender, e) =>
            {
                DataRequestDeferral deferral = e.Request.GetDeferral();
                try
                {
                    e.Request.Data.Properties.Title = title;
                    e.Request.Data.Properties.Description = Path.GetFileName(fullPath);
                    StorageFile file = await StorageFile.GetFileFromPathAsync(fullPath);
                    e.Request.Data.SetStorageItems(new StorageFile[] { file });
                    dataAttached = true;
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

            // 4. Exibe a interface nativa do Windows Share Sheet
            hr = interop.ShowShareUIForWindow(hostHwnd);
            if (hr != 0)
            {
                throw new InvalidOperationException($"ShowShareUIForWindow falhou com HRESULT 0x{hr:X8}");
            }

            Console.WriteLine("OK");

            // Processa mensagens por um breve período para que o Windows Share Sheet receba o DataPackage
            DateTime timeout = DateTime.Now.AddSeconds(4);
            while (DateTime.Now < timeout)
            {
                Application.DoEvents();
                Thread.Sleep(50);
                if (dataAttached)
                {
                    // Deixa o loop rodar mais 1 segundo para garantir entrega ao componente do sistema
                    DateTime postAttach = DateTime.Now.AddSeconds(1);
                    while (DateTime.Now < postAttach)
                    {
                        Application.DoEvents();
                        Thread.Sleep(50);
                    }
                    break;
                }
            }

            return 0;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[WindowsShare] Exceção completa:\n{ex}");
            return 3;
        }
    }
}
