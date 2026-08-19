import { randomUUID } from 'node:crypto'
import { getDb } from '../database/db'
import { normalizeUnaccent, validateCorNome, getCorSkuCandidates } from '../../shared/sku'
import type { CorRecord, CreateCorInput, UpdateCorInput } from '../../shared/types'

type DbCorRow = {
  id: string
  codigo: string
  nome: string
  hex: string
  lab: string
  created_at: string
  updated_at: string
}

function mapRowToRecord(row: DbCorRow): CorRecord {
  return {
    id: row.id,
    codigo: row.codigo,
    nome: row.nome,
    hex: row.hex,
    lab: row.lab,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export function formatHex(hex: string): string {
  let clean = hex.trim().toUpperCase()
  if (!clean.startsWith('#')) {
    clean = `#${clean}`
  }
  return clean
}

export function validateCorFields(nome: string, hex: string, lab: string) {
  const nomeValidation = validateCorNome(nome)
  if (!nomeValidation.valid) {
    throw new Error(nomeValidation.error || 'Nome da cor inválido.')
  }
  const formattedHex = formatHex(hex)
  const hexRegex = /^#[0-9A-F]{6}$/
  if (!hexRegex.test(formattedHex)) {
    throw new Error('O campo "HEX" deve seguir o formato #RRGGBB em letras maiúsculas (ex: #FFCC00).')
  }
  if (!lab || !lab.trim()) {
    throw new Error('O campo "LAB" é obrigatório (formato 00,00 / 00,00 / 00,00).')
  }
}

export function getUniqueCorSku(nome: string, currentId?: string): string {
  const db = getDb()
  const candidates = getCorSkuCandidates(nome)

  for (const candidate of candidates) {
    const existing = db
      .prepare('SELECT id FROM cores WHERE codigo = ?')
      .get(candidate) as { id: string } | undefined

    if (!existing || existing.id === currentId) {
      return candidate
    }
  }

  throw new Error(`Não foi possível gerar um SKU único para a cor "${nome}"`)
}

export class CoresService {
  static list(search?: string): CorRecord[] {
    const db = getDb()

    if (search && search.trim()) {
      const term = `%${normalizeUnaccent(search.trim())}%`
      const rows = db
        .prepare(`
          SELECT * FROM cores
          WHERE unaccent(codigo) LIKE ?
             OR unaccent(nome) LIKE ?
             OR unaccent(hex) LIKE ?
             OR unaccent(lab) LIKE ?
          ORDER BY nome COLLATE NOCASE ASC
        `)
        .all(term, term, term, term) as DbCorRow[]

      return rows.map(mapRowToRecord)
    }

    const rows = db
      .prepare('SELECT * FROM cores ORDER BY nome COLLATE NOCASE ASC')
      .all() as DbCorRow[]

    return rows.map(mapRowToRecord)
  }

  static getById(id: string): CorRecord | null {
    const db = getDb()
    const row = db.prepare('SELECT * FROM cores WHERE id = ?').get(id) as DbCorRow | undefined
    return row ? mapRowToRecord(row) : null
  }

  static create(input: CreateCorInput): CorRecord {
    const db = getDb()
    const nome = input.nome ? input.nome.trim() : ''
    const hex = input.hex ? formatHex(input.hex) : ''
    const lab = input.lab ? input.lab.trim() : ''

    validateCorFields(nome, hex, lab)

    const id = randomUUID()
    const codigo = getUniqueCorSku(nome)
    const now = new Date().toISOString()

    db.prepare(`
      INSERT INTO cores (id, codigo, nome, hex, lab, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, codigo, nome, hex, lab, now, now)

    const created = this.getById(id)
    if (!created) {
      throw new Error(`Falha ao recuperar a cor criada id=${id}`)
    }
    return created
  }

  static update(id: string, input: UpdateCorInput): CorRecord {
    const db = getDb()
    const existing = this.getById(id)
    if (!existing) {
      throw new Error(`Cor com id=${id} não encontrada para atualização.`)
    }

    const nome = input.nome !== undefined ? input.nome.trim() : existing.nome
    const hex = input.hex !== undefined ? formatHex(input.hex) : existing.hex
    const lab = input.lab !== undefined ? input.lab.trim() : existing.lab

    validateCorFields(nome, hex, lab)

    const codigo = nome !== existing.nome ? getUniqueCorSku(nome, id) : existing.codigo
    const now = new Date().toISOString()

    db.prepare(`
      UPDATE cores SET
        codigo = ?,
        nome = ?,
        hex = ?,
        lab = ?,
        updated_at = ?
      WHERE id = ?
    `).run(codigo, nome, hex, lab, now, id)

    const updated = this.getById(id)
    if (!updated) {
      throw new Error(`Falha ao recuperar cor atualizada id=${id}`)
    }
    return updated
  }

  static delete(id: string): boolean {
    const db = getDb()
    const result = db.prepare('DELETE FROM cores WHERE id = ?').run(id)
    return result.changes > 0
  }
}
