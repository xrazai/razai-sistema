import { BrowserWindow, shell, app } from 'electron'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import * as fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import type { PedidoPdfResult, PedidoRecord } from '../../../shared/types'

const execFileAsync = promisify(execFile)

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '\u0026amp;')
    .replace(/</g, '\u0026lt;')
    .replace(/>/g, '\u0026gt;')
    .replace(/"/g, '\u0026quot;')
}

function formatQty(value: unknown): string {
  const num = Number(value)
  return (Number.isFinite(num) ? num : 0).toFixed(2).replace('.', ',')
}

function isAllowedSharePath(filePath: string): boolean {
  const resolved = path.resolve(filePath)
  if (!resolved.toLowerCase().endsWith('.pdf')) return false

  const allowedRoots = [
    path.resolve(os.tmpdir(), 'razai-pedidos'),
    path.resolve(app.getPath('userData'), 'shares')
  ]

  return allowedRoots.some((root) => {
    const relative = path.relative(root, resolved)
    return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative)
  })
}

function getWindowsShareBinaryPath(): string | null {
  const possiblePaths = [
    process.resourcesPath ? path.join(process.resourcesPath, 'bin/WindowsShare.exe') : '',
    path.resolve(process.cwd(), 'resources/bin/WindowsShare.exe'),
    path.resolve(
      process.cwd(),
      'native/windows-share/bin/Release/net8.0-windows10.0.19041.0/win-x64/publish/WindowsShare.exe'
    ),
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
          <td style="width: 170px; font-weight: 700;">${escapeHtml(item.sku)}</td>
          <td>${escapeHtml(item.tecidoNome)}</td>
          <td>${escapeHtml(item.corNome)}</td>
          <td style="width: 80px; text-align: right;">${formatQty(item.quantidade)}</td>
          <td style="width: 100px; text-align: right;">${formatCurrency(Number(item.precoUnitario) || 0)}</td>
          <td style="width: 110px; text-align: right; font-weight: 700;">${formatCurrency(Number(item.subtotal) || 0)}</td>
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
            <span class="meta-val">${escapeHtml(pedido.clienteNome || 'CONSUMIDOR FINAL / BALCÃO')}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Status</span>
            <span class="meta-val">${escapeHtml((pedido.status || 'pendente').toUpperCase())}</span>
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
            <span class="total-box-val" style="font-size: 12px;">${formatQty(pedido.quantidadeTotal)}</span>
          </div>
          <div class="total-box">
            <span class="total-box-label">Valor Total do Pedido</span>
            <span class="total-box-val">${formatCurrency(Number(pedido.valorTotal) || 0)}</span>
          </div>
        </div>

        ${
          pedido.observacoes
            ? `
          <div class="obs-box">
            <div class="obs-title">Observações do Pedido:</div>
            <div>${escapeHtml(pedido.observacoes)}</div>
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

  static async generatePedidoPdf(pedido: PedidoRecord): Promise<PedidoPdfResult> {
    let win: BrowserWindow | null = null
    try {
      const htmlContent = this.generatePedidoHtml(pedido)
      const numeroPad = String(pedido.numero).padStart(4, '0')
      const fileName = `Pedido_PED-${numeroPad}_${Date.now()}.pdf`

      const outputDir = path.join(os.tmpdir(), 'razai-pedidos')
      await fs.mkdir(outputDir, { recursive: true })
      const finalPdfPath = path.join(outputDir, fileName)
      const htmlPath = path.join(outputDir, fileName.replace(/\.pdf$/i, '.html'))

      win = new BrowserWindow({
        show: false,
        width: 800,
        height: 1100,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      })

      await fs.writeFile(htmlPath, htmlContent, 'utf8')
      await win.loadFile(htmlPath)
      await fs.unlink(htmlPath).catch(() => undefined)

      const pdfBuffer = await win.webContents.printToPDF({
        pageSize: 'A4',
        printBackground: true,
        margins: {
          marginType: 'none'
        }
      })

      if (pdfBuffer.subarray(0, 4).toString('utf8') !== '%PDF') {
        return { ok: false, error: 'Falha ao renderizar o PDF do pedido.' }
      }

      await fs.writeFile(finalPdfPath, pdfBuffer)
      return {
        ok: true,
        filePath: finalPdfPath,
        fileName,
        title: `Pedido PED-${numeroPad} - ${pedido.clienteNome || 'Razai Sistema'}`,
        data: new Uint8Array(pdfBuffer)
      }
    } catch (err: any) {
      console.error('[PdfService] Erro ao gerar PDF:', err)
      return { ok: false, error: err?.message || 'Falha na geração do PDF' }
    } finally {
      if (win) {
        win.destroy()
      }
    }
  }

  static async sharePedidoPdf(pedido: PedidoRecord): Promise<PedidoPdfResult> {
    const res = await this.generatePedidoPdf(pedido)
    if (!res.ok || !res.filePath) {
      return res
    }
    return this.openWindowsShare(res.filePath, res.title || 'Pedido Razai Sistema')
  }

  static async openWindowsShare(filePath: string, title: string): Promise<PedidoPdfResult> {
    if (!isAllowedSharePath(filePath) || !existsSync(filePath)) {
      return { ok: false, error: 'Arquivo de compartilhamento inválido.' }
    }

    let sharePath = path.resolve(filePath)
    if (process.platform === 'win32') {
      const helperExe = getWindowsShareBinaryPath()
      if (helperExe) {
        try {
          const shareDir = path.join(app.getPath('userData'), 'shares')
          await fs.mkdir(shareDir, { recursive: true })
          sharePath = path.join(shareDir, path.basename(filePath))
          await fs.copyFile(filePath, sharePath)

          await execFileAsync(helperExe, ['--file', sharePath, '--title', title], {
            timeout: 10 * 60 * 1000,
            windowsHide: false
          })
          return { ok: true, filePath: sharePath }
        } catch (err: any) {
          console.warn('[PdfService] Falha ao acionar helper nativo WindowsShare, acionando fallback:', err?.message)
        }
      }
    }

    const openError = await shell.openPath(sharePath)
    if (openError) {
      return { ok: false, filePath: sharePath, error: openError }
    }
    return { ok: true, filePath: sharePath }
  }
}
