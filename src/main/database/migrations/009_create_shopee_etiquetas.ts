import type { Migration } from './types'

export const m009_create_shopee_etiquetas: Migration = {
  version: 9,
  name: 'create_shopee_etiquetas',
  up: (db) => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS shopee_etiqueta_lotes (
        id TEXT PRIMARY KEY NOT NULL,
        status TEXT NOT NULL DEFAULT 'recebido',
        progress INTEGER NOT NULL DEFAULT 0,
        error_code TEXT,
        error_message TEXT,
        pdf_path TEXT,
        printed_at TEXT,
        pdf_generated_at TEXT,
        expires_at TEXT NOT NULL,
        files_expired_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS shopee_etiqueta_arquivos (
        id TEXT PRIMARY KEY NOT NULL,
        lote_id TEXT NOT NULL REFERENCES shopee_etiqueta_lotes(id) ON DELETE CASCADE,
        original_name TEXT NOT NULL,
        stored_path TEXT,
        source_hash TEXT NOT NULL,
        byte_size INTEGER NOT NULL,
        source_order INTEGER NOT NULL,
        expires_at TEXT NOT NULL,
        expired_at TEXT
      );

      CREATE TABLE IF NOT EXISTS shopee_etiqueta_documentos (
        id TEXT PRIMARY KEY NOT NULL,
        arquivo_id TEXT NOT NULL REFERENCES shopee_etiqueta_arquivos(id) ON DELETE CASCADE,
        entry_name TEXT NOT NULL,
        document_hash TEXT NOT NULL,
        byte_size INTEGER NOT NULL,
        document_order INTEGER NOT NULL,
        print_status TEXT NOT NULL DEFAULT 'pendente',
        print_error TEXT,
        printed_at TEXT
      );

      CREATE TABLE IF NOT EXISTS shopee_etiqueta_paginas (
        id TEXT PRIMARY KEY NOT NULL,
        documento_id TEXT NOT NULL REFERENCES shopee_etiqueta_documentos(id) ON DELETE CASCADE,
        page_order INTEGER NOT NULL,
        page_type TEXT NOT NULL,
        order_id TEXT,
        package_number INTEGER,
        extraction_method TEXT NOT NULL,
        confidence REAL NOT NULL DEFAULT 0,
        raster_hash TEXT,
        warnings_json TEXT NOT NULL DEFAULT '[]'
      );

      CREATE TABLE IF NOT EXISTS shopee_etiqueta_itens (
        id TEXT PRIMARY KEY NOT NULL,
        pagina_id TEXT NOT NULL REFERENCES shopee_etiqueta_paginas(id) ON DELETE CASCADE,
        row_order INTEGER NOT NULL,
        order_id TEXT,
        product_raw TEXT NOT NULL DEFAULT '',
        variation_raw TEXT NOT NULL DEFAULT '',
        fabric_raw TEXT NOT NULL DEFAULT '',
        color_raw TEXT NOT NULL DEFAULT '',
        quantity INTEGER NOT NULL DEFAULT 1,
        sku TEXT NOT NULL DEFAULT '',
        fabric_name TEXT NOT NULL DEFAULT '',
        color_name TEXT NOT NULL DEFAULT '',
        cut_mm INTEGER,
        width_mm INTEGER,
        confidence REAL NOT NULL DEFAULT 0,
        review_required INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS shopee_etiqueta_equivalencias (
        id TEXT PRIMARY KEY NOT NULL,
        kind TEXT NOT NULL CHECK (kind IN ('tecido', 'cor')),
        source_key TEXT NOT NULL,
        sku TEXT NOT NULL DEFAULT '',
        canonical_value TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE (kind, source_key, sku)
      );

      CREATE INDEX IF NOT EXISTS idx_shopee_lotes_status_created
        ON shopee_etiqueta_lotes(status, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_shopee_arquivos_lote
        ON shopee_etiqueta_arquivos(lote_id, source_order);
      CREATE INDEX IF NOT EXISTS idx_shopee_documentos_arquivo
        ON shopee_etiqueta_documentos(arquivo_id, document_order);
      CREATE INDEX IF NOT EXISTS idx_shopee_paginas_documento
        ON shopee_etiqueta_paginas(documento_id, page_order);
      CREATE INDEX IF NOT EXISTS idx_shopee_paginas_pedido
        ON shopee_etiqueta_paginas(order_id);
      CREATE INDEX IF NOT EXISTS idx_shopee_itens_pagina
        ON shopee_etiqueta_itens(pagina_id, row_order);
    `)

    const now = new Date().toISOString()
    const seed = db.prepare(`
      INSERT OR IGNORE INTO shopee_etiqueta_equivalencias
        (id, kind, source_key, sku, canonical_value, created_at, updated_at)
      VALUES (?, ?, ?, '', ?, ?, ?)
    `)
    const entries: Array<[string, string, string]> = [
      ['tecido', 'TECIDO MALHA HELANCA', 'HELANCA'],
      ['tecido', 'TECIDO LINHO MISTO', 'LINHO MISTO'],
      ['tecido', 'TECIDO LINHO RUSTICO', 'LINHO RÚSTICO'],
      ['tecido', 'TECIDO CETIM', 'CETIM'],
      ['tecido', 'TECIDO ANARRUGA', 'ANARRUGA'],
      ['tecido', 'TECIDO VELUDO CRISTAL', 'VELUDO CRISTAL'],
      ['cor', 'BRANCO CLASSICO', 'Branco'],
      ['cor', 'BRANCO', 'Branco'],
      ['cor', 'AZUL ROYAL', 'Azul Royal']
    ]
    for (const [kind, sourceKey, canonical] of entries) {
      seed.run(crypto.randomUUID(), kind, sourceKey, canonical, now, now)
    }
  }
}
