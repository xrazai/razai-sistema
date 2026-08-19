import { randomUUID } from 'node:crypto'
import { getDb } from '../database/db'
import { normalizeUnaccent, generateVinculoSku } from '../../shared/sku'
import type { VinculoRecord, CreateVinculosInput } from '../../shared/types'

type DbVinculoRow = {
  id: string
  tecido_id: string
  cor_id: string
  sku: string
  tecido_nome: string
  tecido_codigo: string
  cor_nome: string
  cor_codigo: string
  cor_hex: string
  cor_lab: string
  created_at: string
  updated_at: string
}

function mapRowToRecord(row: DbVinculoRow): VinculoRecord {
  return {
    id: row.id,
    tecidoId: row.tecido_id,
    corId: row.cor_id,
    sku: row.sku,
    tecidoNome: row.tecido_nome,
    tecidoCodigo: row.tecido_codigo,
    corNome: row.cor_nome,
    corCodigo: row.cor_codigo,
    corHex: row.cor_hex,
    corLab: row.cor_lab,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

const SELECT_VINCULOS_SQL = `
  SELECT
    v.id,
    v.tecido_id,
    v.cor_id,
    v.sku,
    v.created_at,
    v.updated_at,
    t.nome AS tecido_nome,
    t.codigo AS tecido_codigo,
    c.nome AS cor_nome,
    c.codigo AS cor_codigo,
    c.hex AS cor_hex,
    c.lab AS cor_lab
  FROM vinculos v
  INNER JOIN tecidos t ON t.id = v.tecido_id
  INNER JOIN cores c ON c.id = v.cor_id
`

export class VinculosService {
  static list(search?: string): VinculoRecord[] {
    const db = getDb()

    if (search && search.trim()) {
      const term = `%${normalizeUnaccent(search.trim())}%`
      const rows = db
        .prepare(`
          ${SELECT_VINCULOS_SQL}
          WHERE unaccent(v.sku) LIKE ?
             OR unaccent(t.codigo) LIKE ?
             OR unaccent(t.nome) LIKE ?
             OR unaccent(c.codigo) LIKE ?
             OR unaccent(c.nome) LIKE ?
             OR unaccent(c.hex) LIKE ?
          ORDER BY t.nome ASC, c.nome ASC
        `)
        .all(term, term, term, term, term, term) as DbVinculoRow[]

      return rows.map(mapRowToRecord)
    }

    const rows = db
      .prepare(`
        ${SELECT_VINCULOS_SQL}
        ORDER BY t.nome ASC, c.nome ASC
      `)
      .all() as DbVinculoRow[]

    return rows.map(mapRowToRecord)
  }

  static listByTecido(tecidoId: string): VinculoRecord[] {
    const db = getDb()
    const rows = db
      .prepare(`
        ${SELECT_VINCULOS_SQL}
        WHERE v.tecido_id = ?
        ORDER BY c.nome ASC
      `)
      .all(tecidoId) as DbVinculoRow[]

    return rows.map(mapRowToRecord)
  }

  static getById(id: string): VinculoRecord | null {
    const db = getDb()
    const row = db
      .prepare(`
        ${SELECT_VINCULOS_SQL}
        WHERE v.id = ?
      `)
      .get(id) as DbVinculoRow | undefined

    return row ? mapRowToRecord(row) : null
  }

  static createBatch(input: CreateVinculosInput): VinculoRecord[] {
    const db = getDb()
    const { tecidoId, corIds } = input

    if (!tecidoId || !tecidoId.trim()) {
      throw new Error('O tecido é obrigatório para cadastrar o vínculo.')
    }

    if (!corIds || !Array.isArray(corIds) || corIds.length === 0) {
      throw new Error('Selecione pelo menos uma cor para criar o vínculo.')
    }

    const tecido = db
      .prepare('SELECT id, codigo, nome FROM tecidos WHERE id = ?')
      .get(tecidoId) as { id: string; codigo: string; nome: string } | undefined

    if (!tecido) {
      throw new Error(`Tecido com id=${tecidoId} não encontrado.`)
    }

    const createdRecords: VinculoRecord[] = []
    const now = new Date().toISOString()

    const insertStmt = db.prepare(`
      INSERT INTO vinculos (id, tecido_id, cor_id, sku, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `)

    // Executa em transação para garantir atomicidade
    const transaction = db.transaction(() => {
      for (const corId of corIds) {
        // Verifica se a cor existe
        const cor = db
          .prepare('SELECT id, codigo, nome FROM cores WHERE id = ?')
          .get(corId) as { id: string; codigo: string; nome: string } | undefined

        if (!cor) {
          continue
        }

        // Verifica se o vínculo já existe
        const existing = db
          .prepare('SELECT id FROM vinculos WHERE tecido_id = ? AND cor_id = ?')
          .get(tecidoId, corId) as { id: string } | undefined

        if (existing) {
          const rec = this.getById(existing.id)
          if (rec) createdRecords.push(rec)
          continue
        }

        const id = randomUUID()
        const sku = generateVinculoSku(tecido.codigo, cor.codigo)

        insertStmt.run(id, tecidoId, corId, sku, now, now)
        const rec = this.getById(id)
        if (rec) {
          createdRecords.push(rec)
        }
      }
    })

    transaction()

    return createdRecords
  }

  static delete(id: string): boolean {
    const db = getDb()
    const result = db.prepare('DELETE FROM vinculos WHERE id = ?').run(id)
    return result.changes > 0
  }

  static deleteByTecidoAndCor(tecidoId: string, corId: string): boolean {
    const db = getDb()
    const result = db
      .prepare('DELETE FROM vinculos WHERE tecido_id = ? AND cor_id = ?')
      .run(tecidoId, corId)
    return result.changes > 0
  }
}
