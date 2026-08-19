import { isTodayOrYesterday, parseShopeeTimestamp } from './shopeeTime'

export type ParsedShopeeConversation = {
  id: string
  clienteNome: string
  ultimaMensagem: string
  ultimaMensagemAt: string
  unread: number
}

const NAME_KEYS = [
  'to_name',
  'toName',
  'buyer_name',
  'buyerName',
  'user_name',
  'userName',
  'username',
  'nickname',
  'nick_name',
  'name'
]

const ID_KEYS = [
  'conversation_id',
  'conversationId',
  'conversation_id_str',
  'conv_id',
  'convId',
  'chat_id',
  'chatId'
]

const TIME_KEYS = [
  'latest_message_time',
  'latestMessageTime',
  'last_message_time',
  'lastMessageTime',
  'last_message_timestamp',
  'lastMessageTimestamp',
  'update_time',
  'updateTime',
  'updated_at',
  'updatedAt',
  'mtime',
  'timestamp'
]

const TEXT_KEYS = [
  'latest_message_content',
  'latestMessageContent',
  'last_message_content',
  'lastMessageContent',
  'last_message',
  'lastMessage',
  'preview',
  'content',
  'text'
]

const UNREAD_KEYS = ['unread_count', 'unreadCount', 'unread']

export function extractConversationsFromPayload(
  payload: unknown,
  now = new Date()
): { recentes: ParsedShopeeConversation[]; ignoradas: ParsedShopeeConversation[] } {
  const found = new Map<string, ParsedShopeeConversation>()
  const ignored = new Map<string, ParsedShopeeConversation>()

  walk(payload, 0, (obj) => {
    const parsed = parseConversationObject(obj, now)
    if (!parsed) return
    if (!parsed.dentroDaJanela) {
      ignored.set(parsed.item.id, parsed.item)
      return
    }
    found.set(parsed.item.id, parsed.item)
  })

  return {
    recentes: [...found.values()],
    ignoradas: [...ignored.values()]
  }
}

function parseConversationObject(
  obj: Record<string, unknown>,
  now: Date
): { item: ParsedShopeeConversation; dentroDaJanela: boolean } | null {
  const id = firstString(obj, ID_KEYS) || (hasConversationShape(obj) ? firstString(obj, ['id']) : null)
  const nome = firstString(obj, NAME_KEYS)
  const timeRaw = firstValue(obj, TIME_KEYS)
  if (!id || !nome || timeRaw == null) return null
  if (nome.length < 2 || nome.length > 80) return null

  const at = parseShopeeTimestamp(timeRaw, now)
  if (!at) return null

  const item: ParsedShopeeConversation = {
    id: String(id),
    clienteNome: nome,
    ultimaMensagem: extractMessageText(firstValue(obj, TEXT_KEYS)),
    ultimaMensagemAt: at.toISOString(),
    unread: firstNumber(obj, UNREAD_KEYS) ?? 0
  }

  return {
    item,
    dentroDaJanela: isTodayOrYesterday(at, now)
  }
}

function hasConversationShape(obj: Record<string, unknown>): boolean {
  return TIME_KEYS.some((key) => key in obj) && NAME_KEYS.some((key) => key in obj)
}

function extractMessageText(value: unknown): string {
  if (typeof value === 'string') return value.slice(0, 240)
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    for (const key of ['text', 'content', 'body', 'message']) {
      if (typeof record[key] === 'string') return String(record[key]).slice(0, 240)
    }
  }
  return ''
}

function firstString(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = obj[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' && key.toLowerCase().includes('id')) return String(value)
  }
  return null
}

function firstNumber(obj: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = obj[key]
    if (typeof value === 'number' && Number.isFinite(value)) return value
  }
  return null
}

function firstValue(obj: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (key in obj) return obj[key]
  }
  return undefined
}

function walk(node: unknown, depth: number, visit: (obj: Record<string, unknown>) => void): void {
  if (depth > 8 || node == null) return
  if (Array.isArray(node)) {
    for (const item of node.slice(0, 200)) walk(item, depth + 1, visit)
    return
  }
  if (typeof node !== 'object') return
  const obj = node as Record<string, unknown>
  visit(obj)
  for (const value of Object.values(obj).slice(0, 40)) {
    walk(value, depth + 1, visit)
  }
}
