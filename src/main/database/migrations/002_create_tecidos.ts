import type { Migration } from './types'

export const m002_create_tecidos: Migration = {
  version: 2,
  name: 'create_tecidos',
  up: (db) => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS tecidos (
        id               TEXT PRIMARY KEY NOT NULL,
        codigo           TEXT UNIQUE NOT NULL,
        nome             TEXT NOT NULL,
        composicao       TEXT NOT NULL,
        largura          REAL NOT NULL,
        rendimento       REAL,
        gramatura_linear REAL,
        gramatura_m2     REAL,
        tipo             TEXT,
        transparencia    TEXT,
        elasticidade     TEXT,
        acabamento       TEXT,
        created_at       TEXT NOT NULL,
        updated_at       TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_tecidos_codigo ON tecidos(codigo);
      CREATE INDEX IF NOT EXISTS idx_tecidos_nome ON tecidos(nome);

      -- Seed inicial com os tecidos padronizados do catálogo
      INSERT OR IGNORE INTO tecidos (
        id, codigo, nome, composicao, largura, rendimento, gramatura_linear, gramatura_m2, tipo, transparencia, elasticidade, acabamento, created_at, updated_at
      ) VALUES
        ('1', 'TRAL', 'Tricoline Lisa 100% Algodão', '100% Algodão', 1.50, 5.50, 180, 120, 'liso', 'nenhuma', 'nenhuma', 'fosco', datetime('now'), datetime('now')),
        ('2', 'CETI', 'Cetim', '100% Poliéster', 1.50, 6.50, 150, 100, 'liso', 'nenhuma', 'nenhuma', 'brilhante', datetime('now'), datetime('now')),
        ('3', 'CEEL', 'Cetim com Elastano', '97% Poliéster / 3% Elastano', 1.45, 5.00, 200, 140, 'liso', 'nenhuma', 'baixa', 'semi_brilho', datetime('now'), datetime('now')),
        ('4', 'ANAR', 'Anarruga', '100% Algodão', 1.40, 4.50, 220, 160, 'estampado', 'baixa', 'nenhuma', 'fosco', datetime('now'), datetime('now')),
        ('5', 'LIRU', 'Linho Puro Rústico', '100% Linho', 1.45, 3.00, 350, 240, 'liso', 'baixa', 'nenhuma', 'fosco', datetime('now'), datetime('now')),
        ('6', 'SAEL', 'Sarja Acetinada com Elastano', '97% Algodão / 3% Elastano', 1.60, 2.50, 420, 260, 'liso', 'nenhuma', 'baixa', 'semi_brilho', datetime('now'), datetime('now')),
        ('7', 'VISA', 'Viscose Sarjada', '100% Viscose', 1.48, 4.00, 240, 170, 'liso', 'baixa', 'nenhuma', 'fosco', datetime('now'), datetime('now')),
        ('8', 'JEPE', 'Jeans Denim Pesado', '98% Algodão / 2% Elastano', 1.65, 1.50, 630, 380, 'liso', 'nenhuma', 'baixa', 'fosco', datetime('now'), datetime('now'));
    `)
  }
}
