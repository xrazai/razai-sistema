import type { Migration } from './types'
import { generateCorSku, getCorSkuCandidates } from '../../../shared/sku'

type DbCorRow = {
  id: string
  nome: string
  codigo?: string | null
}

export const m004_add_sku_to_cores: Migration = {
  version: 4,
  name: 'add_sku_to_cores',
  up: (db) => {
    // 1. Adiciona a coluna codigo na tabela cores se ainda não existir
    const tableInfo = db.prepare(`PRAGMA table_info(cores)`).all() as { name: string }[]
    const hasCodigo = tableInfo.some((col) => col.name === 'codigo')

    if (!hasCodigo) {
      db.exec(`ALTER TABLE cores ADD COLUMN codigo TEXT;`)
    }

    // 2. Popula ou atualiza os códigos de todas as cores existentes de forma determinística
    const rows = db.prepare(`SELECT id, nome, codigo FROM cores`).all() as DbCorRow[]
    const usedCodes = new Set<string>()

    for (const row of rows) {
      const candidates = getCorSkuCandidates(row.nome)
      let chosenCode = candidates[0]

      for (const candidate of candidates) {
        if (!usedCodes.has(candidate)) {
          chosenCode = candidate
          break
        }
      }

      usedCodes.add(chosenCode)
      db.prepare(`UPDATE cores SET codigo = ? WHERE id = ?`).run(chosenCode, row.id)
    }

    // 3. Cria índice único para o código da cor
    db.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_cores_codigo ON cores(codigo);
    `)
  }
}
