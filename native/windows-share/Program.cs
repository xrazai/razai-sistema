using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;
using Windows.ApplicationModel.DataTransfer;
using Windows.Storage;

namespace Razai.WindowsShare;

public class Program
{
    [ComImport]
    [Guid("3A3DCD6C-3EAB-43DC-BCDE-45671CE800C8")]
    [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IDataTransferManagerInterop
    {
        IntPtr GetForWindow([In] IntPtr appWindow, [In] ref Guid riid);
        void ShowShareUIForWindow([In] IntPtr appWindow);
    }

    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();

    [DllImport("combase.dll", CharSet = CharSet.Unicode, PreserveSig = false)]
    public static extern void RoGetActivationFactory(
        [MarshalAs(UnmanagedType.HString)] string activatableClassId,
        [In] ref Guid iid,
        [Out, MarshalAs(UnmanagedType.Interface)] out IDataTransferManagerInterop factory
    );

    private static readonly Guid DataTransferManagerGuid = new Guid("a5caee9b-8708-49d1-8d36-67d25a8da00e");
    private static readonly Guid IDataTransferManagerInteropGuid = new Guid("3A3DCD6C-3EAB-43DC-BCDE-45671CE800C8");

    [STAThread]
    public static int Main(string[] args)
    {
        string? filePath = null;
        string title = "Compartilhar Pedido";
        IntPtr hwnd = IntPtr.Zero;

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
                    hwnd = new IntPtr(parsedHwnd);
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

        if (hwnd == IntPtr.Zero)
        {
            hwnd = GetForegroundWindow();
        }

        try
        {
            Guid interopGuid = IDataTransferManagerInteropGuid;
            RoGetActivationFactory("Windows.ApplicationModel.DataTransfer.DataTransferManager", ref interopGuid, out IDataTransferManagerInterop interop);

            Guid dtmGuid = DataTransferManagerGuid;
            IntPtr dtmPtr = interop.GetForWindow(hwnd, ref dtmGuid);
            DataTransferManager dtm = (DataTransferManager)Marshal.GetObjectForIUnknown(dtmPtr);

            using ManualResetEvent completeEvent = new ManualResetEvent(false);

            dtm.DataRequested += async (sender, e) =>
            {
                DataRequestDeferral deferral = e.Request.GetDeferral();
                try
                {
                    e.Request.Data.Properties.Title = title;
                    e.Request.Data.Properties.Description = Path.GetFileName(fullPath);
                    StorageFile file = await StorageFile.GetFileFromPathAsync(fullPath);
                    e.Request.Data.SetStorageItems(new StorageFile[] { file });
                }
                catch (Exception ex)
                {
                    Console.Error.WriteLine($"[WindowsShare] Erro ao anexar arquivo: {ex.Message}");
                }
                finally
                {
                    deferral.Complete();
                    completeEvent.Set();
                }
            };

            interop.ShowShareUIForWindow(hwnd);
            Console.WriteLine("OK");

            // Aguarda o evento de transferência ser processado
            completeEvent.WaitOne(TimeSpan.FromSeconds(5));
            return 0;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[WindowsShare] Falha ao acionar Share Sheet: {ex.Message}");
            return 3;
        }
    }
}
