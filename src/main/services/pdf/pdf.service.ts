import { BrowserWindow, shell, app } from 'electron'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import * as fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import type { PedidoRecord } from '../../../shared/types'

const execFileAsync = promisify(execFile)

function getWindowsShareBinaryPath(): string | null {
  const possiblePaths = [
    // 1. App empacotado: process.resourcesPath/bin/WindowsShare.exe
    process.resourcesPath ? path.join(process.resourcesPath, 'bin/WindowsShare.exe') : '',
    // 2. Recursos do projeto / workspace: resources/bin/WindowsShare.exe
    path.resolve(process.cwd(), 'resources/bin/WindowsShare.exe'),
    // 3. Caminho de compilação do .NET: native/windows-share/bin/...
    path.resolve(process.cwd(), 'native/windows-share/bin/Release/net8.0-windows10.0.19041.0/win-x64/publish/WindowsShare.exe'),
    // 4. Fallback relativo ao app
    path.resolve(__dirname, '../../resources/bin/WindowsShare.exe'),
    path.resolve(__dirname, '../resources/bin/WindowsShare.exe')
  ].filter(Boolean)

  for (const p of possiblePaths) {
    if (existsSync(p)) {
      return p
    }
  }
  return null
}

export class PdfService {
  /**
   * Renderiza o HTML do pedido com design Industrial Brutalist A4 de alto contraste e sem tintas pesadas.
   */
  static generatePedidoHtml(pedido: PedidoRecord): string {
    const formatCurrency = (val: number) =>
      `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

    const numeroFormatado = `#PED-${String(pedido.numero).padStart(4, '0')}`
    const dataFormatada = new Date(pedido.createdAt).toLocaleString('pt-BR')

    const rowsHtml = (pedido.itens || [])
      .map(
        (item, index) => `
        <tr>
          <td style="width: 35px; text-align: center;">${index + 1}</td>
          <td style="width: 170px; font-weight: 700;">${item.sku}</td>
          <td>${item.tecidoNome}</td>
          <td>${item.corNome}</td>
          <td style="width: 80px; text-align: right;">${item.quantidade.toFixed(2).replace('.', ',')}</td>
          <td style="width: 100px; text-align: right;">${formatCurrency(item.precoUnitario)}</td>
          <td style="width: 110px; text-align: right; font-weight: 700;">${formatCurrency(item.subtotal)}</td>
        </tr>
      `
      )
      .join('')

    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Pedido ${numeroFormatado} - Razai Sistema</title>
        <style>
          @page {
            size: A4;
            margin: 15mm 12mm 15mm 12mm;
          }
          * {
            box-sizing: border-box;
            line-height: 1.2;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: 'Courier New', Courier, monospace, sans-serif;
            font-size: 11px;
            color: #000000;
            background: #ffffff;
            -webkit-print-color-adjust: exact;
          }
          .header {
            border-bottom: 2px solid #000000;
            padding-bottom: 8px;
            margin-bottom: 12px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .brand {
            font-size: 16px;
            font-weight: 800;
            letter-spacing: 1px;
            text-transform: uppercase;
          }
          .brand-sub {
            font-size: 9px;
            color: #444444;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 2px;
          }
          .doc-title {
            text-align: right;
          }
          .doc-number {
            font-size: 16px;
            font-weight: 800;
            letter-spacing: 1px;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr;
            border: 1px solid #000000;
            margin-bottom: 14px;
          }
          .meta-item {
            padding: 6px 8px;
            border-right: 1px solid #000000;
          }
          .meta-item:last-child {
            border-right: none;
          }
          .meta-label {
            font-size: 8px;
            font-weight: 700;
            color: #555555;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: block;
            margin-bottom: 2px;
          }
          .meta-val {
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000000;
            margin-bottom: 14px;
          }
          th, td {
            border: 1px solid #000000;
            padding: 6px 8px;
            text-align: left;
            font-size: 10px;
          }
          th {
            background: #f0f0f0;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 9px;
            letter-spacing: 0.5px;
          }
          tr {
            page-break-inside: avoid;
          }
          .totals-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1.5fr;
            border: 1px solid #000000;
            margin-bottom: 16px;
          }
          .total-box {
            padding: 8px;
            border-right: 1px solid #000000;
            text-align: right;
          }
          .total-box:last-child {
            border-right: none;
            background: #f0f0f0;
          }
          .total-box-label {
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            margin-bottom: 2px;
            display: block;
          }
          .total-box-val {
            font-size: 14px;
            font-weight: 800;
          }
          .obs-box {
            border: 1px solid #000000;
            padding: 8px;
            margin-bottom: 20px;
            min-height: 40px;
          }
          .obs-title {
            font-size: 8px;
            font-weight: 700;
            text-transform: uppercase;
            margin-bottom: 4px;
            color: #555555;
          }
          .signatures {
            margin-top: 30px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            page-break-inside: avoid;
          }
          .sig-line {
            border-top: 1px solid #000000;
            text-align: center;
            padding-top: 4px;
            font-size: 9px;
            text-transform: uppercase;
          }
          .footer {
            margin-top: 25px;
            border-top: 1px dashed #666666;
            padding-top: 6px;
            display: flex;
            justify-content: space-between;
            font-size: 8px;
            color: #666666;
            text-transform: uppercase;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">RAZAI / SISTEMA</div>
            <div class="brand-sub">Engenharia e Gestão Têxtil Industrial</div>
          </div>
          <div class="doc-title">
            <div class="doc-number">PEDIDO ${numeroFormatado}</div>
            <div style="font-size: 9px; color: #444444;">EMISSÃO: ${dataFormatada}</div>
          </div>
        </div>

        <div class="meta-grid">
          <div class="meta-item">
            <span class="meta-label">Cliente</span>
            <span class="meta-val">${pedido.clienteNome || 'CONSUMIDOR FINAL / BALCÃO'}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Status</span>
            <span class="meta-val">${pedido.status.toUpperCase()}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Total de Itens</span>
            <span class="meta-val">${pedido.itensCount} itens lançados</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 35px; text-align: center;">#</th>
              <th>SKU Produto</th>
              <th>Tecido</th>
              <th>Cor</th>
              <th style="text-align: right;">Qtd.</th>
              <th style="text-align: right;">Preço Unit.</th>
              <th style="text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="totals-grid">
          <div class="total-box">
            <span class="total-box-label">Lançamentos</span>
            <span class="total-box-val" style="font-size: 12px;">${pedido.itensCount} itens</span>
          </div>
          <div class="total-box">
            <span class="total-box-label">Quantidade Total</span>
            <span class="total-box-val" style="font-size: 12px;">${pedido.quantidadeTotal.toFixed(2).replace('.', ',')}</span>
          </div>
          <div class="total-box">
            <span class="total-box-label">Valor Total do Pedido</span>
            <span class="total-box-val">${formatCurrency(pedido.valorTotal)}</span>
          </div>
        </div>

        ${
          pedido.observacoes
            ? `
          <div class="obs-box">
            <div class="obs-title">Observações do Pedido:</div>
            <div>${pedido.observacoes}</div>
          </div>
        `
            : ''
        }

        <div class="signatures">
          <div class="sig-line">Responsável Razai</div>
          <div class="sig-line">Aceite do Cliente</div>
        </div>

        <div class="footer">
          <span>Razai Sistema • Documento Gerado em ${dataFormatada}</span>
          <span>Página 1 de 1</span>
        </div>
      </body>
      </html>
    `
  }

  /**
   * Gera o arquivo PDF e o salva no diretório temporário/pedidos.
   */
  static async generatePedidoPdf(pedido: PedidoRecord): Promise<{ ok: boolean; filePath?: string; error?: string }> {
    let win: BrowserWindow | null = null
    try {
      const htmlContent = this.generatePedidoHtml(pedido)
      const numeroPad = String(pedido.numero).padStart(4, '0')
      const fileName = `Pedido_PED-${numeroPad}_${Date.now()}.pdf`

      const outputDir = path.join(os.tmpdir(), 'razai-pedidos')
      await fs.mkdir(outputDir, { recursive: true })
      const finalPdfPath = path.join(outputDir, fileName)

      win = new BrowserWindow({
        show: false,
        width: 800,
        height: 1100,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      })

      const encodedHtml = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`
      await win.loadURL(encodedHtml)

      // Aguarda renderização
      await new Promise((resolve) => setTimeout(resolve, 300))

      const pdfBuffer = await win.webContents.printToPDF({
        pageSize: 'A4',
        printBackground: true,
        margins: {
          marginType: 'none'
        }
      })

      await fs.writeFile(finalPdfPath, pdfBuffer)
      return { ok: true, filePath: finalPdfPath }
    } catch (err: any) {
      console.error('[PdfService] Erro ao gerar PDF:', err)
      return { ok: false, error: err?.message || 'Falha na geração do PDF' }
    } finally {
      if (win) {
        win.destroy()
      }
    }
  }

  /**
   * Abre o compartilhamento nativo do Windows (Windows Share Sheet) para o PDF do pedido,
   * permitindo envio direto para WhatsApp, Outlook, Telegram, etc. através do helper nativo Win32/WinRT.
   */
  static async sharePedidoPdf(pedido: PedidoRecord): Promise<{ ok: boolean; filePath?: string; error?: string }> {
    const res = await this.generatePedidoPdf(pedido)
    if (!res.ok || !res.filePath) {
      return res
    }

    // No Windows, aciona o helper nativo .NET 8 com IDataTransferManagerInterop
    if (process.platform === 'win32') {
      const helperExe = getWindowsShareBinaryPath()
      if (helperExe) {
        try {
          const mainWindow = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0]
          let hwndStr = '0'
          if (mainWindow) {
            const hwndBuffer = mainWindow.getNativeWindowHandle()
            hwndStr =
              hwndBuffer.length >= 8
                ? hwndBuffer.readBigInt64LE(0).toString()
                : hwndBuffer.length >= 4
                  ? hwndBuffer.readInt32LE(0).toString()
                  : '0'
          }

          const numeroFormatado = `#PED-${String(pedido.numero).padStart(4, '0')}`
          const shareTitle = `Pedido ${numeroFormatado} - ${pedido.clienteNome || 'Razai Sistema'}`

          // Executa o binário .NET nativo com argumentos separados e seguros
          const { stdout, stderr } = await execFileAsync(helperExe, [
            '--file',
            res.filePath,
            '--title',
            shareTitle,
            '--hwnd',
            hwndStr
          ])

          if (stdout && stdout.includes('OK')) {
            return { ok: true, filePath: res.filePath }
          }

          if (stderr && stderr.trim().length > 0) {
            console.warn('[PdfService] Aviso do helper WindowsShare:', stderr)
          }
        } catch (err: any) {
          console.warn('[PdfService] Falha ao acionar helper nativo WindowsShare, acionando fallback:', err?.message)
        }
      }
    }

    // Fallback: abre o PDF diretamente no visualizador do sistema operacional
    try {
      await shell.openPath(res.filePath)
      return { ok: true, filePath: res.filePath }
    } catch (err: any) {
      console.error('[PdfService] Erro ao abrir PDF:', err)
      return { ok: false, filePath: res.filePath, error: err?.message }
    }
  }
}
