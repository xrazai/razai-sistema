import { randomUUID } from 'node:crypto'
import { getDb } from '../../database/db'
import type {
  ShopeeEtiquetaCorrecaoInput,
  ShopeeEtiquetaEquivalencia,
  ShopeeEtiquetaEquivalenciaInput,
  ShopeeEtiquetaItem,
  ShopeeEtiquetaLoteDetalhe,
  ShopeeEtiquetaLoteResumo,
  ShopeeEtiquetaLoteStatus,
  ShopeeEtiquetaLearningStats,
  ShopeeEtiquetaValidationSource
} from '../../../shared/shopee-etiquetas'
import { normalizeKey, normalizeSku, resolveKnownSku, type SkuResolution } from './normalizer'

export type ShopeeExactCorrectionMemory = {
  id: string
  orderId: string
  productRaw: string
  variationRaw: string
  fabricName: string
  colorName: string
  cutMm: number
  widthMm: number | null
  quantity: number
  sku: string
}

type LoteRow = {
  id: string
  status: ShopeeEtiquetaLoteStatus
  progress: number
  error_message: string | null
  pdf_path: string | null
  created_at: string
  updated_at: string
  expires_at: string
  files_expired_at: string | null
  file_count: number
  page_count: number
  order_count: number
  item_count: number
  review_count: number
}

function mapSummary(row: LoteRow): ShopeeEtiquetaLoteResumo {
  return {
    id: row.id,
    status: row.status,
    progress: row.progress,
    errorMessage: row.error_message,
    pdfAvailable: Boolean(row.pdf_path && !row.files_expired_at),
    fileCount: row.file_count,
    pageCount: row.page_count,
    orderCount: row.order_count,
    itemCount: row.item_count,
    reviewCount: row.review_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    expiresAt: row.expires_at,
    filesExpiredAt: row.files_expired_at
  }
}

const summarySql = `
  SELECT l.*,
    (SELECT COUNT(*) FROM shopee_etiqueta_arquivos a WHERE a.lote_id = l.id) AS file_count,
    (SELECT COUNT(*) FROM shopee_etiqueta_paginas p
      JOIN shopee_etiqueta_documentos d ON d.id = p.documento_id
      JOIN shopee_etiqueta_arquivos a ON a.id = d.arquivo_id WHERE a.lote_id = l.id) AS page_count,
    (SELECT COUNT(DISTINCT p.order_id) FROM shopee_etiqueta_paginas p
      JOIN shopee_etiqueta_documentos d ON d.id = p.documento_id
      JOIN shopee_etiqueta_arquivos a ON a.id = d.arquivo_id
      WHERE a.lote_id = l.id AND p.order_id IS NOT NULL) AS order_count,
    (SELECT COUNT(*) FROM shopee_etiqueta_itens i
      JOIN shopee_etiqueta_paginas p ON p.id = i.pagina_id
      JOIN shopee_etiqueta_documentos d ON d.id = p.documento_id
      JOIN shopee_etiqueta_arquivos a ON a.id = d.arquivo_id WHERE a.lote_id = l.id) AS item_count,
    (SELECT COUNT(*) FROM shopee_etiqueta_itens i
      JOIN shopee_etiqueta_paginas p ON p.id = i.pagina_id
      JOIN shopee_etiqueta_documentos d ON d.id = p.documento_id
      JOIN shopee_etiqueta_arquivos a ON a.id = d.arquivo_id
      WHERE a.lote_id = l.id AND i.review_required = 1) AS review_count
  FROM shopee_etiqueta_lotes l
`

export class ShopeeEtiquetasRepository {
  static createBatch(id: string, now: string, expiresAt: string): void {
    getDb().prepare(`
      INSERT INTO shopee_etiqueta_lotes (id, status, progress, expires_at, created_at, updated_at)
      VALUES (?, 'recebido', 0, ?, ?, ?)
    `).run(id, expiresAt, now, now)
  }

  static updateBatch(
    id: string,
    status: ShopeeEtiquetaLoteStatus,
    progress: number,
    errorCode: string | null = null,
    errorMessage: string | null = null
  ): void {
    getDb().prepare(`
      UPDATE shopee_etiqueta_lotes
      SET status = ?, progress = ?, error_code = ?, error_message = ?, updated_at = ?
      WHERE id = ?
    `).run(status, Math.max(0, Math.min(100, Math.round(progress))), errorCode, errorMessage, new Date().toISOString(), id)
  }

  static setPdf(id: string, pdfPath: string): void {
    const now = new Date().toISOString()
    getDb().prepare(`
      UPDATE shopee_etiqueta_lotes
      SET pdf_path = ?, pdf_generated_at = ?, updated_at = ? WHERE id = ?
    `).run(pdfPath, now, now, id)
  }

  static markPrinted(id: string): void {
    const now = new Date().toISOString()
    getDb().prepare(`UPDATE shopee_etiqueta_lotes SET printed_at = ?, updated_at = ? WHERE id = ?`).run(now, now, id)
  }

  static addFile(input: {
    id: string
    batchId: string
    name: string
    storedPath: string
    hash: string
    byteSize: number
    order: number
    expiresAt: string
  }): void {
    getDb().prepare(`
      INSERT INTO shopee_etiqueta_arquivos
        (id, lote_id, original_name, stored_path, source_hash, byte_size, source_order, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(input.id, input.batchId, input.name, input.storedPath, input.hash, input.byteSize, input.order, input.expiresAt)
  }

  static addDocument(input: {
    id: string
    fileId: string
    entryName: string
    hash: string
    byteSize: number
    order: number
  }): void {
    getDb().prepare(`
      INSERT INTO shopee_etiqueta_documentos
        (id, arquivo_id, entry_name, document_hash, byte_size, document_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(input.id, input.fileId, input.entryName, input.hash, input.byteSize, input.order)
  }

  static addPage(input: {
    id: string
    documentId: string
    order: number
    type: string
    orderId: string | null
    packageNumber: number | null
    method: string
    confidence: number
    rasterHash: string | null
    rotationDegrees: number | null
    imageWidth: number | null
    imageHeight: number | null
    warnings: string[]
  }): void {
    getDb().prepare(`
      INSERT INTO shopee_etiqueta_paginas
        (id, documento_id, page_order, page_type, order_id, package_number, extraction_method, confidence,
         raster_hash, rotation_degrees, image_width, image_height, warnings_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      input.id,
      input.documentId,
      input.order,
      input.type,
      input.orderId,
      input.packageNumber,
      input.method,
      input.confidence,
      input.rasterHash,
      input.rotationDegrees,
      input.imageWidth,
      input.imageHeight,
      JSON.stringify(input.warnings)
    )
  }

  static addItem(input: Omit<ShopeeEtiquetaItem,
    'id' | 'sourcePreviewAvailable' | 'sourcePreviewUnavailableReason' | 'validationSource' | 'reviewReason'> & {
    id: string
    quantityRaw: string
    skuRaw: string
    validationSource: ShopeeEtiquetaValidationSource
    reviewReason: string | null
    sourceBounds: { x: number; y: number; width: number; height: number } | null
  }): void {
    getDb().prepare(`
      INSERT INTO shopee_etiqueta_itens
        (id, pagina_id, row_order, order_id, product_raw, variation_raw, fabric_raw, color_raw,
         quantity, sku, fabric_name, color_name, cut_mm, width_mm, confidence, review_required,
         source_x, source_y, source_width, source_height, ocr_product_raw, ocr_variation_raw,
         ocr_quantity_raw, ocr_sku_raw, ocr_confidence, validation_source, review_reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      input.id,
      input.paginaId,
      input.rowOrder,
      input.orderId,
      input.productRaw,
      input.variationRaw,
      input.fabricRaw,
      input.colorRaw,
      input.quantity,
      input.sku,
      input.fabricName,
      input.colorName,
      input.cutMm,
      input.widthMm,
      input.confidence,
      input.reviewRequired ? 1 : 0,
      input.sourceBounds?.x ?? null,
      input.sourceBounds?.y ?? null,
      input.sourceBounds?.width ?? null,
      input.sourceBounds?.height ?? null,
      input.productRaw,
      input.variationRaw,
      input.quantityRaw,
      input.skuRaw,
      input.confidence,
      input.validationSource,
      input.reviewReason
    )
  }

  static setPageOrderId(pageId: string, orderId: string): void {
    getDb().prepare(`UPDATE shopee_etiqueta_paginas SET order_id = ? WHERE id = ?`).run(orderId, pageId)
    getDb().prepare(`UPDATE shopee_etiqueta_itens SET order_id = ? WHERE pagina_id = ?`).run(orderId, pageId)
  }

  static requirePageReview(pageId: string, warning: string): void {
    const row = getDb().prepare(`SELECT warnings_json FROM shopee_etiqueta_paginas WHERE id = ?`).get(pageId) as { warnings_json: string } | undefined
    const warnings = row ? JSON.parse(row.warnings_json) as string[] : []
    if (!warnings.includes(warning)) warnings.push(warning)
    getDb().prepare(`UPDATE shopee_etiqueta_paginas SET warnings_json = ? WHERE id = ?`).run(JSON.stringify(warnings), pageId)
    getDb().prepare(`
      UPDATE shopee_etiqueta_itens SET review_required = 1, review_reason = ? WHERE pagina_id = ?
    `).run(warning, pageId)
  }

  static countReviewIssues(batchId: string): number {
    const row = getDb().prepare(`
      SELECT
        (SELECT COUNT(*) FROM shopee_etiqueta_itens i
          JOIN shopee_etiqueta_paginas p ON p.id = i.pagina_id
          JOIN shopee_etiqueta_documentos d ON d.id = p.documento_id
          JOIN shopee_etiqueta_arquivos a ON a.id = d.arquivo_id
          WHERE a.lote_id = ? AND i.review_required = 1) +
        (SELECT COUNT(*) FROM shopee_etiqueta_paginas p
          JOIN shopee_etiqueta_documentos d ON d.id = p.documento_id
          JOIN shopee_etiqueta_arquivos a ON a.id = d.arquivo_id
          WHERE a.lote_id = ? AND (p.page_type = 'desconhecida' OR p.order_id IS NULL)) AS total
    `).get(batchId, batchId) as { total: number }
    return row.total
  }

  static getBatchDocuments(id: string): Array<{ id: string; printStatus: string }> {
    return getDb().prepare(`
      SELECT d.id, d.print_status AS printStatus FROM shopee_etiqueta_documentos d
      JOIN shopee_etiqueta_arquivos a ON a.id = d.arquivo_id
      WHERE a.lote_id = ? ORDER BY a.source_order, d.document_order
    `).all(id) as Array<{ id: string; printStatus: string }>
  }

  static getBatchFiles(id: string): Array<{ id: string; storedPath: string; name: string; order: number; expiresAt: string }> {
    return getDb().prepare(`
      SELECT id, stored_path AS storedPath, original_name AS name, source_order AS 'order', expires_at AS expiresAt
      FROM shopee_etiqueta_arquivos WHERE lote_id = ? AND stored_path IS NOT NULL ORDER BY source_order
    `).all(id) as Array<{ id: string; storedPath: string; name: string; order: number; expiresAt: string }>
  }

  static getBatchPages(id: string): Array<{
    id: string
    type: string
    orderId: string | null
    packageNumber: number | null
    rasterHash: string | null
    documentOrder: number
    sourceOrder: number
    pageOrder: number
    itemCount: number
  }> {
    return getDb().prepare(`
      SELECT p.id, p.page_type AS type, p.order_id AS orderId, p.package_number AS packageNumber,
             p.raster_hash AS rasterHash, d.document_order AS documentOrder, a.source_order AS sourceOrder,
             p.page_order AS pageOrder,
             (SELECT COUNT(*) FROM shopee_etiqueta_itens i WHERE i.pagina_id = p.id) AS itemCount
      FROM shopee_etiqueta_paginas p
      JOIN shopee_etiqueta_documentos d ON d.id = p.documento_id
      JOIN shopee_etiqueta_arquivos a ON a.id = d.arquivo_id
      WHERE a.lote_id = ? ORDER BY a.source_order, d.document_order, p.page_order
    `).all(id) as any
  }

  static resetExtraction(id: string): void {
    getDb().prepare(`
      DELETE FROM shopee_etiqueta_documentos WHERE arquivo_id IN
        (SELECT id FROM shopee_etiqueta_arquivos WHERE lote_id = ?)
    `).run(id)
  }

  static recoverableExtractionBatches(): string[] {
    return (getDb().prepare(`
      SELECT id FROM shopee_etiqueta_lotes WHERE status IN ('recebido', 'extraindo', 'pronto') ORDER BY created_at
    `).all() as Array<{ id: string }>).map((row) => row.id)
  }

  static lookupEquivalence(kind: 'tecido' | 'cor', sourceKey: string, sku: string): string | null {
    const db = getDb()
    const normalizedSourceKey = normalizeKey(sourceKey)
    const normalizedSku = normalizeSku(sku)
    const bySku = normalizedSku
      ? db.prepare(`
          SELECT canonical_value FROM shopee_etiqueta_equivalencias
          WHERE kind = ? AND source_key = ? AND sku = ? LIMIT 1
        `).get(kind, normalizedSourceKey, normalizedSku) as { canonical_value: string } | undefined
      : undefined
    if (bySku) return bySku.canonical_value
    const exact = db.prepare(`
      SELECT canonical_value FROM shopee_etiqueta_equivalencias
      WHERE kind = ? AND source_key = ? AND sku = '' LIMIT 1
    `).get(kind, normalizedSourceKey) as { canonical_value: string } | undefined
    if (exact) return exact.canonical_value
    const aliases = db.prepare(`
      SELECT source_key, canonical_value FROM shopee_etiqueta_equivalencias
      WHERE kind = ? AND sku = '' ORDER BY length(source_key) DESC
    `).all(kind) as Array<{ source_key: string; canonical_value: string }>
    const matches = aliases.filter((alias) =>
      normalizedSourceKey === alias.source_key || normalizedSourceKey.startsWith(`${alias.source_key} `) ||
      normalizedSourceKey.endsWith(` ${alias.source_key}`) || normalizedSourceKey.includes(` ${alias.source_key} `)
    )
    if (!matches.length) return null
    const longest = matches[0].source_key.length
    const best = [...new Set(matches.filter((match) => match.source_key.length === longest).map((match) => match.canonical_value))]
    return best.length === 1 ? best[0] : null
  }

  static resolveSku(rawSku: string): SkuResolution {
    const sourceKey = normalizeKey(rawSku)
    const alias = getDb().prepare(`
      SELECT canonical_value FROM shopee_etiqueta_equivalencias
      WHERE kind = 'sku' AND source_key = ? AND sku = '' LIMIT 1
    `).get(sourceKey) as { canonical_value: string } | undefined
    const known = getDb().prepare(`
      SELECT canonical_value AS sku FROM shopee_etiqueta_equivalencias WHERE kind = 'sku'
      UNION SELECT sku FROM shopee_etiqueta_correcoes_memoria
      UNION SELECT sku FROM shopee_etiqueta_itens WHERE validation_source IN ('manual', 'exact_memory')
    `).all() as Array<{ sku: string }>
    return resolveKnownSku(rawSku, known.map((row) => row.sku), alias?.canonical_value ?? null)
  }

  static findExactCorrection(documentHash: string, pageOrder: number, rowOrder: number): ShopeeExactCorrectionMemory | null {
    const row = getDb().prepare(`
      SELECT id, order_id, product_raw, variation_raw, fabric_name, color_name,
             cut_mm, width_mm, quantity, sku
      FROM shopee_etiqueta_correcoes_memoria
      WHERE document_hash = ? AND page_order = ? AND row_order = ? LIMIT 1
    `).get(documentHash, pageOrder, rowOrder) as Record<string, any> | undefined
    if (!row) return null
    return {
      id: row.id,
      orderId: row.order_id,
      productRaw: row.product_raw,
      variationRaw: row.variation_raw,
      fabricName: row.fabric_name,
      colorName: row.color_name,
      cutMm: row.cut_mm,
      widthMm: row.width_mm,
      quantity: row.quantity,
      sku: row.sku
    }
  }

  static markExactCorrectionUsed(id: string): void {
    getDb().prepare(`
      UPDATE shopee_etiqueta_correcoes_memoria
      SET use_count = use_count + 1, last_used_at = ?, updated_at = ? WHERE id = ?
    `).run(new Date().toISOString(), new Date().toISOString(), id)
  }

  static listBatches(): ShopeeEtiquetaLoteResumo[] {
    return (getDb().prepare(`${summarySql} ORDER BY l.created_at DESC LIMIT 100`).all() as LoteRow[]).map(mapSummary)
  }

  static getBatch(id: string): ShopeeEtiquetaLoteDetalhe | null {
    const row = getDb().prepare(`${summarySql} WHERE l.id = ?`).get(id) as LoteRow | undefined
    if (!row) return null
    const documents = getDb().prepare(`
      SELECT d.id, d.arquivo_id, d.entry_name, d.document_hash, d.byte_size, d.document_order,
             d.print_status, d.print_error, d.printed_at
      FROM shopee_etiqueta_documentos d
      JOIN shopee_etiqueta_arquivos a ON a.id = d.arquivo_id
      WHERE a.lote_id = ? ORDER BY a.source_order, d.document_order
    `).all(id) as Array<Record<string, any>>
    const items = getDb().prepare(`
      SELECT i.*, p.extraction_method, p.rotation_degrees, p.image_width, p.image_height,
             a.stored_path, a.expired_at
      FROM shopee_etiqueta_itens i
      JOIN shopee_etiqueta_paginas p ON p.id = i.pagina_id
      JOIN shopee_etiqueta_documentos d ON d.id = p.documento_id
      JOIN shopee_etiqueta_arquivos a ON a.id = d.arquivo_id
      WHERE a.lote_id = ? ORDER BY a.source_order, d.document_order, p.page_order, i.row_order
    `).all(id) as Array<Record<string, any>>
    return {
      ...mapSummary(row),
      documents: documents.map((document) => ({
        id: document.id,
        arquivoId: document.arquivo_id,
        entryName: document.entry_name,
        documentHash: document.document_hash,
        byteSize: document.byte_size,
        documentOrder: document.document_order,
        printStatus: document.print_status,
        printError: document.print_error,
        printedAt: document.printed_at
      })),
      items: items.map((item) => {
        const hasGeometry = item.rotation_degrees !== null && item.image_width !== null &&
          item.image_height !== null && item.source_x !== null && item.source_y !== null &&
          item.source_width !== null && item.source_height !== null
        const sourcePreviewUnavailableReason: ShopeeEtiquetaItem['sourcePreviewUnavailableReason'] = item.extraction_method !== 'z64' ? 'text_source'
          : !item.stored_path || item.expired_at !== null ? 'file_expired'
            : !hasGeometry ? 'reimport_required' : null
        return {
          id: item.id,
          paginaId: item.pagina_id,
          rowOrder: item.row_order,
          orderId: item.order_id,
          productRaw: item.product_raw,
          variationRaw: item.variation_raw,
          fabricRaw: item.fabric_raw,
          colorRaw: item.color_raw,
          quantity: item.quantity,
          sku: item.sku,
          fabricName: item.fabric_name,
          colorName: item.color_name,
          cutMm: item.cut_mm,
          widthMm: item.width_mm,
          confidence: item.ocr_confidence ?? item.confidence,
          validationSource: item.validation_source as ShopeeEtiquetaValidationSource,
          reviewReason: item.review_reason,
          reviewRequired: item.review_required === 1,
          sourcePreviewAvailable: sourcePreviewUnavailableReason === null,
          sourcePreviewUnavailableReason
        }
      })
    }
  }

  static correctItem(input: ShopeeEtiquetaCorrecaoInput): string | null {
    const db = getDb()
    const row = db.prepare(`
      SELECT i.*, p.page_order, d.document_hash
      FROM shopee_etiqueta_itens i
      JOIN shopee_etiqueta_paginas p ON p.id = i.pagina_id
      JOIN shopee_etiqueta_documentos d ON d.id = p.documento_id
      WHERE i.id = ?
    `).get(input.itemId) as Record<string, any> | undefined
    if (!row) return null
    const valid = Boolean(
      input.orderId.trim() && input.productRaw.trim() && input.variationRaw.trim() && input.fabricName.trim() &&
      input.colorName.trim() && input.cutMm > 0 && input.quantity > 0 && input.sku.trim()
    )
    db.transaction(() => {
      db.prepare(`
        UPDATE shopee_etiqueta_itens
        SET order_id = ?, product_raw = ?, variation_raw = ?, fabric_name = ?, color_name = ?,
            cut_mm = ?, width_mm = ?, quantity = ?, sku = ?, validation_source = 'manual',
            review_reason = NULL, review_required = ?
        WHERE id = ?
      `).run(
        input.orderId.trim(), input.productRaw.trim(), input.variationRaw.trim(), input.fabricName.trim(),
        input.colorName.trim(), input.cutMm, input.widthMm, input.quantity, input.sku.trim().toUpperCase(),
        valid ? 0 : 1, input.itemId
      )
      db.prepare(`UPDATE shopee_etiqueta_paginas SET order_id = ? WHERE id = ?`).run(input.orderId.trim(), row.pagina_id)
      if (input.rememberFabric !== false) {
        this.saveEquivalence({ kind: 'tecido', source: row.ocr_product_raw || input.productRaw, sku: input.sku, canonicalValue: input.fabricName })
      }
      if (input.rememberColor !== false) {
        this.saveEquivalence({ kind: 'cor', source: row.color_raw || input.colorName, sku: input.sku, canonicalValue: input.colorName })
      }
      if (valid && input.rememberSku !== false && normalizeSku(row.ocr_sku_raw) && normalizeSku(row.ocr_sku_raw) !== normalizeSku(input.sku)) {
        this.saveEquivalence({ kind: 'sku', source: row.ocr_sku_raw, canonicalValue: input.sku })
      }
      if (valid && input.rememberExact !== false) {
        const now = new Date().toISOString()
        db.prepare(`
          INSERT INTO shopee_etiqueta_correcoes_memoria
            (id, document_hash, page_order, row_order, order_id, product_raw, variation_raw,
             fabric_name, color_name, cut_mm, width_mm, quantity, sku, source_item_id,
             created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(document_hash, page_order, row_order) DO UPDATE SET
            order_id = excluded.order_id, product_raw = excluded.product_raw,
            variation_raw = excluded.variation_raw, fabric_name = excluded.fabric_name,
            color_name = excluded.color_name, cut_mm = excluded.cut_mm, width_mm = excluded.width_mm,
            quantity = excluded.quantity, sku = excluded.sku, source_item_id = excluded.source_item_id,
            updated_at = excluded.updated_at
        `).run(
          randomUUID(), row.document_hash, row.page_order, row.row_order, input.orderId.trim(),
          input.productRaw.trim(), input.variationRaw.trim(), input.fabricName.trim(), input.colorName.trim(),
          input.cutMm, input.widthMm, input.quantity, normalizeSku(input.sku), input.itemId, now, now
        )
      }
    })()
    const batch = db.prepare(`
      SELECT a.lote_id FROM shopee_etiqueta_itens i
      JOIN shopee_etiqueta_paginas p ON p.id = i.pagina_id
      JOIN shopee_etiqueta_documentos d ON d.id = p.documento_id
      JOIN shopee_etiqueta_arquivos a ON a.id = d.arquivo_id WHERE i.id = ?
    `).get(input.itemId) as { lote_id: string }
    return batch.lote_id
  }

  static listEquivalences(): ShopeeEtiquetaEquivalencia[] {
    const rows = getDb().prepare(`
      SELECT * FROM shopee_etiqueta_equivalencias ORDER BY kind, canonical_value, source_key
    `).all() as Array<Record<string, string>>
    return rows.map((row) => ({
      id: row.id,
      kind: row.kind as 'tecido' | 'cor' | 'sku',
      sourceKey: row.source_key,
      sku: row.sku,
      canonicalValue: row.canonical_value,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))
  }

  static saveEquivalence(input: ShopeeEtiquetaEquivalenciaInput): ShopeeEtiquetaEquivalencia {
    const db = getDb()
    const sourceKey = normalizeKey(input.source)
    const sku = (input.sku ?? '').replace(/\s+/g, '').toUpperCase()
    const canonical = input.canonicalValue.trim()
    if (!sourceKey || !canonical) throw new Error('Equivalência inválida.')
    const now = new Date().toISOString()
    const current = db.prepare(`
      SELECT id, created_at FROM shopee_etiqueta_equivalencias WHERE kind = ? AND source_key = ? AND sku = ?
    `).get(input.kind, sourceKey, sku) as { id: string; created_at: string } | undefined
    const id = current?.id ?? randomUUID()
    db.prepare(`
      INSERT INTO shopee_etiqueta_equivalencias
        (id, kind, source_key, sku, canonical_value, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(kind, source_key, sku) DO UPDATE SET
        canonical_value = excluded.canonical_value,
        updated_at = excluded.updated_at
    `).run(id, input.kind, sourceKey, sku, canonical, current?.created_at ?? now, now)
    return { id, kind: input.kind, sourceKey, sku, canonicalValue: canonical, createdAt: current?.created_at ?? now, updatedAt: now }
  }

  static deleteEquivalence(id: string): boolean {
    return getDb().prepare(`DELETE FROM shopee_etiqueta_equivalencias WHERE id = ?`).run(id).changes > 0
  }

  static addTrainingSample(input: {
    sourceItemId: string
    documentHash: string
    pageOrder: number
    rowOrder: number
    imageHash: string
    relativePath: string
    ocrJson: string
    groundTruthJson: string
    modelVersion: string
  }): boolean {
    return getDb().prepare(`
      INSERT OR IGNORE INTO shopee_etiqueta_amostras_ocr
        (id, source_item_id, document_hash, page_order, row_order, image_hash, relative_path,
         ocr_json, ground_truth_json, model_version, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      randomUUID(), input.sourceItemId, input.documentHash, input.pageOrder, input.rowOrder,
      input.imageHash, input.relativePath, input.ocrJson, input.groundTruthJson,
      input.modelVersion, new Date().toISOString()
    ).changes > 0
  }

  static getLearningStats(): ShopeeEtiquetaLearningStats {
    const row = getDb().prepare(`
      SELECT
        (SELECT COUNT(*) FROM shopee_etiqueta_correcoes_memoria) AS exactCorrections,
        (SELECT COUNT(*) FROM shopee_etiqueta_amostras_ocr) AS trainingSamples,
        (SELECT COUNT(*) FROM shopee_etiqueta_equivalencias WHERE kind = 'sku') AS skuEquivalences
    `).get() as ShopeeEtiquetaLearningStats
    return row
  }

  static getDocumentSource(documentId: string): {
    storedPath: string
    entryName: string
    documentHash: string
    printStatus: string
  } | null {
    return getDb().prepare(`
      SELECT a.stored_path AS storedPath, d.entry_name AS entryName, d.document_hash AS documentHash,
             d.print_status AS printStatus
      FROM shopee_etiqueta_documentos d
      JOIN shopee_etiqueta_arquivos a ON a.id = d.arquivo_id WHERE d.id = ?
    `).get(documentId) as any ?? null
  }

  static getItemPreviewSource(itemId: string): {
    documentId: string
    storedPath: string | null
    entryName: string
    documentHash: string
    pageOrder: number
    method: string
    rasterHash: string | null
    rotationDegrees: number | null
    imageWidth: number | null
    imageHeight: number | null
    sourceX: number | null
    sourceY: number | null
    sourceWidth: number | null
    sourceHeight: number | null
  } | null {
    return getDb().prepare(`
      SELECT d.id AS documentId, a.stored_path AS storedPath, d.entry_name AS entryName,
             d.document_hash AS documentHash, p.page_order AS pageOrder,
             p.extraction_method AS method, p.raster_hash AS rasterHash,
             p.rotation_degrees AS rotationDegrees, p.image_width AS imageWidth,
             p.image_height AS imageHeight, i.source_x AS sourceX, i.source_y AS sourceY,
             i.source_width AS sourceWidth, i.source_height AS sourceHeight
      FROM shopee_etiqueta_itens i
      JOIN shopee_etiqueta_paginas p ON p.id = i.pagina_id
      JOIN shopee_etiqueta_documentos d ON d.id = p.documento_id
      JOIN shopee_etiqueta_arquivos a ON a.id = d.arquivo_id
      WHERE i.id = ?
    `).get(itemId) as any ?? null
  }

  static getTrainingSampleData(itemId: string): {
    documentHash: string
    pageOrder: number
    rowOrder: number
    ocr: Record<string, unknown>
    groundTruth: Record<string, unknown>
  } | null {
    const row = getDb().prepare(`
      SELECT d.document_hash, p.page_order, i.row_order, i.ocr_product_raw, i.ocr_variation_raw,
             i.ocr_quantity_raw, i.ocr_sku_raw, i.ocr_confidence, i.order_id, i.product_raw,
             i.variation_raw, i.fabric_name, i.color_name, i.cut_mm, i.width_mm, i.quantity, i.sku
      FROM shopee_etiqueta_itens i
      JOIN shopee_etiqueta_paginas p ON p.id = i.pagina_id
      JOIN shopee_etiqueta_documentos d ON d.id = p.documento_id
      WHERE i.id = ? AND i.validation_source = 'manual'
    `).get(itemId) as Record<string, any> | undefined
    if (!row) return null
    return {
      documentHash: row.document_hash,
      pageOrder: row.page_order,
      rowOrder: row.row_order,
      ocr: {
        product: row.ocr_product_raw,
        variation: row.ocr_variation_raw,
        quantity: row.ocr_quantity_raw,
        sku: row.ocr_sku_raw,
        confidence: row.ocr_confidence
      },
      groundTruth: {
        product: row.product_raw,
        variation: row.variation_raw,
        fabric: row.fabric_name,
        color: row.color_name,
        cutMm: row.cut_mm,
        widthMm: row.width_mm,
        quantity: row.quantity,
        sku: row.sku
      }
    }
  }

  static setDocumentPrint(documentId: string, status: string, error: string | null = null): void {
    getDb().prepare(`
      UPDATE shopee_etiqueta_documentos
      SET print_status = ?, print_error = ?, printed_at = CASE WHEN ? = 'impresso' THEN ? ELSE printed_at END
      WHERE id = ?
    `).run(status, error, status, new Date().toISOString(), documentId)
  }

  static markBatchDocumentsPrinted(batchId: string): void {
    const now = new Date().toISOString()
    getDb().prepare(`
      UPDATE shopee_etiqueta_documentos SET print_status = 'impresso', print_error = NULL, printed_at = ?
      WHERE arquivo_id IN (SELECT id FROM shopee_etiqueta_arquivos WHERE lote_id = ?)
    `).run(now, batchId)
  }

  static getPdfPath(id: string): string | null {
    const row = getDb().prepare(`SELECT pdf_path FROM shopee_etiqueta_lotes WHERE id = ?`).get(id) as { pdf_path: string | null } | undefined
    return row?.pdf_path ?? null
  }

  static deleteBatch(id: string): boolean {
    return getDb().prepare(`DELETE FROM shopee_etiqueta_lotes WHERE id = ?`).run(id).changes > 0
  }

  static getBatchTrainingSamplePaths(id: string): string[] {
    return (getDb().prepare(`
      SELECT DISTINCT s.relative_path AS relativePath
      FROM shopee_etiqueta_amostras_ocr s
      JOIN shopee_etiqueta_itens i ON i.id = s.source_item_id
      JOIN shopee_etiqueta_paginas p ON p.id = i.pagina_id
      JOIN shopee_etiqueta_documentos d ON d.id = p.documento_id
      JOIN shopee_etiqueta_arquivos a ON a.id = d.arquivo_id
      WHERE a.lote_id = ?
    `).all(id) as Array<{ relativePath: string }>).map((row) => row.relativePath)
  }

  static isTrainingSamplePathReferencedOutsideBatch(relativePath: string, batchId: string): boolean {
    const row = getDb().prepare(`
      SELECT COUNT(*) AS total
      FROM shopee_etiqueta_amostras_ocr s
      LEFT JOIN shopee_etiqueta_itens i ON i.id = s.source_item_id
      LEFT JOIN shopee_etiqueta_paginas p ON p.id = i.pagina_id
      LEFT JOIN shopee_etiqueta_documentos d ON d.id = p.documento_id
      LEFT JOIN shopee_etiqueta_arquivos a ON a.id = d.arquivo_id
      WHERE s.relative_path = ? AND (a.lote_id IS NULL OR a.lote_id <> ?)
    `).get(relativePath, batchId) as { total: number }
    return row.total > 0
  }

  static expiredFiles(now: string): Array<{ batchId: string; storedPath: string | null; pdfPath: string | null }> {
    return getDb().prepare(`
      SELECT l.id AS batchId, a.stored_path AS storedPath, l.pdf_path AS pdfPath
      FROM shopee_etiqueta_lotes l
      LEFT JOIN shopee_etiqueta_arquivos a ON a.lote_id = l.id
      WHERE l.expires_at <= ? AND l.files_expired_at IS NULL
    `).all(now) as any
  }

  static markFilesExpired(batchId: string): void {
    const now = new Date().toISOString()
    getDb().transaction(() => {
      getDb().prepare(`UPDATE shopee_etiqueta_arquivos SET stored_path = NULL, expired_at = ? WHERE lote_id = ?`).run(now, batchId)
      getDb().prepare(`UPDATE shopee_etiqueta_lotes SET pdf_path = NULL, files_expired_at = ?, updated_at = ? WHERE id = ?`).run(now, now, batchId)
    })()
  }

  static recoverInterrupted(): void {
    getDb().prepare(`
      UPDATE shopee_etiqueta_lotes SET status = 'impressao_incerta', error_message =
        'A aplicação foi interrompida durante a impressão. Confirme as etiquetas antes de tentar novamente.', updated_at = ?
      WHERE status = 'imprimindo'
    `).run(new Date().toISOString())
    getDb().prepare(`
      UPDATE shopee_etiqueta_lotes SET status = 'pdf_pendente', error_message =
        'A geração do PDF foi interrompida e pode ser retomada sem reimprimir.', updated_at = ?
      WHERE status = 'gerando_pdf'
    `).run(new Date().toISOString())
  }
}
