import { randomUUID } from 'node:crypto'
import { getDb } from '../../database/db'
import type {
  AgenteRecord,
  CreateAgenteInput,
  UpdateAgenteInput,
  AgenteConhecimentoRecord,
  CreateAgenteConhecimentoInput,
  UpdateAgenteConhecimentoInput,
  AgenteConversaRecord,
  AgenteConversaStatus,
  AgenteMensagemRecord,
  AgenteGerarRespostaResult
} from '../../../shared/types'

type DbAgenteRow = {
  id: string
  nome: string
  descricao: string | null
  canal: string
  tipo_conexao: string
  modo_operacao: string
  prompt_sistema: string
  config_json: string
  ativo: number
  created_at: string
  updated_at: string
  conhecimentos_count?: number
  conversas_ativas_count?: number
}

type DbConhecimentoRow = {
  id: string
  agente_id: string
  tipo: string
  titulo: string
  conteudo: string
  ativo: number
  ordem: number
  created_at: string
  updated_at: string
}

type DbConversaRow = {
  id: string
  agente_id: string
  cliente_id: string | null
  cliente_nome: string
  canal: string
  status: string
  ultima_mensagem_texto: string | null
  ultima_mensagem_at: string
  created_at: string
  updated_at: string
}

type DbMensagemRow = {
  id: string
  conversa_id: string
  remetente: string
  texto: string
  status: string
  confianca: number | null
  created_at: string
}

function mapAgenteRow(row: DbAgenteRow): AgenteRecord {
  return {
    id: row.id,
    nome: row.nome,
    descricao: row.descricao,
    canal: row.canal as any,
    tipoConexao: row.tipo_conexao as any,
    modoOperacao: row.modo_operacao as any,
    promptSistema: row.prompt_sistema,
    configJson: row.config_json,
    ativo: Boolean(row.ativo),
    conhecimentosCount: Number(row.conhecimentos_count || 0),
    conversasAtivasCount: Number(row.conversas_ativas_count || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function mapConhecimentoRow(row: DbConhecimentoRow): AgenteConhecimentoRecord {
  return {
    id: row.id,
    agenteId: row.agente_id,
    tipo: row.tipo as any,
    titulo: row.titulo,
    conteudo: row.conteudo,
    ativo: Boolean(row.ativo),
    ordem: Number(row.ordem || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function mapConversaRow(row: DbConversaRow): AgenteConversaRecord {
  return {
    id: row.id,
    agenteId: row.agente_id,
    clienteId: row.cliente_id,
    clienteNome: row.cliente_nome,
    canal: row.canal as any,
    status: row.status as any,
    ultimaMensagemTexto: row.ultima_mensagem_texto,
    ultimaMensagemAt: row.ultima_mensagem_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function mapMensagemRow(row: DbMensagemRow): AgenteMensagemRecord {
  return {
    id: row.id,
    conversaId: row.conversa_id,
    remetente: row.remetente as any,
    texto: row.texto,
    status: row.status as any,
    confianca: row.confianca !== null ? Number(row.confianca) : null,
    createdAt: row.created_at
  }
}

export class AgentesService {
  static list(): AgenteRecord[] {
    const db = getDb()
    const rows = db
      .prepare(
        `SELECT a.*,
          (SELECT COUNT(*) FROM agente_conhecimentos c WHERE c.agente_id = a.id) AS conhecimentos_count,
          (SELECT COUNT(*) FROM agente_conversas cv WHERE cv.agente_id = a.id AND cv.status = 'aguardando_aprovacao') AS conversas_ativas_count
         FROM agentes a
         ORDER BY a.created_at ASC`
      )
      .all() as DbAgenteRow[]

    return rows.map(mapAgenteRow)
  }

  static getById(id: string): AgenteRecord | null {
    const db = getDb()
    const row = db
      .prepare(
        `SELECT a.*,
          (SELECT COUNT(*) FROM agente_conhecimentos c WHERE c.agente_id = a.id) AS conhecimentos_count,
          (SELECT COUNT(*) FROM agente_conversas cv WHERE cv.agente_id = a.id AND cv.status = 'aguardando_aprovacao') AS conversas_ativas_count
         FROM agentes a
         WHERE a.id = ?`
      )
      .get(id) as DbAgenteRow | undefined

    return row ? mapAgenteRow(row) : null
  }

  static create(input: CreateAgenteInput): AgenteRecord {
    const db = getDb()
    const id = input.id || `ag-${randomUUID().substring(0, 8)}`
    const now = new Date().toISOString()

    if (!input.nome || !input.nome.trim()) {
      throw new Error('O campo "nome" é obrigatório.')
    }

    db.prepare(
      `INSERT INTO agentes (id, nome, descricao, canal, tipo_conexao, modo_operacao, prompt_sistema, config_json, ativo, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      input.nome.trim(),
      input.descricao ? input.descricao.trim() : null,
      input.canal || 'shopee',
      input.tipoConexao || 'web_session',
      input.modoOperacao || 'copiloto',
      input.promptSistema || '',
      input.configJson || '{}',
      input.ativo === false ? 0 : 1,
      now,
      now
    )

    const created = this.getById(id)
    if (!created) throw new Error('Falha ao criar agente.')
    return created
  }

  static update(id: string, input: UpdateAgenteInput): AgenteRecord {
    const db = getDb()
    const existing = this.getById(id)
    if (!existing) throw new Error(`Agente com ID ${id} não encontrado.`)

    const now = new Date().toISOString()
    const nome = input.nome !== undefined ? input.nome.trim() : existing.nome
    const descricao = input.descricao !== undefined ? (input.descricao ? input.descricao.trim() : null) : existing.descricao
    const canal = input.canal !== undefined ? input.canal : existing.canal
    const tipoConexao = input.tipoConexao !== undefined ? input.tipoConexao : existing.tipoConexao
    const modoOperacao = input.modoOperacao !== undefined ? input.modoOperacao : existing.modoOperacao
    const promptSistema = input.promptSistema !== undefined ? input.promptSistema : existing.promptSistema
    const configJson = input.configJson !== undefined ? input.configJson : existing.configJson
    const ativo = input.ativo !== undefined ? (input.ativo ? 1 : 0) : (existing.ativo ? 1 : 0)

    db.prepare(
      `UPDATE agentes
       SET nome = ?, descricao = ?, canal = ?, tipo_conexao = ?, modo_operacao = ?, prompt_sistema = ?, config_json = ?, ativo = ?, updated_at = ?
       WHERE id = ?`
    ).run(nome, descricao, canal, tipoConexao, modoOperacao, promptSistema, configJson, ativo, now, id)

    const updated = this.getById(id)
    if (!updated) throw new Error('Falha ao atualizar agente.')
    return updated
  }

  static delete(id: string): boolean {
    const db = getDb()
    const result = db.prepare(`DELETE FROM agentes WHERE id = ?`).run(id)
    return result.changes > 0
  }

  // --- BASE DE CONHECIMENTO ---

  static listConhecimentos(agenteId: string): AgenteConhecimentoRecord[] {
    const db = getDb()
    const rows = db
      .prepare(
        `SELECT * FROM agente_conhecimentos
         WHERE agente_id = ?
         ORDER BY ordem ASC, created_at ASC`
      )
      .all(agenteId) as DbConhecimentoRow[]

    return rows.map(mapConhecimentoRow)
  }

  static createConhecimento(input: CreateAgenteConhecimentoInput): AgenteConhecimentoRecord {
    const db = getDb()
    const id = `kn-${randomUUID().substring(0, 8)}`
    const now = new Date().toISOString()

    if (!input.titulo || !input.titulo.trim()) {
      throw new Error('O campo "titulo" é obrigatório.')
    }
    if (!input.conteudo || !input.conteudo.trim()) {
      throw new Error('O campo "conteudo" é obrigatório.')
    }

    db.prepare(
      `INSERT INTO agente_conhecimentos (id, agente_id, tipo, titulo, conteudo, ativo, ordem, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      input.agenteId,
      input.tipo || 'faq',
      input.titulo.trim(),
      input.conteudo.trim(),
      input.ativo === false ? 0 : 1,
      input.ordem || 0,
      now,
      now
    )

    const row = db.prepare(`SELECT * FROM agente_conhecimentos WHERE id = ?`).get(id) as DbConhecimentoRow
    return mapConhecimentoRow(row)
  }

  static updateConhecimento(id: string, input: UpdateAgenteConhecimentoInput): AgenteConhecimentoRecord {
    const db = getDb()
    const existingRow = db.prepare(`SELECT * FROM agente_conhecimentos WHERE id = ?`).get(id) as DbConhecimentoRow | undefined
    if (!existingRow) throw new Error(`Conhecimento com ID ${id} não encontrado.`)

    const now = new Date().toISOString()
    const tipo = input.tipo !== undefined ? input.tipo : existingRow.tipo
    const titulo = input.titulo !== undefined ? input.titulo.trim() : existingRow.titulo
    const conteudo = input.conteudo !== undefined ? input.conteudo.trim() : existingRow.conteudo
    const ativo = input.ativo !== undefined ? (input.ativo ? 1 : 0) : existingRow.ativo
    const ordem = input.ordem !== undefined ? input.ordem : existingRow.ordem

    db.prepare(
      `UPDATE agente_conhecimentos
       SET tipo = ?, titulo = ?, conteudo = ?, ativo = ?, ordem = ?, updated_at = ?
       WHERE id = ?`
    ).run(tipo, titulo, conteudo, ativo, ordem, now, id)

    const updatedRow = db.prepare(`SELECT * FROM agente_conhecimentos WHERE id = ?`).get(id) as DbConhecimentoRow
    return mapConhecimentoRow(updatedRow)
  }

  static deleteConhecimento(id: string): boolean {
    const db = getDb()
    const result = db.prepare(`DELETE FROM agente_conhecimentos WHERE id = ?`).run(id)
    return result.changes > 0
  }

  // --- CONVERSAS E MENSAGENS ---

  static listConversas(agenteId: string, status?: AgenteConversaStatus): AgenteConversaRecord[] {
    const db = getDb()
    let query = `SELECT * FROM agente_conversas WHERE agente_id = ?`
    const params: any[] = [agenteId]

    if (status) {
      query += ` AND status = ?`
      params.push(status)
    }

    query += ` ORDER BY ultima_mensagem_at DESC`

    const rows = db.prepare(query).all(...params) as DbConversaRow[]
    return rows.map(mapConversaRow)
  }

  static getConversa(conversaId: string): AgenteConversaRecord | null {
    const db = getDb()
    const row = db.prepare(`SELECT * FROM agente_conversas WHERE id = ?`).get(conversaId) as DbConversaRow | undefined
    if (!row) return null

    const conversa = mapConversaRow(row)
    conversa.mensagens = this.listMensagens(conversaId)
    return conversa
  }

  static listMensagens(conversaId: string): AgenteMensagemRecord[] {
    const db = getDb()
    const rows = db
      .prepare(`SELECT * FROM agente_mensagens WHERE conversa_id = ? ORDER BY created_at ASC`)
      .all(conversaId) as DbMensagemRow[]

    return rows.map(mapMensagemRow)
  }

  static enviarMensagem(conversaId: string, texto: string): AgenteMensagemRecord {
    const db = getDb()
    const id = `msg-${randomUUID().substring(0, 8)}`
    const now = new Date().toISOString()

    db.prepare(
      `INSERT INTO agente_mensagens (id, conversa_id, remetente, texto, status, created_at)
       VALUES (?, ?, 'operador', ?, 'enviado', ?)`
    ).run(id, conversaId, texto.trim(), now)

    db.prepare(
      `UPDATE agente_conversas
       SET ultima_mensagem_texto = ?, ultima_mensagem_at = ?, status = 'respondido', updated_at = ?
       WHERE id = ?`
    ).run(texto.trim(), now, now, conversaId)

    const row = db.prepare(`SELECT * FROM agente_mensagens WHERE id = ?`).get(id) as DbMensagemRow
    return mapMensagemRow(row)
  }

  static aprovarSugestao(mensagemId: string, textoEditado?: string): AgenteMensagemRecord {
    const db = getDb()
    const msg = db.prepare(`SELECT * FROM agente_mensagens WHERE id = ?`).get(mensagemId) as DbMensagemRow | undefined
    if (!msg) throw new Error('Mensagem não encontrada.')

    const finalTexto = textoEditado ? textoEditado.trim() : msg.texto
    const now = new Date().toISOString()

    db.prepare(
      `UPDATE agente_mensagens
       SET texto = ?, status = 'enviado'
       WHERE id = ?`
    ).run(finalTexto, mensagemId)

    db.prepare(
      `UPDATE agente_conversas
       SET ultima_mensagem_texto = ?, ultima_mensagem_at = ?, status = 'respondido', updated_at = ?
       WHERE id = ?`
    ).run(finalTexto, now, now, msg.conversa_id)

    const updated = db.prepare(`SELECT * FROM agente_mensagens WHERE id = ?`).get(mensagemId) as DbMensagemRow
    return mapMensagemRow(updated)
  }

  static rejeitarSugestao(mensagemId: string): boolean {
    const db = getDb()
    const result = db
      .prepare(`UPDATE agente_mensagens SET status = 'rejeitado' WHERE id = ?`)
      .run(mensagemId)
    return result.changes > 0
  }
}
