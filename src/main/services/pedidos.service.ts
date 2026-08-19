import { randomUUID } from 'node:crypto'
import { getDb } from '../database/db'
import { normalizeUnaccent } from '../../shared/sku'
import { VendasService } from './vendas.service'
import type { PedidoRecord, PedidoItemRecord, CreatePedidoInput, UpdatePedidoInput, PedidoStatus, VendaRecord } from '../../shared/types'

type DbPedidoRow = {
  id: string
  numero: number
  cliente_nome: string | null
  status: string
  valor_total: number
  quantidade_total: number
  itens_count: number
  observacoes: string | null
  venda_gerada_id: string | null
  created_at: string
  updated_at: string
}

type DbPedidoItemRow = {
  id: string
  pedido_id: string
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

function mapItemRow(row: DbPedidoItemRow): PedidoItemRecord {
  return {
    id: String(row.id),
    pedidoId: String(row.pedido_id),
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

function mapPedidoRow(row: DbPedidoRow, itens: PedidoItemRecord[] = []): PedidoRecord {
  return {
    id: String(row.id),
    numero: Number(row.numero),
    clienteNome: row.cliente_nome ? String(row.cliente_nome) : null,
    status: (row.status as PedidoStatus) || 'pendente',
    valorTotal: Number(row.valor_total),
    quantidadeTotal: Number(row.quantidade_total),
    itensCount: Number(row.itens_count),
    observacoes: row.observacoes ? String(row.observacoes) : null,
    vendaGeradaId: row.venda_gerada_id ? String(row.venda_gerada_id) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    itens
  }
}

export class PedidosService {
  static list(search?: string): PedidoRecord[] {
    const db = getDb()
    let pedidosRows: DbPedidoRow[]

    if (search && search.trim()) {
      const term = `%${normalizeUnaccent(search.trim())}%`
      pedidosRows = db
        .prepare(`
          SELECT DISTINCT p.*
          FROM pedidos p
          LEFT JOIN pedido_itens pi ON pi.pedido_id = p.id
          WHERE CAST(p.numero AS TEXT) LIKE ?
             OR unaccent(COALESCE(p.cliente_nome, '')) LIKE ?
             OR unaccent(p.status) LIKE ?
             OR unaccent(pi.sku) LIKE ?
             OR unaccent(pi.tecido_nome) LIKE ?
             OR unaccent(pi.cor_nome) LIKE ?
          ORDER BY p.numero DESC, p.created_at DESC
        `)
        .all(term, term, term, term, term, term) as DbPedidoRow[]
    } else {
      pedidosRows = db
        .prepare(`SELECT * FROM pedidos ORDER BY numero DESC, created_at DESC`)
        .all() as DbPedidoRow[]
    }

    if (pedidosRows.length === 0) return []

    const allItensRows = db
      .prepare(`SELECT * FROM pedido_itens ORDER BY created_at ASC`)
      .all() as DbPedidoItemRow[]

    const itemsByPedidoId = new Map<string, PedidoItemRecord[]>()
    for (const item of allItensRows) {
      const pId = String(item.pedido_id)
      const list = itemsByPedidoId.get(pId) || []
      list.push(mapItemRow(item))
      itemsByPedidoId.set(pId, list)
    }

    return pedidosRows.map((p) => mapPedidoRow(p, itemsByPedidoId.get(String(p.id)) || []))
  }

  static getById(id: string): PedidoRecord | null {
    const db = getDb()
    const targetId = String(id).trim()

    const pedidoRow = db
      .prepare(`SELECT * FROM pedidos WHERE CAST(id AS TEXT) = ?`)
      .get(targetId) as DbPedidoRow | undefined

    if (!pedidoRow) return null

    const itensRows = db
      .prepare(`SELECT * FROM pedido_itens WHERE CAST(pedido_id AS TEXT) = ? ORDER BY created_at ASC`)
      .all(targetId) as DbPedidoItemRow[]

    return mapPedidoRow(pedidoRow, itensRows.map(mapItemRow))
  }

  static create(input: CreatePedidoInput): PedidoRecord {
    const db = getDb()
    const { itens, clienteNome, observacoes } = input

    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      throw new Error('O pedido deve conter pelo menos 1 item lançado.')
    }

    let valorTotal = 0
    let quantidadeTotal = 0

    for (const item of itens) {
      if (!item.tecidoId || !item.corId) {
        throw new Error('Todo item de pedido deve conter Tecido e Cor selecionados.')
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

    const pedidoId = randomUUID()
    const now = new Date().toISOString()

    const insertPedidoStmt = db.prepare(`
      INSERT INTO pedidos (
        id, numero, cliente_nome, status, valor_total, quantidade_total, itens_count, observacoes, venda_gerada_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const insertItemStmt = db.prepare(`
      INSERT INTO pedido_itens (
        id, pedido_id, tecido_id, cor_id, vinculo_id, sku, tecido_nome, tecido_codigo, cor_nome, cor_codigo, cor_hex, preco_unitario, quantidade, subtotal, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    let createdNumero = 1

    const transaction = db.transaction(() => {
      const maxRow = db.prepare(`SELECT MAX(numero) as max_num FROM pedidos`).get() as { max_num: number | null }
      createdNumero = (maxRow?.max_num || 0) + 1

      insertPedidoStmt.run(
        pedidoId,
        createdNumero,
        clienteNome ? String(clienteNome).trim() : null,
        'pendente',
        valorTotal,
        quantidadeTotal,
        itens.length,
        observacoes ? String(observacoes).trim() : null,
        null,
        now,
        now
      )

      for (const item of itens) {
        const itemId = randomUUID()
        const subtotal = item.subtotal > 0 ? item.subtotal : item.quantidade * item.precoUnitario

        insertItemStmt.run(
          itemId,
          pedidoId,
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

    const created = this.getById(pedidoId)
    if (!created) {
      throw new Error('Falha ao recuperar o pedido recém-criado.')
    }
    return created
  }

  static update(id: string, input: UpdatePedidoInput): PedidoRecord {
    const db = getDb()
    const targetId = String(id).trim()
    const existing = this.getById(targetId)

    if (!existing) {
      throw new Error(`Pedido com id=${targetId} não encontrado para atualização.`)
    }

    const clienteNome = input.clienteNome !== undefined ? input.clienteNome : existing.clienteNome
    const observacoes = input.observacoes !== undefined ? input.observacoes : existing.observacoes
    const status = input.status !== undefined ? input.status : existing.status
    const itens = input.itens || existing.itens || []

    if (itens.length === 0) {
      throw new Error('O pedido deve conter pelo menos 1 item.')
    }

    let valorTotal = 0
    let quantidadeTotal = 0

    for (const item of itens) {
      const subtotal = item.subtotal > 0 ? item.subtotal : item.quantidade * item.precoUnitario
      valorTotal += subtotal
      quantidadeTotal += item.quantidade
    }

    const now = new Date().toISOString()

    const transaction = db.transaction(() => {
      db.prepare(`
        UPDATE pedidos
        SET cliente_nome = ?, status = ?, valor_total = ?, quantidade_total = ?, itens_count = ?, observacoes = ?, updated_at = ?
        WHERE CAST(id AS TEXT) = ?
      `).run(
        clienteNome ? String(clienteNome).trim() : null,
        status,
        valorTotal,
        quantidadeTotal,
        itens.length,
        observacoes ? String(observacoes).trim() : null,
        now,
        targetId
      )

      if (input.itens) {
        db.prepare(`DELETE FROM pedido_itens WHERE CAST(pedido_id AS TEXT) = ?`).run(targetId)

        const insertItemStmt = db.prepare(`
          INSERT INTO pedido_itens (
            id, pedido_id, tecido_id, cor_id, vinculo_id, sku, tecido_nome, tecido_codigo, cor_nome, cor_codigo, cor_hex, preco_unitario, quantidade, subtotal, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)

        for (const item of itens) {
          const itemId = randomUUID()
          const subtotal = item.subtotal > 0 ? item.subtotal : item.quantidade * item.precoUnitario

          insertItemStmt.run(
            itemId,
            targetId,
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
      }
    })

    transaction()

    const updated = this.getById(targetId)
    if (!updated) {
      throw new Error('Falha ao recuperar pedido atualizado.')
    }
    return updated
  }

  static delete(id: string): boolean {
    const db = getDb()
    const targetId = String(id).trim()
    const result = db.prepare(`DELETE FROM pedidos WHERE CAST(id AS TEXT) = ?`).run(targetId)
    return result.changes > 0
  }

  static aprovar(id: string): { pedido: PedidoRecord; venda: VendaRecord } {
    const db = getDb()
    const targetId = String(id).trim()
    const pedido = this.getById(targetId)

    if (!pedido) {
      throw new Error(`Pedido com id=${targetId} não encontrado.`)
    }

    if (!pedido.itens || pedido.itens.length === 0) {
      throw new Error('Não é possível aprovar um pedido sem itens.')
    }

    // Cria a venda correspondente
    const venda = VendasService.create({
      clienteNome: pedido.clienteNome || undefined,
      pedidoOrigemId: pedido.id,
      formaPagamento: 'Convertido de Pedido',
      observacoes: pedido.observacoes ? `Pedido #${pedido.numero}: ${pedido.observacoes}` : `Convertido do Pedido #${pedido.numero}`,
      itens: pedido.itens
    })

    // Atualiza o pedido para status 'aprovado'
    const now = new Date().toISOString()
    db.prepare(`
      UPDATE pedidos
      SET status = 'aprovado', venda_gerada_id = ?, updated_at = ?
      WHERE CAST(id AS TEXT) = ?
    `).run(venda.id, now, targetId)

    const updatedPedido = this.getById(targetId)!
    return { pedido: updatedPedido, venda }
  }

  static cancelar(id: string): PedidoRecord {
    const db = getDb()
    const targetId = String(id).trim()
    const now = new Date().toISOString()

    db.prepare(`
      UPDATE pedidos
      SET status = 'cancelado', updated_at = ?
      WHERE CAST(id AS TEXT) = ?
    `).run(now, targetId)

    const updated = this.getById(targetId)
    if (!updated) {
      throw new Error('Pedido não encontrado para cancelamento.')
    }
    return updated
  }
}
