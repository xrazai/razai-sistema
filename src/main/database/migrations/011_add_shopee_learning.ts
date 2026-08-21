import type { Migration } from './types'

export const m011_add_shopee_learning: Migration = {
  version: 11,
  name: 'add_shopee_learning',
  up: (db) => {
    db.exec(`
      ALTER TABLE shopee_etiqueta_itens ADD COLUMN ocr_product_raw TEXT NOT NULL DEFAULT '';
      ALTER TABLE shopee_etiqueta_itens ADD COLUMN ocr_variation_raw TEXT NOT NULL DEFAULT '';
      ALTER TABLE shopee_etiqueta_itens ADD COLUMN ocr_quantity_raw TEXT NOT NULL DEFAULT '';
      ALTER TABLE shopee_etiqueta_itens ADD COLUMN ocr_sku_raw TEXT NOT NULL DEFAULT '';
      ALTER TABLE shopee_etiqueta_itens ADD COLUMN ocr_confidence REAL;
      ALTER TABLE shopee_etiqueta_itens ADD COLUMN validation_source TEXT NOT NULL DEFAULT 'ocr'
        CHECK (validation_source IN ('ocr', 'exact_memory', 'equivalence', 'safe_rule', 'manual', 'legacy'));
      ALTER TABLE shopee_etiqueta_itens ADD COLUMN review_reason TEXT;

      UPDATE shopee_etiqueta_itens SET
        ocr_product_raw = product_raw,
        ocr_variation_raw = variation_raw,
        ocr_quantity_raw = CAST(quantity AS TEXT),
        ocr_sku_raw = sku,
        ocr_confidence = confidence,
        validation_source = 'legacy';

      CREATE TABLE IF NOT EXISTS shopee_etiqueta_correcoes_memoria (
        id TEXT PRIMARY KEY NOT NULL,
        document_hash TEXT NOT NULL,
        page_order INTEGER NOT NULL,
        row_order INTEGER NOT NULL,
        order_id TEXT NOT NULL,
        product_raw TEXT NOT NULL,
        variation_raw TEXT NOT NULL,
        fabric_name TEXT NOT NULL,
        color_name TEXT NOT NULL,
        cut_mm INTEGER NOT NULL,
        width_mm INTEGER,
        quantity INTEGER NOT NULL,
        sku TEXT NOT NULL,
        source_item_id TEXT REFERENCES shopee_etiqueta_itens(id) ON DELETE CASCADE,
        use_count INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        last_used_at TEXT,
        UNIQUE (document_hash, page_order, row_order)
      );

      CREATE INDEX IF NOT EXISTS idx_shopee_memoria_document_page_row
        ON shopee_etiqueta_correcoes_memoria(document_hash, page_order, row_order);

      INSERT OR IGNORE INTO shopee_etiqueta_correcoes_memoria
        (id, document_hash, page_order, row_order, order_id, product_raw, variation_raw,
         fabric_name, color_name, cut_mm, width_mm, quantity, sku, source_item_id,
         created_at, updated_at)
      SELECT
        lower(hex(randomblob(16))), d.document_hash, p.page_order, i.row_order, i.order_id,
        i.product_raw, i.variation_raw, i.fabric_name, i.color_name, i.cut_mm, i.width_mm,
        i.quantity, i.sku, i.id, l.updated_at, l.updated_at
      FROM shopee_etiqueta_itens i
      JOIN shopee_etiqueta_paginas p ON p.id = i.pagina_id
      JOIN shopee_etiqueta_documentos d ON d.id = p.documento_id
      JOIN shopee_etiqueta_arquivos a ON a.id = d.arquivo_id
      JOIN shopee_etiqueta_lotes l ON l.id = a.lote_id
      WHERE l.status = 'concluido' AND p.extraction_method = 'z64'
        AND i.confidence = 100 AND i.review_required = 0
        AND i.order_id <> '' AND i.fabric_name <> '' AND i.color_name <> ''
        AND i.cut_mm > 0 AND i.quantity > 0 AND i.sku <> '';

      CREATE TABLE IF NOT EXISTS shopee_etiqueta_amostras_ocr (
        id TEXT PRIMARY KEY NOT NULL,
        source_item_id TEXT REFERENCES shopee_etiqueta_itens(id) ON DELETE CASCADE,
        document_hash TEXT NOT NULL,
        page_order INTEGER NOT NULL,
        row_order INTEGER NOT NULL,
        image_hash TEXT NOT NULL,
        relative_path TEXT NOT NULL,
        ocr_json TEXT NOT NULL,
        ground_truth_json TEXT NOT NULL,
        model_version TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE (image_hash, ground_truth_json)
      );

      CREATE INDEX IF NOT EXISTS idx_shopee_amostras_document
        ON shopee_etiqueta_amostras_ocr(document_hash, page_order, row_order);

      ALTER TABLE shopee_etiqueta_equivalencias RENAME TO shopee_etiqueta_equivalencias_old;

      CREATE TABLE shopee_etiqueta_equivalencias (
        id TEXT PRIMARY KEY NOT NULL,
        kind TEXT NOT NULL CHECK (kind IN ('tecido', 'cor', 'sku')),
        source_key TEXT NOT NULL,
        sku TEXT NOT NULL DEFAULT '',
        canonical_value TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE (kind, source_key, sku)
      );

      INSERT INTO shopee_etiqueta_equivalencias
        (id, kind, source_key, sku, canonical_value, created_at, updated_at)
      SELECT id, kind, source_key, sku, canonical_value, created_at, updated_at
      FROM shopee_etiqueta_equivalencias_old;

      DROP TABLE shopee_etiqueta_equivalencias_old;

      CREATE INDEX IF NOT EXISTS idx_shopee_equivalencias_lookup
        ON shopee_etiqueta_equivalencias(kind, source_key, sku);
    `)
  }
}
