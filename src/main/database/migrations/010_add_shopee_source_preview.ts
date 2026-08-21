import type { Migration } from './types'

export const m010_add_shopee_source_preview: Migration = {
  version: 10,
  name: 'add_shopee_source_preview',
  up: (db) => {
    db.exec(`
      ALTER TABLE shopee_etiqueta_paginas ADD COLUMN rotation_degrees INTEGER;
      ALTER TABLE shopee_etiqueta_paginas ADD COLUMN image_width INTEGER;
      ALTER TABLE shopee_etiqueta_paginas ADD COLUMN image_height INTEGER;

      ALTER TABLE shopee_etiqueta_itens ADD COLUMN source_x INTEGER;
      ALTER TABLE shopee_etiqueta_itens ADD COLUMN source_y INTEGER;
      ALTER TABLE shopee_etiqueta_itens ADD COLUMN source_width INTEGER;
      ALTER TABLE shopee_etiqueta_itens ADD COLUMN source_height INTEGER;
    `)
  }
}
