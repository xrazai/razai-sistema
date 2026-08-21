import { SettingsService } from '../settings.service'
import { PrinterService } from '../printer/printer.service'
import { loadExactZplDocument } from './document-loader'
import { ShopeeEtiquetasRepository } from './repository'

export class ZebraPrinterService {
  static getPrinter(): string | null {
    return SettingsService.get('shopee_zebra_printer_name')
  }

  static setPrinter(name: string): boolean {
    return SettingsService.set('shopee_zebra_printer_name', name.trim())
  }

  static async test(printerName?: string): Promise<{ ok: boolean; error?: string }> {
    const target = printerName?.trim() || this.getPrinter()
    if (!target) return { ok: false, error: 'Selecione a impressora Zebra.' }
    const testZpl = Buffer.from(
      '^XA^CI28^PW600^LL400^FO40,40^A0N,40,40^FDRAZAI / TESTE ZEBRA^FS' +
      '^FO40,100^A0N,25,25^FDIMPRESSAO RAW USB OK^FS^FO40,160^GB520,2,2^FS' +
      `^FO40,200^A0N,20,20^FD${new Date().toLocaleString('pt-BR')}^FS^XZ`,
      'utf8'
    )
    return PrinterService.printRaw(target, testZpl)
  }

  static async loadExactDocument(documentId: string): Promise<Buffer> {
    const source = ShopeeEtiquetasRepository.getDocumentSource(documentId)
    if (!source?.storedPath) throw new Error('O arquivo original expirou ou não está disponível.')
    return loadExactZplDocument(source.storedPath, source.entryName, source.documentHash)
  }

  static async printDocument(documentId: string): Promise<{ ok: boolean; error?: string }> {
    const printer = this.getPrinter()
    if (!printer) return { ok: false, error: 'Configure a impressora Zebra antes de imprimir.' }
    const buffer = await this.loadExactDocument(documentId)
    return PrinterService.printRaw(printer, buffer)
  }
}
