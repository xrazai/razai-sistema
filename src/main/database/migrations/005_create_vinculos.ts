import type { Migration } from './types'

export const m005_create_vinculos: Migration = {
  version: 5,
  name: 'create_vinculos',
  up: (db) => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS vinculos (
        id         TEXT PRIMARY KEY NOT NULL,
        tecido_id  TEXT NOT NULL REFERENCES tecidos(id) ON DELETE CASCADE,
        cor_id     TEXT NOT NULL REFERENCES cores(id) ON DELETE RESTRICT,
        sku        TEXT UNIQUE NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(tecido_id, cor_id)
      );

      CREATE INDEX IF NOT EXISTS idx_vinculos_sku ON vinculos(sku);
      CREATE INDEX IF NOT EXISTS idx_vinculos_tecido_id ON vinculos(tecido_id);
      CREATE INDEX IF NOT EXISTS idx_vinculos_cor_id ON vinculos(cor_id);

      -- Seed inicial de vínculos para tecidos padrão
      INSERT OR IGNORE INTO vinculos (id, tecido_id, cor_id, sku, created_at, updated_at) VALUES
        ('v1', '1', '1', 'TRAL-PRETABSO', datetime('now'), datetime('now')),
        ('v2', '1', '2', 'TRAL-BRANPURO', datetime('now'), datetime('now')),
        ('v3', '1', '4', 'TRAL-AZULMARI', datetime('now'), datetime('now')),
        ('v4', '1', '6', 'TRAL-VERDMILI', datetime('now'), datetime('now')),
        ('v5', '5', '1', 'LIRU-PRETABSO', datetime('now'), datetime('now')),
        ('v6', '5', '2', 'LIRU-BRANPURO', datetime('now'), datetime('now')),
        ('v7', '6', '1', 'SAEL-PRETABSO', datetime('now'), datetime('now')),
        ('v8', '6', '4', 'SAEL-AZULMARI', datetime('now'), datetime('now')),
        ('v9', '7', '2', 'VISA-BRANPURO', datetime('now'), datetime('now')),
        ('v10', '7', '5', 'VISA-VERMCARM', datetime('now'), datetime('now'));
    `)
  }
}
