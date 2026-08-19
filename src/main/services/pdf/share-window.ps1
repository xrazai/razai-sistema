param(
    [Parameter(Mandatory = $true)]
    [string]$FilePath,

    [Parameter(Mandatory = $false)]
    [string]$Title = "Compartilhar Pedido",

    [Parameter(Mandatory = $false)]
    [string]$Hwnd = "0"
)

$ErrorActionPreference = "Stop"

try {
    # Carrega assemblies WinRT necessários
    [Windows.ApplicationModel.DataTransfer.DataTransferManager, Windows.ApplicationModel.DataTransfer, ContentType = WindowsRuntime] | Out-Null
    [Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime] | Out-Null

    $code = @"
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using Windows.ApplicationModel.DataTransfer;
using Windows.Storage;

public class NativeShareHelper
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

    private static readonly Guid DataTransferManagerGuid = new Guid("a5caee9b-8708-49d1-8d36-67d25a8da00e");
    private static IDataTransferManagerInterop interop;
    private static DataTransferManager dtm;
    private static string currentFilePath;
    private static string currentTitle;

    public static bool ShareFile(IntPtr hwnd, string filePath, string title)
    {
        if (hwnd == IntPtr.Zero)
        {
            hwnd = GetForegroundWindow();
        }

        currentFilePath = filePath;
        currentTitle = title;

        if (interop == null)
        {
            interop = (IDataTransferManagerInterop)WindowsRuntimeMarshal.GetActivationFactory(typeof(DataTransferManager));
        }

        IntPtr dtmPtr = interop.GetForWindow(hwnd, ref DataTransferManagerGuid);
        dtm = (DataTransferManager)Marshal.GetObjectForIUnknown(dtmPtr);

        dtm.DataRequested -= OnDataRequested;
        dtm.DataRequested += OnDataRequested;

        interop.ShowShareUIForWindow(hwnd);
        return true;
    }

    private static void OnDataRequested(DataTransferManager sender, DataRequestedEventArgs args)
    {
        try
        {
            DataRequest request = args.Request;
            request.Data.Properties.Title = !string.IsNullOrEmpty(currentTitle) ? currentTitle : "Compartilhar Arquivo";

            Task<StorageFile> getFileTask = StorageFile.GetFileFromPathAsync(currentFilePath).AsTask();
            getFileTask.Wait();
            StorageFile file = getFileTask.Result;

            request.Data.SetStorageItems(new List<IStorageItem> { file });
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine("Erro em OnDataRequested: " + ex.Message);
        }
    }
}
"@

    Add-Type -TypeDefinition $code -Language CSharp

    $hwndPtr = [IntPtr]::Zero
    if ($Hwnd -ne "0" -and [long]::TryParse($Hwnd, [ref]$null)) {
        $hwndLong = [long]::Parse($Hwnd)
        $hwndPtr = [IntPtr]$hwndLong
    }

    $fullPath = [System.IO.Path]::GetFullPath($FilePath)
    $success = [NativeShareHelper]::ShareFile($hwndPtr, $fullPath, $Title)

    if ($success) {
        Write-Output "OK"
    }
}
catch {
    Write-Error $_.Exception.Message
    exit 1
}
