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
    `)

    // Popula seeds iniciais apenas se os tecidos e cores correspondentes existirem no banco
    const initialPairs = [
      { tecidoCod: 'TRAL', corCod: 'PRETABSO' },
      { tecidoCod: 'TRAL', corCod: 'BRANPURO' },
      { tecidoCod: 'TRAL', corCod: 'AZULMARI' },
      { tecidoCod: 'TRAL', corCod: 'VERDMILI' },
      { tecidoCod: 'LIRU', corCod: 'PRETABSO' },
      { tecidoCod: 'LIRU', corCod: 'BRANPURO' },
      { tecidoCod: 'SAEL', corCod: 'PRETABSO' },
      { tecidoCod: 'SAEL', corCod: 'AZULMARI' },
      { tecidoCod: 'VISA', corCod: 'BRANPURO' },
      { tecidoCod: 'VISA', corCod: 'VERMCARM' }
    ]

    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO vinculos (id, tecido_id, cor_id, sku, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `)

    for (let i = 0; i < initialPairs.length; i++) {
      const { tecidoCod, corCod } = initialPairs[i]
      const tecido = db.prepare('SELECT id FROM tecidos WHERE codigo = ?').get(tecidoCod) as
        | { id: string }
        | undefined
      const cor = db.prepare('SELECT id FROM cores WHERE codigo = ?').get(corCod) as
        | { id: string }
        | undefined

      if (tecido && cor) {
        insertStmt.run(`v${i + 1}`, tecido.id, cor.id, `${tecidoCod}-${corCod}`)
      }
    }
  }
}
