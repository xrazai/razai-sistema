import { createHash, randomUUID } from 'node:crypto'
import { getDb } from '../../database/db'
import { logger } from '../../logger'
import { AgentesService } from './agentes.service'
import { LLMProvider } from './LLMProvider'
import type { AgenteRecord, ShopeeMappedConversation } from '../../../shared/types'

export type NormalizedShopeeConversation = {
  externalConversationId: string
  externalMessageId: string
  clienteNome: string
  ultimaMensagem: string
  ultimaMensagemAt: string
}

export type ShopeeIngestResult = {
  status: 'ignored' | 'duplicate' | 'created' | 'failed'
  conversaId?: string
  mensagemId?: string
  sugestaoId?: string
  error?: string
}

type DbConversationIdentity = {
  id: string
  external_id: string | null
  ultimo_erro: string | null
}

type DbMessageIdentity = {
  id: string
  conversa_id: string
}

/**
 * Ponte entre o formato observado no WebChat e o domínio persistido do Atendimento.
 * A chave da mensagem é um fingerprint estável para deduplicar eventos de rede e DOM.
 */
export class ShopeeConversationIntegration {
  private static readonly processing = new Set<string>()

  static normalizeConversation(item: ShopeeMappedConversation): NormalizedShopeeConversation | null {
    const externalConversationId = item.id.trim()
    const clienteNome = item.clienteNome.trim()
    const ultimaMensagem = item.ultimaMensagem.trim()
    const at = new Date(item.ultimaMensagemAt)

    if (!externalConversationId || !clienteNome || !ultimaMensagem || Number.isNaN(at.getTime())) {
      return null
    }

    return {
      externalConversationId,
      externalMessageId: buildShopeeMessageKey(clienteNome, ultimaMensagem, at.toISOString()),
      clienteNome,
      ultimaMensagem,
      ultimaMensagemAt: at.toISOString()
    }
  }

  static async ingest(item: ShopeeMappedConversation): Promise<ShopeeIngestResult> {
    const normalized = this.normalizeConversation(item)
    if (!normalized) return { status: 'ignored' }

    const agente = this.getActiveShopeeAgent()
    if (!agente) {
      logger.warn('Mensagem Shopee ignorada porque não existe agente Shopee ativo.')
      return { status: 'ignored' }
    }

    const processingKey = `${agente.id}:${normalized.externalMessageId}`
    if (this.processing.has(processingKey)) return { status: 'duplicate' }
    this.processing.add(processingKey)

    try {
      const persisted = this.persistIncomingMessage(agente, normalized)
      if (!persisted) return { status: 'duplicate' }

      const suggestionExternalId = `suggestion:${normalized.externalMessageId}`
      const db = getDb()
      const existingSuggestion = db
        .prepare(`SELECT id FROM agente_mensagens WHERE external_id = ?`)
        .get(suggestionExternalId) as { id: string } | undefined

      if (existingSuggestion) {
        return {
          status: 'duplicate',
          conversaId: persisted.conversaId,
          mensagemId: persisted.mensagemId,
          sugestaoId: existingSuggestion.id
        }
      }

      try {
        const resposta = await LLMProvider.generateResponse(agente.id, normalized.ultimaMensagem, persisted.conversaId)
        const sugestaoId = `msg-${randomUUID().substring(0, 8)}`
        const now = new Date().toISOString()

        db.prepare(
          `INSERT INTO agente_mensagens
            (id, conversa_id, remetente, texto, status, confianca, external_id, fontes_json, created_at)
           VALUES (?, ?, 'agente_sugestao', ?, 'pendente', ?, ?, ?, ?)`
        ).run(
          sugestaoId,
          persisted.conversaId,
          resposta.resposta,
          resposta.confianca,
          suggestionExternalId,
          JSON.stringify(resposta.fontes || []),
          now
        )

        db.prepare(
          `UPDATE agente_conversas
           SET ultimo_erro = NULL, updated_at = ?
           WHERE id = ?`
        ).run(now, persisted.conversaId)

        return {
          status: persisted.created ? 'created' : 'duplicate',
          conversaId: persisted.conversaId,
          mensagemId: persisted.mensagemId,
          sugestaoId
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        db.prepare(
          `UPDATE agente_conversas
           SET ultimo_erro = ?, updated_at = ?
           WHERE id = ?`
        ).run(`Falha ao gerar sugestão: ${message}`.slice(0, 500), new Date().toISOString(), persisted.conversaId)
        logger.error(`Falha ao gerar sugestão para conversa Shopee ${normalized.externalConversationId}:`, error)
        return {
          status: 'failed',
          conversaId: persisted.conversaId,
          mensagemId: persisted.mensagemId,
          error: message
        }
      }
    } finally {
      this.processing.delete(processingKey)
    }
  }

  private static getActiveShopeeAgent(): AgenteRecord | null {
    const agents = AgentesService.list().filter((agent) => agent.ativo && agent.canal === 'shopee')
    return agents.find((agent) => agent.tipoConexao === 'web_session') || agents[0] || null
  }

  private static persistIncomingMessage(
    agente: AgenteRecord,
    normalized: NormalizedShopeeConversation
  ): { conversaId: string; mensagemId: string; created: boolean } | null {
    const db = getDb()
    const existingMessage = db
      .prepare(`SELECT id, conversa_id FROM agente_mensagens WHERE external_id = ?`)
      .get(normalized.externalMessageId) as DbMessageIdentity | undefined

    if (existingMessage) {
      const existingConversation = db
        .prepare(`SELECT ultimo_erro FROM agente_conversas WHERE id = ?`)
        .get(existingMessage.conversa_id) as { ultimo_erro: string | null } | undefined
      if (!existingConversation?.ultimo_erro) return null
      return {
        conversaId: existingMessage.conversa_id,
        mensagemId: existingMessage.id,
        created: false
      }
    }

    const byExternalId = db
      .prepare(
        `SELECT id, external_id, ultimo_erro
         FROM agente_conversas
         WHERE agente_id = ? AND canal = 'shopee' AND external_id = ?`
      )
      .get(agente.id, normalized.externalConversationId) as DbConversationIdentity | undefined

    const byFingerprint = db
      .prepare(
        `SELECT id, external_id, ultimo_erro
         FROM agente_conversas
         WHERE agente_id = ? AND canal = 'shopee'
           AND cliente_nome = ?
           AND ultima_mensagem_texto = ?
           AND ultima_mensagem_at = ?
         ORDER BY updated_at DESC
         LIMIT 1`
      )
      .get(
        agente.id,
        normalized.clienteNome,
        normalized.ultimaMensagem,
        normalized.ultimaMensagemAt
      ) as DbConversationIdentity | undefined

    const conversation = byExternalId || byFingerprint
    const now = new Date().toISOString()
    let conversaId = conversation?.id

    try {
      const persist = db.transaction(() => {
        if (!conversaId) {
          conversaId = `conv-${randomUUID().substring(0, 8)}`
          db.prepare(
            `INSERT INTO agente_conversas
              (id, agente_id, cliente_nome, canal, status, ultima_mensagem_texto,
               ultima_mensagem_at, external_id, ultimo_erro, created_at, updated_at)
             VALUES (?, ?, ?, 'shopee', 'aguardando_aprovacao', ?, ?, ?, NULL, ?, ?)`
          ).run(
            conversaId,
            agente.id,
            normalized.clienteNome,
            normalized.ultimaMensagem,
            normalized.ultimaMensagemAt,
            normalized.externalConversationId,
            now,
            now
          )
        } else if (
          conversation &&
          conversation.external_id !== normalized.externalConversationId &&
          isSyntheticConversationId(conversation.external_id)
        ) {
          db.prepare(`UPDATE agente_conversas SET external_id = ?, updated_at = ? WHERE id = ?`).run(
            normalized.externalConversationId,
            now,
            conversaId
          )
        }

        const mensagemId = `msg-${randomUUID().substring(0, 8)}`
        db.prepare(
          `INSERT INTO agente_mensagens
            (id, conversa_id, remetente, texto, status, external_id, created_at)
           VALUES (?, ?, 'cliente', ?, 'enviado', ?, ?)`
        ).run(mensagemId, conversaId, normalized.ultimaMensagem, normalized.externalMessageId, normalized.ultimaMensagemAt)

        db.prepare(
          `UPDATE agente_conversas
           SET cliente_nome = ?, ultima_mensagem_texto = ?, ultima_mensagem_at = ?,
               status = 'aguardando_aprovacao', ultimo_erro = NULL, updated_at = ?
           WHERE id = ?`
        ).run(
          normalized.clienteNome,
          normalized.ultimaMensagem,
          normalized.ultimaMensagemAt,
          now,
          conversaId
        )

        return { conversaId: conversaId as string, mensagemId, created: true }
      })

      return persist()
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        const duplicate = db
          .prepare(`SELECT id, conversa_id FROM agente_mensagens WHERE external_id = ?`)
          .get(normalized.externalMessageId) as DbMessageIdentity | undefined
        if (duplicate) {
          return { conversaId: duplicate.conversa_id, mensagemId: duplicate.id, created: false }
        }
      }
      throw error
    }
  }
}

export function buildShopeeMessageKey(clienteNome: string, texto: string, timestamp: string): string {
  const fingerprint = [clienteNome, texto, timestamp].map((value) => value.trim().toLocaleLowerCase()).join('|')
  return `shopee-message:${createHash('sha256').update(fingerprint).digest('hex')}`
}

function isSyntheticConversationId(id: string | null | undefined): boolean {
  return !id || id.startsWith('dom-') || id.startsWith('sim-')
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Error && /unique constraint/i.test(error.message)
}
