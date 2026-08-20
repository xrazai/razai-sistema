import { beforeEach, describe, expect, it, vi } from 'vitest'
import { extractConversationsFromPayload } from '../../src/main/services/agent/shopeeConversationParser'
import { ShopeeConversationIntegration } from '../../src/main/services/agent/ShopeeConversationIntegration'
import type { ShopeeMappedConversation } from '../../src/shared/types'

type FakeConversation = {
  id: string
  agente_id: string
  cliente_nome: string
  canal: string
  status: string
  ultima_mensagem_texto: string
  ultima_mensagem_at: string
  external_id: string | null
  ultimo_erro: string | null
}

type FakeMessage = {
  id: string
  conversa_id: string
  remetente: string
  texto: string
  status: string
  confianca: number | null
  external_id: string | null
  fontes_json: string | null
  created_at: string
}

class FakeDatabase {
  conversations: FakeConversation[] = []
  messages: FakeMessage[] = []

  prepare(sql: string) {
    const query = sql.replace(/\s+/g, ' ').trim()
    return {
      get: (...args: unknown[]) => this.get(query, args),
      run: (...args: unknown[]) => this.run(query, args)
    }
  }

  transaction<T>(callback: () => T): () => T {
    return callback
  }

  private get(query: string, args: unknown[]): unknown {
    if (query.startsWith('SELECT id, conversa_id FROM agente_mensagens')) {
      return this.messages.find((message) => message.external_id === args[0])
    }

    if (query.startsWith('SELECT id FROM agente_mensagens')) {
      return this.messages.find((message) => message.external_id === args[0])
    }

    if (query.startsWith('SELECT ultimo_erro FROM agente_conversas')) {
      const conversation = this.conversations.find((item) => item.id === args[0])
      return conversation ? { ultimo_erro: conversation.ultimo_erro } : undefined
    }

    if (query.includes('external_id = ?') && query.includes('agente_id = ?')) {
      return this.conversations.find(
        (item) => item.agente_id === args[0] && item.external_id === args[1]
      )
    }

    if (query.includes('cliente_nome = ?') && query.includes('ultima_mensagem_texto = ?')) {
      return this.conversations
        .filter(
          (item) =>
            item.agente_id === args[0] &&
            item.cliente_nome === args[1] &&
            item.ultima_mensagem_texto === args[2] &&
            item.ultima_mensagem_at === args[3]
        )
        .sort((a, b) => b.id.localeCompare(a.id))[0]
    }

    throw new Error(`Consulta fake não implementada: ${query}`)
  }

  private run(query: string, args: unknown[]): { changes: number } {
    if (query.startsWith('INSERT INTO agente_conversas')) {
      const [id, agentId, customerName, text, timestamp, externalId] = args as string[]
      this.conversations.push({
        id,
        agente_id: agentId,
        cliente_nome: customerName,
        canal: 'shopee',
        status: 'aguardando_aprovacao',
        ultima_mensagem_texto: text,
        ultima_mensagem_at: timestamp,
        external_id: externalId,
        ultimo_erro: null
      })
      return { changes: 1 }
    }

    if (query.startsWith('INSERT INTO agente_mensagens')) {
      const isSuggestion = query.includes("'agente_sugestao'")
      const [id, conversationId, text] = args as [string, string, string]
      const externalId = isSuggestion ? String(args[4]) : String(args[3])
      const createdAt = isSuggestion ? String(args[6]) : String(args[4])
      this.messages.push({
        id,
        conversa_id: conversationId,
        remetente: isSuggestion ? 'agente_sugestao' : 'cliente',
        texto: text,
        status: isSuggestion ? 'pendente' : 'enviado',
        confianca: null,
        external_id: externalId,
        fontes_json: isSuggestion ? String(args[5]) : null,
        created_at: createdAt
      })
      return { changes: 1 }
    }

    if (query.startsWith('UPDATE agente_conversas SET external_id')) {
      const [externalId, _updatedAt, conversationId] = args as string[]
      const conversation = this.conversations.find((item) => item.id === conversationId)
      if (conversation) conversation.external_id = externalId
      return { changes: conversation ? 1 : 0 }
    }

    if (query.includes('SET cliente_nome = ?')) {
      const [customerName, text, timestamp, _updatedAt, conversationId] = args as string[]
      const conversation = this.conversations.find((item) => item.id === conversationId)
      if (conversation) {
        conversation.cliente_nome = customerName
        conversation.ultima_mensagem_texto = text
        conversation.ultima_mensagem_at = timestamp
        conversation.status = 'aguardando_aprovacao'
        conversation.ultimo_erro = null
      }
      return { changes: conversation ? 1 : 0 }
    }

    if (query.includes('SET ultimo_erro = NULL')) {
      const [_updatedAt, conversationId] = args as string[]
      const conversation = this.conversations.find((item) => item.id === conversationId)
      if (conversation) conversation.ultimo_erro = null
      return { changes: conversation ? 1 : 0 }
    }

    if (query.includes('SET ultimo_erro = ?')) {
      const [error, _updatedAt, conversationId] = args as string[]
      const conversation = this.conversations.find((item) => item.id === conversationId)
      if (conversation) conversation.ultimo_erro = error
      return { changes: conversation ? 1 : 0 }
    }

    throw new Error(`Atualização fake não implementada: ${query}`)
  }
}

const refs = vi.hoisted(() => ({
  db: null as any,
  agent: null as any,
  generateResponse: vi.fn()
}))

vi.mock('../../src/main/database/db', () => ({
  getDb: () => refs.db
}))

vi.mock('../../src/main/services/agent/agentes.service', () => ({
  AgentesService: {
    list: () => (refs.agent ? [refs.agent] : [])
  }
}))

vi.mock('../../src/main/services/agent/LLMProvider', () => ({
  LLMProvider: {
    generateResponse: refs.generateResponse
  }
}))

const receivedAt = '2026-08-20T14:30:00.000Z'

function makeConversation(overrides: Partial<ShopeeMappedConversation> = {}): ShopeeMappedConversation {
  return {
    id: 'conversation-123',
    clienteNome: 'Mariana Costa',
    ultimaMensagem: 'Qual o prazo de postagem?',
    ultimaMensagemAt: receivedAt,
    ultimaMensagemLabel: '20/08 11:30',
    unread: 1,
    fonte: 'network',
    ...overrides
  }
}

describe('Shopee conversation integration', () => {
  beforeEach(() => {
    refs.db = new FakeDatabase()
    refs.agent = {
      id: 'agente-shopee',
      ativo: true,
      canal: 'shopee',
      tipoConexao: 'web_session'
    }
    refs.generateResponse.mockReset()
    refs.generateResponse.mockResolvedValue({
      resposta: 'Olá! Vamos verificar o prazo de postagem para você.',
      confianca: 0.9,
      fontes: ['FAQ de postagem']
    })
  })

  it('persists one customer message and one pending suggestion per fingerprint', async () => {
    const event = makeConversation()

    const first = await ShopeeConversationIntegration.ingest(event)
    const second = await ShopeeConversationIntegration.ingest(event)
    const sameMessageFromDom = await ShopeeConversationIntegration.ingest(
      makeConversation({ id: 'dom-mariana-costa', fonte: 'dom' })
    )

    expect(first.status).toBe('created')
    expect(second.status).toBe('duplicate')
    expect(sameMessageFromDom.status).toBe('duplicate')
    expect(refs.db.conversations).toHaveLength(1)
    expect(refs.db.messages).toHaveLength(2)
    expect(refs.db.messages.filter((message: FakeMessage) => message.remetente === 'cliente')).toHaveLength(1)
    expect(refs.db.messages.filter((message: FakeMessage) => message.remetente === 'agente_sugestao')).toHaveLength(1)
    expect(refs.db.messages.find((message: FakeMessage) => message.remetente === 'agente_sugestao')?.fontes_json).toContain(
      'FAQ de postagem'
    )
  })

  it('opens a new approval cycle for a later customer message', async () => {
    const first = await ShopeeConversationIntegration.ingest(makeConversation())
    const second = await ShopeeConversationIntegration.ingest(
      makeConversation({
        ultimaMensagem: 'E o tecido tem pronta entrega?',
        ultimaMensagemAt: '2026-08-20T14:35:00.000Z'
      })
    )

    expect(second.status).toBe('created')
    expect(refs.db.conversations).toHaveLength(1)
    expect(refs.db.conversations[0].id).toBe(first.conversaId)
    expect(refs.db.messages).toHaveLength(4)
    expect(refs.db.conversations[0].status).toBe('aguardando_aprovacao')
    expect(refs.db.conversations[0].ultima_mensagem_texto).toBe('E o tecido tem pronta entrega?')
  })

  it('keeps the conversation when suggestion generation fails', async () => {
    refs.generateResponse.mockRejectedValueOnce(new Error('LLM indisponível'))

    const result = await ShopeeConversationIntegration.ingest(makeConversation())

    expect(result.status).toBe('failed')
    expect(refs.db.messages).toHaveLength(1)
    expect(refs.db.messages[0].remetente).toBe('cliente')
    expect(refs.db.conversations[0].ultimo_erro).toContain('LLM indisponível')
  })
})

describe('Shopee payload parser fixtures', () => {
  it('normalizes nested recent conversations and ignores older ones', () => {
    const now = new Date('2026-08-20T15:00:00.000Z')
    const result = extractConversationsFromPayload(
      {
        data: {
          conversations: [
            {
              conversation_id: 'recent-1',
              buyer_name: 'Mariana Costa',
              latest_message_time: '2026-08-20T14:30:00.000Z',
              latest_message_id: 'message-1',
              latest_message_content: 'Olá, vocês têm pronta entrega?',
              unread_count: 2
            },
            {
              conversation_id: 'old-1',
              buyer_name: 'Cliente Antigo',
              latest_message_time: '2026-08-17T14:30:00.000Z',
              latest_message_content: 'Ainda disponível?'
            }
          ]
        }
      },
      now
    )

    expect(result.recentes).toHaveLength(1)
    expect(result.recentes[0]).toMatchObject({
      id: 'recent-1',
      clienteNome: 'Mariana Costa',
      ultimaMensagem: 'Olá, vocês têm pronta entrega?',
      ultimaMensagemId: 'message-1',
      unread: 2
    })
    expect(result.ignoradas).toHaveLength(1)
    expect(result.ignoradas[0].id).toBe('old-1')
  })
})
