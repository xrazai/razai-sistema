import { randomUUID } from 'node:crypto'
import { getDb } from '../database/db'
import { generateTecidoSku } from '../../shared/sku'
import type { TecidoRecord, CreateTecidoInput, UpdateTecidoInput } from '../../shared/types'

type DbTecidoRow = {
  id: string
  codigo: string
  nome: string
  composicao: string
  largura: number
  rendimento: number | null
  gramatura_linear: number | null
  gramatura_m2: number | null
  tipo: string | null
  transparencia: string | null
  elasticidade: string | null
  acabamento: string | null
  created_at: string
  updated_at: string
}

function mapRowToRecord(row: DbTecidoRow): TecidoRecord {
  return {
    id: row.id,
    codigo: row.codigo,
    nome: row.nome,
    composicao: row.composicao,
    largura: row.largura,
    rendimento: row.rendimento,
    gramaturaLinear: row.gramatura_linear,
    gramaturaM2: row.gramatura_m2,
    tipo: row.tipo,
    transparencia: row.transparencia,
    elasticidade: row.elasticidade,
    acabamento: row.acabamento,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function getUniqueSku(nome: string, currentId?: string): string {
  const db = getDb()
  const baseSku = generateTecidoSku(nome)

  const existing = db
    .prepare('SELECT id, codigo FROM tecidos WHERE codigo = ?')
    .get(baseSku) as { id: string; codigo: string } | undefined

  if (!existing || existing.id === currentId) {
    return baseSku
  }

  // Se houver colisão de SKU com outro registro, gera sufixo alfanumérico garantindo estritamente 4 caracteres
  // 1) Tentativa com 3 caracteres de base + 1 caractere alfanumérico (2..9, A..Z)
  const chars3 = baseSku.slice(0, 3)
  const singleCharSuffixes = '23456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  for (const suffix of singleCharSuffixes) {
    const candidate = `${chars3}${suffix}`
    const check = db
      .prepare('SELECT id FROM tecidos WHERE codigo = ?')
      .get(candidate) as { id: string } | undefined

    if (!check || check.id === currentId) {
      return candidate
    }
  }

  // 2) Se esgotar (34 colisões), usa 2 caracteres de base + 2 caracteres base36 (01..ZZ = 1296 combinações)
  const chars2 = baseSku.slice(0, 2)
  for (let i = 1; i < 36 * 36; i++) {
    const suffix = i.toString(36).toUpperCase().padStart(2, '0')
    const candidate = `${chars2}${suffix}`
    const check = db
      .prepare('SELECT id FROM tecidos WHERE codigo = ?')
      .get(candidate) as { id: string } | undefined

    if (!check || check.id === currentId) {
      return candidate
    }
  }

  throw new Error(`Não foi possível gerar um SKU único de 4 caracteres para o tecido "${nome}"`)
}

export class TecidosService {
  static list(search?: string): TecidoRecord[] {
    const db = getDb()

    if (search && search.trim()) {
      const term = `%${search.trim().toLowerCase()}%`
      const rows = db
        .prepare(`
          SELECT * FROM tecidos
          WHERE LOWER(codigo) LIKE ?
             OR LOWER(nome) LIKE ?
             OR LOWER(composicao) LIKE ?
             OR LOWER(COALESCE(tipo, '')) LIKE ?
          ORDER BY nome COLLATE NOCASE ASC
        `)
        .all(term, term, term, term) as DbTecidoRow[]

      return rows.map(mapRowToRecord)
    }

    const rows = db
      .prepare('SELECT * FROM tecidos ORDER BY nome COLLATE NOCASE ASC')
      .all() as DbTecidoRow[]

    return rows.map(mapRowToRecord)
  }

  static getById(id: string): TecidoRecord | null {
    const db = getDb()
    const row = db
      .prepare('SELECT * FROM tecidos WHERE id = ?')
      .get(id) as DbTecidoRow | undefined

    return row ? mapRowToRecord(row) : null
  }

  static create(input: CreateTecidoInput): TecidoRecord {
    const db = getDb()
    const id = randomUUID()
    const codigo = getUniqueSku(input.nome)
    const now = new Date().toISOString()

    const largura = input.largura
    const rendimento = input.rendimento ?? null
    const gramaturaLinear = input.gramaturaLinear ?? null
    const gramaturaM2 = input.gramaturaM2 ?? null
    const tipo = input.tipo ?? null
    const transparencia = input.transparencia ?? null
    const elasticidade = input.elasticidade ?? null
    const acabamento = input.acabamento ?? null

    db.prepare(`
      INSERT INTO tecidos (
        id, codigo, nome, composicao, largura, rendimento, gramatura_linear,
        gramatura_m2, tipo, transparencia, elasticidade, acabamento, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `).run(
      id,
      codigo,
      input.nome.trim(),
      input.composicao.trim(),
      largura,
      rendimento,
      gramaturaLinear,
      gramaturaM2,
      tipo,
      transparencia,
      elasticidade,
      acabamento,
      now,
      now
    )

    const created = this.getById(id)
    if (!created) {
      throw new Error(`Falha ao recuperar tecido recém-criado id=${id}`)
    }
    return created
  }

  static update(id: string, input: UpdateTecidoInput): TecidoRecord {
    const db = getDb()
    const existing = this.getById(id)
    if (!existing) {
      throw new Error(`Tecido com id=${id} não encontrado para atualização.`)
    }

    const nome = input.nome !== undefined ? input.nome.trim() : existing.nome
    const composicao = input.composicao !== undefined ? input.composicao.trim() : existing.composicao
    const largura = input.largura !== undefined ? input.largura : existing.largura
    const rendimento = input.rendimento !== undefined ? input.rendimento : existing.rendimento
    const gramaturaLinear = input.gramaturaLinear !== undefined ? input.gramaturaLinear : existing.gramaturaLinear
    const gramaturaM2 = input.gramaturaM2 !== undefined ? input.gramaturaM2 : existing.gramaturaM2
    const tipo = input.tipo !== undefined ? input.tipo : existing.tipo
    const transparencia = input.transparencia !== undefined ? input.transparencia : existing.transparencia
    const elasticidade = input.elasticidade !== undefined ? input.elasticidade : existing.elasticidade
    const acabamento = input.acabamento !== undefined ? input.acabamento : existing.acabamento

    const codigo = nome !== existing.nome ? getUniqueSku(nome, id) : existing.codigo
    const now = new Date().toISOString()

    db.prepare(`
      UPDATE tecidos SET
        codigo = ?,
        nome = ?,
        composicao = ?,
        largura = ?,
        rendimento = ?,
        gramatura_linear = ?,
        gramatura_m2 = ?,
        tipo = ?,
        transparencia = ?,
        elasticidade = ?,
        acabamento = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      codigo,
      nome,
      composicao,
      largura,
      rendimento,
      gramaturaLinear,
      gramaturaM2,
      tipo,
      transparencia,
      elasticidade,
      acabamento,
      now,
      id
    )

    const updated = this.getById(id)
    if (!updated) {
      throw new Error(`Falha ao recuperar tecido atualizado id=${id}`)
    }
    return updated
  }

  static delete(id: string): boolean {
    const db = getDb()
    const result = db.prepare('DELETE FROM tecidos WHERE id = ?').run(id)
    return result.changes > 0
  }
}
