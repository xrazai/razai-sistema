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
    $fullPath = [System.IO.Path]::GetFullPath($FilePath)
    if (-not (Test-Path $fullPath)) {
        throw "Arquivo não encontrado: $fullPath"
    }

    $dir = [System.IO.Path]::GetDirectoryName($fullPath)
    $fileName = [System.IO.Path]::GetFileName($fullPath)

    # 1. Tenta acionar a folha nativa de compartilhamento do Windows via Shell COM
    $shell = New-Object -ComObject Shell.Application
    $folder = $shell.Namespace($dir)
    if ($folder) {
        $item = $folder.ParseName($fileName)
        if ($item) {
            $shareVerb = $null
            foreach ($v in $item.Verbs()) {
                $cleanName = ($v.Name -replace '&', '').Trim()
                if ($cleanName -match '^(Compartilhar|Share|Partager|Compartir|Condividi|Freigeben)$') {
                    $shareVerb = $v
                    break
                }
            }

            if ($shareVerb) {
                $shareVerb.DoIt()
                Write-Output "OK"
                exit 0
            }
        }
    }

    # 2. Fallback para interop WinRT se o verbo Shell não estiver presente
    try {
        [Windows.ApplicationModel.DataTransfer.DataTransferManager, Windows.ApplicationModel.DataTransfer, ContentType = WindowsRuntime] | Out-Null
        [Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime] | Out-Null
        [Windows.Foundation.AsyncStatus, Windows.Foundation, ContentType = WindowsRuntime] | Out-Null

        $code = @"
using System;
using System.Runtime.InteropServices;

[ComImport]
[Guid("3A3DCD6C-3EAB-43DC-BCDE-45671CE800C8")]
[InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IDataTransferManagerInterop
{
    IntPtr GetForWindow([In] IntPtr appWindow, [In] ref Guid riid);
    void ShowShareUIForWindow([In] IntPtr appWindow);
}

public class WinShareHelper
{
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();

    [DllImport("combase.dll", CharSet = CharSet.Unicode, PreserveSig = false)]
    public static extern void RoGetActivationFactory(
        [MarshalAs(UnmanagedType.HString)] string activatableClassId,
        [In] ref Guid iid,
        [Out, MarshalAs(UnmanagedType.Interface)] out IDataTransferManagerInterop factory
    );

    public static readonly Guid IDataTransferManagerInteropGuid = new Guid("3A3DCD6C-3EAB-43DC-BCDE-45671CE800C8");
    public static readonly Guid IDataTransferManagerGuid = new Guid("a5caee9b-8708-49d1-8d36-67d25a8da00e");

    public static IDataTransferManagerInterop GetInterop()
    {
        IDataTransferManagerInterop factory;
        Guid iid = IDataTransferManagerInteropGuid;
        RoGetActivationFactory("Windows.ApplicationModel.DataTransfer.DataTransferManager", ref iid, out factory);
        return factory;
    }

    public static IntPtr GetManagerPtrForWindow(IntPtr hwnd)
    {
        if (hwnd == IntPtr.Zero)
        {
            hwnd = GetForegroundWindow();
        }
        var interop = GetInterop();
        Guid guid = IDataTransferManagerGuid;
        return interop.GetForWindow(hwnd, ref guid);
    }

    public static void ShowShareUI(IntPtr hwnd)
    {
        if (hwnd == IntPtr.Zero)
        {
            hwnd = GetForegroundWindow();
        }
        var interop = GetInterop();
        interop.ShowShareUIForWindow(hwnd);
    }
}
"@

        Add-Type -TypeDefinition $code -Language CSharp

        $hwndPtr = [IntPtr]::Zero
        if ($Hwnd -ne "0" -and [long]::TryParse($Hwnd, [ref]$null)) {
            $hwndLong = [long]::Parse($Hwnd)
            $hwndPtr = [IntPtr]$hwndLong
        }

        if ($hwndPtr -eq [IntPtr]::Zero) {
            $hwndPtr = [WinShareHelper]::GetForegroundWindow()
        }

        $ptr = [WinShareHelper]::GetManagerPtrForWindow($hwndPtr)
        $dtm = [System.Runtime.InteropServices.Marshal]::GetObjectForIUnknown($ptr)

        $global:ShareFilePath = $fullPath
        $global:ShareTitle = $Title

        $handler = [Windows.Foundation.TypedEventHandler[Windows.ApplicationModel.DataTransfer.DataTransferManager, Windows.ApplicationModel.DataTransfer.DataRequestedEventArgs]]{
            param($sender, $args)
            try {
                $request = $args.Request
                $request.Data.Properties.Title = $global:ShareTitle

                $asyncOp = [Windows.Storage.StorageFile]::GetFileFromPathAsync($global:ShareFilePath)
                while ($asyncOp.Status -eq [Windows.Foundation.AsyncStatus]::Started) {
                    [System.Threading.Thread]::Sleep(10)
                }
                if ($asyncOp.Status -eq [Windows.Foundation.AsyncStatus]::Completed) {
                    $file = $asyncOp.GetResults()
                    $list = New-Object 'System.Collections.Generic.List[Windows.Storage.IStorageItem]'
                    $list.Add($file)
                    $request.Data.SetStorageItems($list)
                }
            } catch {
                Write-Error $_.Exception.Message
            }
        }

        $dtm.add_DataRequested($handler)
        [WinShareHelper]::ShowShareUI($hwndPtr)

        Write-Output "OK"
        exit 0
    }
    catch {
        Write-Output "FALLBACK_NEEDED"
        exit 0
    }
}
catch {
    Write-Error $_.Exception.Message
    exit 1
}
