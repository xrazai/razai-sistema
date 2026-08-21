import { app, BrowserWindow } from 'electron'
import { createHash, randomUUID } from 'node:crypto'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import type {
  ShopeeEtiquetaActionResult,
  ShopeeEtiquetaProgress,
  ShopeeEtiquetaLoteStatus
} from '../../../shared/shopee-etiquetas'
import { loadZplDocuments } from './document-loader'
import { parseZpl } from './zpl-parser'
import { extractPage, type ExtractedItem } from './extractor'
import { LocalOcrService } from './ocr.service'
import { ShopeeEtiquetasRepository } from './repository'
import type { ShopeeExactCorrectionMemory } from './repository'
import { ZebraPrinterService } from './zebra-printer.service'
import { CutPdfService } from './cut-pdf.service'

function addDays(date: Date, days: number): string {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result.toISOString()
}

function safeFileName(value: string): string {
  const withoutControls = [...value].map((character) => character.charCodeAt(0) < 32 ? '_' : character).join('')
  return withoutControls.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, ' ').trim().slice(0, 180)
}

export function canDeleteShopeeBatch(status: ShopeeEtiquetaLoteStatus, printStatuses: string[]): boolean {
  return ['recebido', 'revisao', 'falhou'].includes(status) && !printStatuses.includes('impresso')
}

export function canRetryShopeePrinting(status: ShopeeEtiquetaLoteStatus, reviewIssues: number): boolean {
  return ['impressao_pendente', 'impressao_incerta'].includes(status) && reviewIssues === 0
}

export function resolveShopeeBatchDirectory(userDataPath: string, batchId: string): string {
  if (!/^[a-z0-9-]+$/i.test(batchId)) throw new Error('Identificador de lote inválido.')
  const root = path.resolve(userDataPath, 'shopee', 'etiquetas')
  const target = path.resolve(root, batchId)
  const relative = path.relative(root, target)
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Pasta de lote inválida.')
  return target
}

export function applyExactCorrection(
  item: ExtractedItem,
  memory: ShopeeExactCorrectionMemory | null,
  fallbackOrderId: string | null
): { item: ExtractedItem; orderId: string | null } {
  if (!memory) return { item, orderId: fallbackOrderId }
  return {
    orderId: memory.orderId,
    item: {
      ...item,
      productRaw: memory.productRaw,
      variationRaw: memory.variationRaw,
      fabricName: memory.fabricName,
      colorName: memory.colorName,
      cutMm: memory.cutMm,
      widthMm: memory.widthMm,
      quantity: memory.quantity,
      sku: memory.sku,
      validationSource: 'exact_memory',
      reviewReason: null,
      reviewRequired: false
    }
  }
}

export class ShopeeEtiquetasJobService {
  private static queue: Promise<void> = Promise.resolve()
  private static cancelledBatches = new Set<string>()

  private static emit(progress: ShopeeEtiquetaProgress): void {
    for (const window of BrowserWindow.getAllWindows()) {
      window.webContents.send('shopee:etiquetas:progress', progress)
    }
  }

  private static update(batchId: string, status: ShopeeEtiquetaProgress['status'], progress: number, message: string): void {
    ShopeeEtiquetasRepository.updateBatch(batchId, status, progress)
    this.emit({ loteId: batchId, status, progress, message })
  }

  private static enqueue(batchId: string, action: () => Promise<void>): void {
    this.queue = this.queue.then(async () => {
      if (this.cancelledBatches.delete(batchId)) return
      await action()
    }).catch((error: any) => {
      const message = error?.message || 'Falha inesperada no processamento do lote.'
      ShopeeEtiquetasRepository.updateBatch(batchId, 'falhou', 0, 'PROCESSING_ERROR', message)
      this.emit({ loteId: batchId, status: 'falhou', progress: 0, message })
    })
  }

  static async initialize(): Promise<void> {
    ShopeeEtiquetasRepository.recoverInterrupted()
    await this.cleanupExpiredFiles()
    for (const batchId of ShopeeEtiquetasRepository.recoverableExtractionBatches()) {
      this.enqueue(batchId, async () => {
        ShopeeEtiquetasRepository.resetExtraction(batchId)
        await this.processBatch(batchId)
      })
    }
  }

  static async importFiles(filePaths: string[]): Promise<ShopeeEtiquetaActionResult> {
    if (!Array.isArray(filePaths) || filePaths.length < 1) return { ok: false, error: 'Selecione ao menos um arquivo.' }
    if (filePaths.length > 50) return { ok: false, error: 'O lote aceita no máximo 50 arquivos.' }
    const allowed = new Set(['.zip', '.zpl', '.txt'])
    const resolvedPaths: string[] = []
    for (const filePath of filePaths) {
      const resolved = path.resolve(filePath)
      if (!allowed.has(path.extname(resolved).toLowerCase())) return { ok: false, error: `Formato não suportado: ${path.basename(resolved)}` }
      const stat = await fs.stat(resolved).catch(() => null)
      if (!stat?.isFile()) return { ok: false, error: `Arquivo não encontrado: ${path.basename(resolved)}` }
      resolvedPaths.push(resolved)
    }

    const batchId = randomUUID()
    const now = new Date()
    const nowIso = now.toISOString()
    const expiresAt = addDays(now, 15)
    const originalDir = path.join(app.getPath('userData'), 'shopee', 'etiquetas', batchId, 'originais')
    await fs.mkdir(originalDir, { recursive: true })
    ShopeeEtiquetasRepository.createBatch(batchId, nowIso, expiresAt)
    for (let index = 0; index < resolvedPaths.length; index += 1) {
      const source = resolvedPaths[index]
      const bytes = await fs.readFile(source)
      const destination = path.join(originalDir, `${String(index + 1).padStart(3, '0')}_${safeFileName(path.basename(source))}`)
      await fs.copyFile(source, destination)
      ShopeeEtiquetasRepository.addFile({
        id: randomUUID(),
        batchId,
        name: path.basename(source),
        storedPath: destination,
        hash: createHash('sha256').update(bytes).digest('hex'),
        byteSize: bytes.length,
        order: index,
        expiresAt
      })
    }
    this.enqueue(batchId, () => this.processBatch(batchId))
    return { ok: true, loteId: batchId }
  }

  private static async processBatch(batchId: string): Promise<void> {
    this.update(batchId, 'extraindo', 5, 'Validando arquivos do lote')
    LocalOcrService.setProgressListener((progress, message) => {
      this.emit({ loteId: batchId, status: 'extraindo', progress: Math.min(75, 10 + Math.round(progress * 0.65)), message })
    })
    const files = ShopeeEtiquetasRepository.getBatchFiles(batchId)
    let documentOrder = 0
    let totalPages = 0
    let totalExpandedBytes = 0
    for (const file of files) {
      const documents = await loadZplDocuments(file.storedPath)
      for (const loaded of documents) {
        totalExpandedBytes += loaded.buffer.length
        if (totalExpandedBytes > 250 * 1024 * 1024) throw new Error('O lote excede 250 MB descompactados.')
        const documentId = randomUUID()
        const documentHash = createHash('sha256').update(loaded.buffer).digest('hex')
        ShopeeEtiquetasRepository.addDocument({
          id: documentId,
          fileId: file.id,
          entryName: loaded.entryName,
          hash: documentHash,
          byteSize: loaded.buffer.length,
          order: documentOrder++
        })
        const parsed = parseZpl(loaded.buffer)
        totalPages += parsed.pages.length
        if (totalPages > 500) throw new Error('O lote excede 500 páginas imprimíveis.')
        for (const page of parsed.pages) {
          this.emit({
            loteId: batchId,
            status: 'extraindo',
            progress: Math.min(75, 10 + Math.round((totalPages / Math.max(totalPages, 20)) * 60)),
            message: `Extraindo página ${page.index + 1} de ${loaded.entryName}`
          })
          const extracted = await extractPage(
            page,
            (kind, sourceKey, sku) => ShopeeEtiquetasRepository.lookupEquivalence(kind, sourceKey, sku),
            (rawSku) => ShopeeEtiquetasRepository.resolveSku(rawSku)
          )
          const memories = extracted.items.map((_item, rowOrder) =>
            ShopeeEtiquetasRepository.findExactCorrection(documentHash, page.index, rowOrder)
          )
          const rememberedOrderIds = [...new Set(memories.filter(Boolean).map((memory) => memory!.orderId))]
          const effectiveOrderId = rememberedOrderIds.length === 1 ? rememberedOrderIds[0] : extracted.orderId
          const pageId = randomUUID()
          ShopeeEtiquetasRepository.addPage({
            id: pageId,
            documentId,
            order: page.index,
            type: extracted.type,
            orderId: effectiveOrderId,
            packageNumber: extracted.packageNumber,
            method: page.method,
            confidence: extracted.confidence,
            rasterHash: page.graphic?.hash ?? null,
            rotationDegrees: extracted.sourceImage?.rotationDegrees ?? null,
            imageWidth: extracted.sourceImage?.width ?? null,
            imageHeight: extracted.sourceImage?.height ?? null,
            warnings: extracted.warnings
          })
          extracted.items.forEach((item, rowOrder) => {
            const memory = memories[rowOrder]
            if (memory) ShopeeEtiquetasRepository.markExactCorrectionUsed(memory.id)
            const resolved = applyExactCorrection(item, memory, effectiveOrderId)
            ShopeeEtiquetasRepository.addItem({
              id: randomUUID(),
              paginaId: pageId,
              rowOrder,
              orderId: resolved.orderId,
              ...resolved.item,
              reviewRequired: resolved.item.reviewRequired || !resolved.orderId,
              reviewReason: resolved.item.reviewReason ?? (!resolved.orderId ? 'Pedido não identificado.' : null)
            })
          })
        }
      }
    }
    LocalOcrService.setProgressListener(null)
    const structuralIssues = this.validateAndGroup(batchId)
    const reviewCount = ShopeeEtiquetasRepository.countReviewIssues(batchId)
    if (structuralIssues > 0 || reviewCount > 0) {
      const message = `${structuralIssues + reviewCount} pendência(s) precisam de revisão antes da impressão.`
      ShopeeEtiquetasRepository.updateBatch(batchId, 'revisao', 80, 'REVIEW_REQUIRED', message)
      this.emit({ loteId: batchId, status: 'revisao', progress: 80, message })
      return
    }
    this.update(batchId, 'pronto', 82, 'Extração validada')
    await this.printAndGenerate(batchId)
  }

  private static validateAndGroup(batchId: string): number {
    const pages = ShopeeEtiquetasRepository.getBatchPages(batchId)
    let issues = 0
    let segmentStart = -1
    const closeSegment = (start: number, end: number) => {
      if (start < 0) return
      const segment = pages.slice(start, end)
      const checklistOrderIds = [...new Set(segment.filter((page) => page.type === 'checklist' && page.orderId).map((page) => page.orderId!))]
      const orderIds = checklistOrderIds.length
        ? checklistOrderIds
        : [...new Set(segment.filter((page) => page.orderId).map((page) => page.orderId!))]
      if (orderIds.length === 1) {
        for (const page of segment) {
          if (!page.orderId || (page.type === 'envio' && page.orderId !== orderIds[0])) {
            page.orderId = orderIds[0]
            ShopeeEtiquetasRepository.setPageOrderId(page.id, orderIds[0])
          }
        }
      } else {
        for (const page of segment) ShopeeEtiquetasRepository.requirePageReview(page.id, 'Não foi possível agrupar a etiqueta ao pedido.')
        issues += 1
      }
    }
    for (let index = 0; index < pages.length; index += 1) {
      if (pages[index].type === 'envio') {
        closeSegment(segmentStart, index)
        segmentStart = index
      }
    }
    closeSegment(segmentStart, pages.length)

    for (const page of pages) {
      if (page.type === 'desconhecida' || !page.orderId) {
        ShopeeEtiquetasRepository.requirePageReview(page.id, 'Página sem tipo ou pedido confirmado.')
        issues += 1
      }
      if (page.type === 'checklist' && page.itemCount === 0) {
        ShopeeEtiquetasRepository.requirePageReview(page.id, 'Checklist sem linhas reconhecidas.')
        issues += 1
      }
    }
    const groups = new Map<string, typeof pages>()
    for (const page of pages.filter((candidate) => candidate.orderId)) {
      if (!groups.has(page.orderId!)) groups.set(page.orderId!, [])
      groups.get(page.orderId!)!.push(page)
    }
    for (const group of groups.values()) {
      const shipping = group.filter((page) => page.type === 'envio')
      const checklists = group.filter((page) => page.type === 'checklist')
      if (shipping.length !== 1 || checklists.length < 1) {
        for (const page of group) ShopeeEtiquetasRepository.requirePageReview(page.id, 'O pedido precisa de uma etiqueta de envio e ao menos uma checklist.')
        issues += 1
      }
      const packages = checklists.filter((page) => page.packageNumber !== null).map((page) => page.packageNumber)
      if (new Set(packages).size !== packages.length) {
        for (const page of checklists) ShopeeEtiquetasRepository.requirePageReview(page.id, 'Pacote/página duplicado no pedido.')
        issues += 1
      }
      const hashes = group.filter((page) => page.rasterHash).map((page) => page.rasterHash)
      if (new Set(hashes).size !== hashes.length) {
        for (const page of group) ShopeeEtiquetasRepository.requirePageReview(page.id, 'Página gráfica duplicada no pedido.')
        issues += 1
      }
    }
    return issues
  }

  private static async printAndGenerate(batchId: string): Promise<void> {
    const documents = ShopeeEtiquetasRepository.getBatchDocuments(batchId)
    if (!ZebraPrinterService.getPrinter()) {
      const message = 'Configure a impressora Zebra para concluir o lote.'
      ShopeeEtiquetasRepository.updateBatch(batchId, 'impressao_pendente', 82, 'PRINTER_NOT_CONFIGURED', message)
      this.emit({ loteId: batchId, status: 'impressao_pendente', progress: 82, message })
      return
    }
    this.update(batchId, 'imprimindo', 85, 'Enviando ZPL original à Zebra')
    for (let index = 0; index < documents.length; index += 1) {
      const document = documents[index]
      if (document.printStatus === 'impresso') continue
      try {
        const result = await ZebraPrinterService.printDocument(document.id)
        if (!result.ok) throw new Error(result.error || 'Falha ao enviar o ZPL ao spooler.')
        ShopeeEtiquetasRepository.setDocumentPrint(document.id, 'impresso')
      } catch (error: any) {
        const message = error?.message || 'Falha na impressão RAW.'
        ShopeeEtiquetasRepository.setDocumentPrint(document.id, 'falhou', message)
        ShopeeEtiquetasRepository.updateBatch(batchId, 'impressao_pendente', 85, 'PRINT_FAILED', message)
        this.emit({ loteId: batchId, status: 'impressao_pendente', progress: 85, message })
        return
      }
      this.emit({
        loteId: batchId,
        status: 'imprimindo',
        progress: 85 + Math.round(((index + 1) / documents.length) * 7),
        message: `Documento ${index + 1} de ${documents.length} aceito pelo spooler`
      })
    }
    ShopeeEtiquetasRepository.markPrinted(batchId)
    await this.generatePdf(batchId, true)
  }

  private static async generatePdf(batchId: string, openAfter: boolean): Promise<void> {
    this.update(batchId, 'gerando_pdf', 94, 'Gerando mapa consolidado de cortes')
    try {
      const batch = ShopeeEtiquetasRepository.getBatch(batchId)
      if (!batch) throw new Error('Lote não encontrado.')
      const pdfPath = await CutPdfService.generate(batchId, batch.items)
      ShopeeEtiquetasRepository.setPdf(batchId, pdfPath)
      ShopeeEtiquetasRepository.updateBatch(batchId, 'concluido', 100)
      this.emit({ loteId: batchId, status: 'concluido', progress: 100, message: 'PDF de cortes concluído' })
      if (openAfter && process.env.NODE_ENV !== 'test') await CutPdfService.open(pdfPath).catch(() => undefined)
      await this.cleanupExpiredFiles()
    } catch (error: any) {
      const message = error?.message || 'Falha ao gerar o PDF.'
      ShopeeEtiquetasRepository.updateBatch(batchId, 'pdf_pendente', 94, 'PDF_FAILED', message)
      this.emit({ loteId: batchId, status: 'pdf_pendente', progress: 94, message })
    }
  }

  static resumeBatch(batchId: string): ShopeeEtiquetaActionResult {
    const batch = ShopeeEtiquetasRepository.getBatch(batchId)
    if (!batch) return { ok: false, error: 'Lote não encontrado.' }
    if (ShopeeEtiquetasRepository.countReviewIssues(batchId) > 0) return { ok: false, error: 'Ainda existem itens que precisam de revisão.' }
    const structuralIssues = this.validateAndGroup(batchId)
    if (structuralIssues > 0) return { ok: false, error: 'A estrutura de páginas do lote ainda é inválida.' }
    this.enqueue(batchId, () => this.printAndGenerate(batchId))
    return { ok: true, loteId: batchId }
  }

  static retryPrinting(batchId: string): ShopeeEtiquetaActionResult {
    const batch = ShopeeEtiquetasRepository.getBatch(batchId)
    if (!batch) return { ok: false, error: 'Lote não encontrado.' }
    const reviewIssues = ShopeeEtiquetasRepository.countReviewIssues(batchId)
    if (!canRetryShopeePrinting(batch.status, reviewIssues)) {
      return { ok: false, error: 'Somente lotes com impressão pendente ou incerta podem ser reenviados.' }
    }
    if (this.validateAndGroup(batchId) > 0) {
      return { ok: false, error: 'O lote possui revisões pendentes e não pode ser impresso.' }
    }
    this.enqueue(batchId, () => this.printAndGenerate(batchId))
    return { ok: true, loteId: batchId }
  }

  static confirmPrinted(batchId: string): ShopeeEtiquetaActionResult {
    const batch = ShopeeEtiquetasRepository.getBatch(batchId)
    if (!batch) return { ok: false, error: 'Lote não encontrado.' }
    if (batch.status !== 'impressao_incerta') {
      return { ok: false, error: 'Somente uma impressão incerta pode ser confirmada manualmente.' }
    }
    ShopeeEtiquetasRepository.markBatchDocumentsPrinted(batchId)
    ShopeeEtiquetasRepository.markPrinted(batchId)
    this.enqueue(batchId, () => this.generatePdf(batchId, true))
    return { ok: true, loteId: batchId }
  }

  static regeneratePdf(batchId: string): ShopeeEtiquetaActionResult {
    const documents = ShopeeEtiquetasRepository.getBatchDocuments(batchId)
    if (!documents.length || documents.some((document) => document.printStatus !== 'impresso')) {
      return { ok: false, error: 'O PDF só pode ser gerado após a impressão de todos os documentos.' }
    }
    this.enqueue(batchId, () => this.generatePdf(batchId, true))
    return { ok: true, loteId: batchId }
  }

  static async openPdf(batchId: string): Promise<ShopeeEtiquetaActionResult> {
    const pdfPath = ShopeeEtiquetasRepository.getPdfPath(batchId)
    if (!pdfPath) return { ok: false, error: 'PDF não encontrado ou expirado.' }
    try {
      await CutPdfService.open(pdfPath)
      return { ok: true, loteId: batchId }
    } catch (error: any) {
      return { ok: false, error: error?.message || 'Falha ao abrir o PDF.' }
    }
  }

  static async deleteBatch(batchId: string): Promise<ShopeeEtiquetaActionResult> {
    const batch = ShopeeEtiquetasRepository.getBatch(batchId)
    if (!batch) return { ok: false, error: 'Lote não encontrado.' }
    const documents = ShopeeEtiquetasRepository.getBatchDocuments(batchId)
    if (documents.some((document) => document.printStatus === 'impresso')) {
      return { ok: false, error: 'Este lote possui impressão aceita e não pode ser excluído.' }
    }
    if (!canDeleteShopeeBatch(batch.status, documents.map((document) => document.printStatus))) {
      return { ok: false, error: 'Este lote está em processamento ou possui histórico protegido e não pode ser excluído.' }
    }

    if (batch.status === 'recebido') this.cancelledBatches.add(batchId)
    try {
      const batchDirectory = resolveShopeeBatchDirectory(app.getPath('userData'), batchId)
      const trainingRoot = path.resolve(app.getPath('userData'), 'shopee', 'etiquetas', 'treinamento')
      for (const relativePath of ShopeeEtiquetasRepository.getBatchTrainingSamplePaths(batchId)) {
        const samplePath = path.resolve(trainingRoot, relativePath)
        const relative = path.relative(trainingRoot, samplePath)
        if (relative && !relative.startsWith('..') && !path.isAbsolute(relative) &&
          !ShopeeEtiquetasRepository.isTrainingSamplePathReferencedOutsideBatch(relativePath, batchId)) {
          await fs.rm(samplePath, { force: true })
        }
      }
      await fs.rm(batchDirectory, { recursive: true, force: true })
      if (!ShopeeEtiquetasRepository.deleteBatch(batchId)) throw new Error('O lote não pôde ser removido do histórico.')
      return { ok: true, loteId: batchId }
    } catch (error: any) {
      if (batch.status === 'recebido') this.cancelledBatches.delete(batchId)
      return { ok: false, error: error?.message || 'Falha ao excluir o lote.' }
    }
  }

  static async cleanupExpiredFiles(): Promise<void> {
    const expired = ShopeeEtiquetasRepository.expiredFiles(new Date().toISOString())
    const batches = new Map<string, Set<string>>()
    for (const row of expired) {
      if (!batches.has(row.batchId)) batches.set(row.batchId, new Set())
      if (row.storedPath) batches.get(row.batchId)!.add(row.storedPath)
      if (row.pdfPath) batches.get(row.batchId)!.add(row.pdfPath)
    }
    for (const [batchId, files] of batches) {
      for (const file of files) await fs.unlink(file).catch(() => undefined)
      ShopeeEtiquetasRepository.markFilesExpired(batchId)
    }
  }
}
