import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import * as os from 'node:os'
import { EscPosBuilder } from './escpos.builder'
import { SettingsService } from '../settings.service'
import type { VendaRecord } from '../../../shared/types'

const execFileAsync = promisify(execFile)

export type PrinterInfo = {
  name: string
  driverName?: string
  portName?: string
  isDefault?: boolean
  status?: string
}

export class PrinterService {
  /**
   * Lista todas as impressoras instaladas no sistema operacional.
   */
  static async listPrinters(): Promise<PrinterInfo[]> {
    try {
      const psCommand = `Get-Printer | Select-Object Name, DriverName, PortName, PrinterStatus | ConvertTo-Json -Compress`
      const { stdout } = await execFileAsync('powershell.exe', [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        psCommand
      ])

      if (!stdout || !stdout.trim()) {
        return []
      }

      const parsed = JSON.parse(stdout.trim())
      const items = Array.isArray(parsed) ? parsed : [parsed]

      const defaultPrinterName = SettingsService.get('printer_name')

      return items.map((p) => ({
        name: p.Name || '',
        driverName: p.DriverName || '',
        portName: p.PortName || '',
        status: p.PrinterStatus || 'Normal',
        isDefault: defaultPrinterName ? p.Name === defaultPrinterName : false
      }))
    } catch (err) {
      console.error('[PrinterService] Erro ao listar impressoras:', err)
      return []
    }
  }

  /**
   * Envia um buffer de bytes ESC/POS diretamente para o spooler da impressora selecionada.
   */
  static async printRaw(printerName: string, buffer: Buffer): Promise<{ ok: boolean; error?: string }> {
    if (!printerName) {
      return { ok: false, error: 'Nenhuma impressora especificada' }
    }

    const tempFile = path.join(os.tmpdir(), `razai_print_${Date.now()}_${Math.random().toString(36).substring(7)}.bin`)
    const scriptPath = path.join(__dirname, 'services/printer/raw-print.ps1')

    // Se estiver em desenvolvimento ou empacotado, localiza o script .ps1
    let resolvedScriptPath = path.resolve(__dirname, 'services/printer/raw-print.ps1')
    try {
      await fs.access(resolvedScriptPath)
    } catch {
      // Fallback para localização relativa ao código-fonte ou diretório atual
      resolvedScriptPath = path.resolve(process.cwd(), 'src/main/services/printer/raw-print.ps1')
    }

    try {
      await fs.writeFile(tempFile, buffer)

      const { stdout, stderr } = await execFileAsync('powershell.exe', [
        '-NoProfile',
        '-NonInteractive',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        resolvedScriptPath,
        '-PrinterName',
        printerName,
        '-FilePath',
        tempFile
      ])

      if (stderr && stderr.trim().length > 0 && !stdout.includes('OK')) {
        return { ok: false, error: stderr.trim() }
      }

      return { ok: true }
    } catch (err: any) {
      console.error('[PrinterService] Erro ao imprimir:', err)
      return { ok: false, error: err?.message || 'Falha na comunicação com a impressora' }
    } finally {
      // Remove o arquivo temporário de bytes
      try {
        await fs.unlink(tempFile)
      } catch {
        // Ignora erro de limpeza
      }
    }
  }

  /**
   * Gera e envia um cupom de teste em 80mm com grid industrial e corte de papel.
   */
  static async printTestReceipt(targetPrinterName?: string): Promise<{ ok: boolean; error?: string }> {
    const printerName = targetPrinterName || SettingsService.get('printer_name') || 'G250'

    const builder = new EscPosBuilder(48)
      .init()
      .align('center')
      .size(2, 2)
      .bold(true)
      .line('RAZAI SISTEMA')
      .size(1, 1)
      .bold(false)
      .line('ENGENHARIA E GESTAO TEXTIL')
      .line('CUPOM DE HOMOLOGACAO TERMICA')
      .divider('=')
      .align('left')
      .twoColumns('IMPRESSORA:', printerName)
      .twoColumns('LARGURA:', '80mm (48 Colunas)')
      .twoColumns('DATA/HORA:', new Date().toLocaleString('pt-BR'))
      .twoColumns('PROTOCOLO:', 'ESC/POS RAW USB')
      .divider('-')
      .bold(true)
      .table4Columns('ITEM / DESCRICAO', 'QTD', 'UNIT', 'TOTAL')
      .bold(false)
      .divider('-')
      .table4Columns('LINHO PURO CRU', '10m', '45,00', '450,00')
      .table4Columns('VISCOSE TWILL', '25m', '28,50', '712,50')
      .table4Columns('SARJA 100% ALGODAO', '5m', '38,00', '190,00')
      .divider('-')
      .bold(true)
      .twoColumns('SUBTOTAL:', 'R$ 1.352,50')
      .twoColumns('DESCONTO:', 'R$ 52,50')
      .size(2, 1)
      .twoColumns('TOTAL:', 'R$ 1.300,00')
      .size(1, 1)
      .bold(false)
      .divider('=')
      .align('center')
      .line('TESTE DE ACENTUACAO PT-BR:')
      .line('A E I O U - C - a e i o u - c')
      .line('Corte automatico de guilhotina OK')
      .divider('-')
      .line('RAZAI INDUSTRIAL BRUTALIST')
      .cut(false)

    return this.printRaw(printerName, builder.toBuffer())
  }

  /**
   * Gera e envia o cupom de venda em 80mm com itens, totais e corte.
   */
  static async printSaleReceipt(venda: VendaRecord, targetPrinterName?: string): Promise<{ ok: boolean; error?: string }> {
    const printerName = targetPrinterName || SettingsService.get('printer_name') || 'G250'

    const formatCurrency = (val: number) =>
      `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

    const numeroFormatado = `#VEN-${String(venda.numero).padStart(4, '0')}`

    const builder = new EscPosBuilder(48)
      .init()
      .align('center')
      .size(2, 2)
      .bold(true)
      .line('RAZAI SISTEMA')
      .size(1, 1)
      .bold(false)
      .line('COMPROVANTE DE VENDA')
      .divider('=')
      .align('left')
      .twoColumns('VENDA:', numeroFormatado)
      .twoColumns('DATA/HORA:', new Date(venda.createdAt).toLocaleString('pt-BR'))

    if (venda.clienteNome) {
      builder.twoColumns('CLIENTE:', venda.clienteNome)
    }
    if (venda.formaPagamento) {
      builder.twoColumns('PAGAMENTO:', venda.formaPagamento)
    }

    builder
      .divider('-')
      .bold(true)
      .table4Columns('ITEM / SKU', 'QTD', 'UNIT', 'TOTAL')
      .bold(false)
      .divider('-')

    if (venda.itens && venda.itens.length > 0) {
      for (const item of venda.itens) {
        const itemDesc = `${item.tecidoNome} (${item.corNome})`
        builder
          .line(itemDesc.length > 48 ? itemDesc.substring(0, 48) : itemDesc)
          .table4Columns(
            item.sku,
            `${item.quantidade}m`,
            item.precoUnitario.toFixed(2).replace('.', ','),
            item.subtotal.toFixed(2).replace('.', ',')
          )
      }
    }

    builder
      .divider('-')
      .twoColumns('TOTAL DE ITENS:', `${venda.itensCount} itens`)
      .twoColumns('METRAGEM TOTAL:', `${venda.quantidadeTotal} m`)
      .divider('-')
      .bold(true)
      .size(2, 1)
      .twoColumns('TOTAL GERAL:', formatCurrency(venda.valorTotal))
      .size(1, 1)
      .bold(false)
      .divider('=')
      .align('center')
      .line('OBRIGADO PELA PREFERENCIA!')
      .divider('-')
      .line('RAZAI INDUSTRIAL BRUTALIST')
      .cut(false)

    return this.printRaw(printerName, builder.toBuffer())
  }
}
