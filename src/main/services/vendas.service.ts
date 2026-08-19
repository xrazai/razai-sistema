import { randomUUID } from 'node:crypto'
import { getDb } from '../database/db'
import { normalizeUnaccent } from '../../shared/sku'
import type { VendaRecord, VendaItemRecord, CreateVendaInput } from '../../shared/types'

type DbVendaRow = {
  id: string
  numero: number
  pedido_origem_id: string | null
  cliente_nome: string | null
  valor_total: number
  quantidade_total: number
  itens_count: number
  forma_pagamento: string | null
  observacoes: string | null
  created_at: string
  updated_at: string
}

type DbVendaItemRow = {
  id: string
  venda_id: string
  tecido_id: string
  cor_id: string
  vinculo_id: string | null
  sku: string
  tecido_nome: string
  tecido_codigo: string
  cor_nome: string
  cor_codigo: string
  cor_hex: string | null
  preco_unitario: number
  quantidade: number
  subtotal: number
  created_at: string
}

function mapItemRow(row: DbVendaItemRow): VendaItemRecord {
  return {
    id: String(row.id),
    vendaId: String(row.venda_id),
    tecidoId: String(row.tecido_id),
    corId: String(row.cor_id),
    vinculoId: row.vinculo_id ? String(row.vinculo_id) : undefined,
    sku: String(row.sku),
    tecidoNome: String(row.tecido_nome),
    tecidoCodigo: String(row.tecido_codigo),
    corNome: String(row.cor_nome),
    corCodigo: String(row.cor_codigo),
    corHex: row.cor_hex || undefined,
    precoUnitario: Number(row.preco_unitario),
    quantidade: Number(row.quantidade),
    subtotal: Number(row.subtotal),
    createdAt: String(row.created_at)
  }
}

function mapVendaRow(row: DbVendaRow, itens: VendaItemRecord[] = []): VendaRecord {
  return {
    id: String(row.id),
    numero: Number(row.numero),
    pedidoOrigemId: row.pedido_origem_id ? String(row.pedido_origem_id) : null,
    clienteNome: row.cliente_nome ? String(row.cliente_nome) : null,
    valorTotal: Number(row.valor_total),
    quantidadeTotal: Number(row.quantidade_total),
    itensCount: Number(row.itens_count),
    formaPagamento: row.forma_pagamento ? String(row.forma_pagamento) : null,
    observacoes: row.observacoes ? String(row.observacoes) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    itens
  }
}

export class VendasService {
  static list(search?: string): VendaRecord[] {
    const db = getDb()
    let vendasRows: DbVendaRow[]

    if (search && search.trim()) {
      const term = `%${normalizeUnaccent(search.trim())}%`
      vendasRows = db
        .prepare(`
          SELECT DISTINCT v.*
          FROM vendas v
          LEFT JOIN venda_itens vi ON vi.venda_id = v.id
          WHERE CAST(v.numero AS TEXT) LIKE ?
             OR unaccent(COALESCE(v.cliente_nome, '')) LIKE ?
             OR unaccent(vi.sku) LIKE ?
             OR unaccent(vi.tecido_nome) LIKE ?
             OR unaccent(vi.cor_nome) LIKE ?
          ORDER BY v.numero DESC, v.created_at DESC
        `)
        .all(term, term, term, term, term) as DbVendaRow[]
    } else {
      vendasRows = db
        .prepare(`SELECT * FROM vendas ORDER BY numero DESC, created_at DESC`)
        .all() as DbVendaRow[]
    }

    if (vendasRows.length === 0) return []

    // Busca todos os itens de forma otimizada
    const allItensRows = db
      .prepare(`SELECT * FROM venda_itens ORDER BY created_at ASC`)
      .all() as DbVendaItemRow[]

    const itemsByVendaId = new Map<string, VendaItemRecord[]>()
    for (const item of allItensRows) {
      const vId = String(item.venda_id)
      const list = itemsByVendaId.get(vId) || []
      list.push(mapItemRow(item))
      itemsByVendaId.set(vId, list)
    }

    return vendasRows.map((v) => mapVendaRow(v, itemsByVendaId.get(String(v.id)) || []))
  }

  static getById(id: string): VendaRecord | null {
    const db = getDb()
    const targetId = String(id).trim()

    const vendaRow = db
      .prepare(`SELECT * FROM vendas WHERE CAST(id AS TEXT) = ?`)
      .get(targetId) as DbVendaRow | undefined

    if (!vendaRow) return null

    const itensRows = db
      .prepare(`SELECT * FROM venda_itens WHERE CAST(venda_id AS TEXT) = ? ORDER BY created_at ASC`)
      .all(targetId) as DbVendaItemRow[]

    return mapVendaRow(vendaRow, itensRows.map(mapItemRow))
  }

  static create(input: CreateVendaInput): VendaRecord {
    const db = getDb()
    const { itens, clienteNome, pedidoOrigemId, formaPagamento, observacoes } = input

    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      throw new Error('A venda deve conter pelo menos 1 item lançado.')
    }

    let valorTotal = 0
    let quantidadeTotal = 0

    for (const item of itens) {
      if (!item.tecidoId || !item.corId) {
        throw new Error('Todo item de venda deve conter Tecido e Cor selecionados.')
      }
      if (item.quantidade <= 0) {
        throw new Error('A quantidade do item deve ser maior que zero.')
      }
      if (item.precoUnitario < 0) {
        throw new Error('O preço do item não pode ser negativo.')
      }
      const itemSubtotal = item.subtotal > 0 ? item.subtotal : item.quantidade * item.precoUnitario
      valorTotal += itemSubtotal
      quantidadeTotal += item.quantidade
    }

    const vendaId = randomUUID()
    const now = new Date().toISOString()

    const insertVendaStmt = db.prepare(`
      INSERT INTO vendas (
        id, numero, pedido_origem_id, cliente_nome, valor_total, quantidade_total, itens_count, forma_pagamento, observacoes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const insertItemStmt = db.prepare(`
      INSERT INTO venda_itens (
        id, venda_id, tecido_id, cor_id, vinculo_id, sku, tecido_nome, tecido_codigo, cor_nome, cor_codigo, cor_hex, preco_unitario, quantidade, subtotal, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    let createdNumero = 1

    const transaction = db.transaction(() => {
      const maxRow = db.prepare(`SELECT MAX(numero) as max_num FROM vendas`).get() as { max_num: number | null }
      createdNumero = (maxRow?.max_num || 0) + 1

      insertVendaStmt.run(
        vendaId,
        createdNumero,
        pedidoOrigemId ? String(pedidoOrigemId) : null,
        clienteNome ? String(clienteNome).trim() : null,
        valorTotal,
        quantidadeTotal,
        itens.length,
        formaPagamento ? String(formaPagamento).trim() : 'Dinheiro / PIX',
        observacoes ? String(observacoes).trim() : null,
        now,
        now
      )

      for (const item of itens) {
        const itemId = randomUUID()
        const subtotal = item.subtotal > 0 ? item.subtotal : item.quantidade * item.precoUnitario

        insertItemStmt.run(
          itemId,
          vendaId,
          String(item.tecidoId),
          String(item.corId),
          item.vinculoId ? String(item.vinculoId) : null,
          String(item.sku),
          String(item.tecidoNome),
          String(item.tecidoCodigo),
          String(item.corNome),
          String(item.corCodigo),
          item.corHex ? String(item.corHex) : null,
          item.precoUnitario,
          item.quantidade,
          subtotal,
          now
        )
      }
    })

    transaction()

    const created = this.getById(vendaId)
    if (!created) {
      throw new Error('Falha ao recuperar a venda recém-criada.')
    }
    return created
  }

  static delete(id: string): boolean {
    const db = getDb()
    const targetId = String(id).trim()
    const result = db.prepare(`DELETE FROM vendas WHERE CAST(id AS TEXT) = ?`).run(targetId)
    return result.changes > 0
  }
}
