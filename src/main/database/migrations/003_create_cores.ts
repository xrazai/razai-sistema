import type { Migration } from './types'

export const m003_create_cores: Migration = {
  version: 3,
  name: 'create_cores',
  up: (db) => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS cores (
        id         TEXT PRIMARY KEY NOT NULL,
        nome       TEXT NOT NULL,
        hex        TEXT NOT NULL,
        lab        TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_cores_nome ON cores(nome);
      CREATE INDEX IF NOT EXISTS idx_cores_hex ON cores(hex);

      -- Seed inicial com paleta base padronizada
      INSERT OR IGNORE INTO cores (
        id, nome, hex, lab, created_at, updated_at
      ) VALUES
        ('1', 'Preto Absoluto', '#000000', '00,00 / 00,00 / 00,00', datetime('now'), datetime('now')),
        ('2', 'Branco Puro', '#FFFFFF', '100,00 / 00,00 / 00,00', datetime('now'), datetime('now')),
        ('3', 'Amarelo Canário', '#FFCC00', '83,25 / 08,12 / 85,34', datetime('now'), datetime('now')),
        ('4', 'Azul Marinho', '#002244', '14,28 / 05,42 / -28,91', datetime('now'), datetime('now')),
        ('5', 'Vermelho Carmim', '#D62246', '45,82 / 69,14 / 27,51', datetime('now'), datetime('now')),
        ('6', 'Verde Militar', '#4B5320', '34,12 / -12,45 / 26,80', datetime('now'), datetime('now'));
    `)
  }
}
