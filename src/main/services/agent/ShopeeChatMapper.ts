import { BrowserWindow } from 'electron'
import { logger } from '../../logger'
import { extractConversationsFromPayload } from './shopeeConversationParser'
import { currentDateWindow, isTodayOrYesterday, parseShopeeTimeLabel } from './shopeeTime'
import type {
  ShopeeChatEndpoint,
  ShopeeChatMapSnapshot,
  ShopeeMappedConversation
} from '../../../shared/types'

export const SHOPEE_WEBCHAT_URL = 'https://seller.shopee.com.br/new-webchat/conversations'

type PendingRequest = {
  url: string
  method: string
  kind: ShopeeChatEndpoint['kind']
  status?: number
}

type ConversationListener = (conversation: ShopeeMappedConversation) => void | Promise<void>

type SendWaiter = {
  requestId: string | null
  resolve: (ok: boolean) => void
  timer: ReturnType<typeof setTimeout>
}

export class ShopeeChatMapper {
  private static attachedWindow: BrowserWindow | null = null
  private static endpoints = new Map<string, ShopeeChatEndpoint>()
  private static conversas = new Map<string, ShopeeMappedConversation>()
  private static ignoredIds = new Set<string>()
  private static pending = new Map<string, PendingRequest>()
  private static pollTimer: ReturnType<typeof setInterval> | null = null
  private static debuggerHandler: ((event: unknown, method: string, params: unknown) => void) | null = null
  private static webRequestBound = false
  private static readyHandler: (() => void) | null = null
  private static scrapeHandler: (() => void) | null = null
  private static conversationListener: ConversationListener | null = null
  private static sendWaiter: SendWaiter | null = null

  static onConversation(listener: ConversationListener): () => void {
    this.conversationListener = listener
    return () => {
      if (this.conversationListener === listener) this.conversationListener = null
    }
  }

  static getSnapshot(): ShopeeChatMapSnapshot {
    const window = currentDateWindow()
    const win = this.attachedWindow && !this.attachedWindow.isDestroyed() ? this.attachedWindow : null
    return {
      urlAtual: win?.webContents.getURL() || SHOPEE_WEBCHAT_URL,
      mapeando: Boolean(win),
      endpoints: [...this.endpoints.values()].sort((a, b) => b.vistoEm.localeCompare(a.vistoEm)),
      conversasRecentes: [...this.conversas.values()].sort((a, b) =>
        b.ultimaMensagemAt.localeCompare(a.ultimaMensagemAt)
      ),
      conversasIgnoradas: this.ignoredIds.size,
      janelaHoje: window.todayYmd,
      janelaOntem: window.yesterdayYmd,
      atualizadoEm: new Date().toISOString()
    }
  }

  static reset(): void {
    this.detach()
    this.endpoints.clear()
    this.conversas.clear()
    this.pending.clear()
    this.ignoredIds.clear()
    this.finishSendWaiter(false)
  }

  static async attach(win: BrowserWindow): Promise<void> {
    if (this.attachedWindow === win && !win.isDestroyed()) {
      await this.enableNetworkCapture(win)
      await this.scrapeDom()
      return
    }

    this.detach()
    this.attachedWindow = win
    this.bindWebRequest(win)
    this.startPolling()

    this.readyHandler = () => {
      void this.enableNetworkCapture(win)
      void this.scrapeDom()
    }
    this.scrapeHandler = () => {
      void this.scrapeDom()
    }
    win.webContents.on('did-finish-load', this.readyHandler)
    win.webContents.on('did-navigate-in-page', this.scrapeHandler)

    win.on('closed', () => {
      if (this.attachedWindow === win) {
        this.detach()
      }
    })

    const currentUrl = win.webContents.getURL()
    if (!win.webContents.isLoading() && currentUrl && currentUrl !== 'about:blank') {
      this.readyHandler()
    }

    logger.info('Mapeador do WebChat Shopee anexado à janela de sessão.')
  }

  static detach(): void {
    this.finishSendWaiter(false)
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }

    const win = this.attachedWindow
    if (win && !win.isDestroyed()) {
      try {
        if (this.readyHandler) {
          win.webContents.removeListener('did-finish-load', this.readyHandler)
        }
        if (this.scrapeHandler) {
          win.webContents.removeListener('did-navigate-in-page', this.scrapeHandler)
        }
        if (this.debuggerHandler) {
          win.webContents.debugger.removeListener('message', this.debuggerHandler)
        }
        if (win.webContents.debugger.isAttached()) {
          win.webContents.debugger.detach()
        }
      } catch {
        // janela já encerrada
      }
    }

    this.readyHandler = null
    this.scrapeHandler = null
    this.debuggerHandler = null
    this.attachedWindow = null
  }

  static async refresh(): Promise<ShopeeChatMapSnapshot> {
    await this.scrapeDom()
    return this.getSnapshot()
  }

  static async sendMessage(conversationId: string, text: string): Promise<void> {
    const win = this.attachedWindow && !this.attachedWindow.isDestroyed() ? this.attachedWindow : null
    const trimmedText = text.trim()
    if (!win) throw new Error('A sessão Shopee não está aberta.')
    if (!conversationId.trim()) throw new Error('A conversa Shopee não possui identidade externa.')
    if (!trimmedText) throw new Error('A mensagem não pode ficar vazia.')

    const requestPromise = this.waitForSendRequest()
    let result: { ok?: boolean; error?: string }
    try {
      result = (await win.webContents.executeJavaScript(
        buildSendMessageScript(conversationId, trimmedText),
        true
      )) as { ok?: boolean; error?: string }
    } catch (error) {
      this.finishSendWaiter(false)
      throw error
    }

    if (!result?.ok) {
      this.finishSendWaiter(false)
      throw new Error(result?.error || 'Não foi possível preencher o compositor do WebChat.')
    }

    const confirmed = await requestPromise
    if (!confirmed) {
      throw new Error('A Shopee não confirmou o envio da mensagem.')
    }
  }

  private static startPolling(): void {
    if (this.pollTimer) clearInterval(this.pollTimer)
    this.pollTimer = setInterval(() => {
      void this.scrapeDom()
    }, 8000)
  }

  private static bindWebRequest(win: BrowserWindow): void {
    if (this.webRequestBound) return
    this.webRequestBound = true
    win.webContents.session.webRequest.onCompleted(
      { urls: ['*://*.shopee.com.br/*', '*://*.shopee.com/*'] },
      (details) => {
        const kind = classifyChatEndpoint(details.url, details.method)
        if (kind) this.rememberEndpoint(details.method, details.url, kind)
      }
    )
  }

  private static async enableNetworkCapture(win: BrowserWindow, attempt = 1): Promise<void> {
    if (win.isDestroyed()) return

    const url = win.webContents.getURL()
    if (!url || url === 'about:blank') {
      return
    }

    const dbg = win.webContents.debugger
    try {
      if (this.debuggerHandler) {
        dbg.removeListener('message', this.debuggerHandler)
        this.debuggerHandler = null
      }
      if (dbg.isAttached()) {
        try {
          dbg.detach()
        } catch {
          // alvo anterior já fechou na navegação
        }
      }

      dbg.attach('1.3')
      await dbg.sendCommand('Network.enable')

      this.debuggerHandler = (_event, method, params) => {
        void this.onDebuggerEvent(win, method, params)
      }
      dbg.on('message', this.debuggerHandler)
      logger.info(`Debugger de rede da Shopee anexado em ${url}`)
    } catch (err: any) {
      if (attempt < 3) {
        await delay(700 * attempt)
        return this.enableNetworkCapture(win, attempt + 1)
      }
      logger.warn('Não foi possível anexar o debugger de rede da Shopee:', err?.message || err)
    }
  }

  private static async onDebuggerEvent(
    win: BrowserWindow,
    method: string,
    params: unknown
  ): Promise<void> {
    const payload = params as Record<string, any>
    if (method === 'Network.requestWillBeSent') {
      const url = String(payload?.request?.url || '')
      const httpMethod = String(payload?.request?.method || 'GET')
      const requestBody = String(payload?.request?.postData || '').toLowerCase()
      const kind = classifyChatEndpoint(url, httpMethod, requestBody)
      if (!kind) return
      const requestId = String(payload.requestId)
      this.pending.set(requestId, { url, method: httpMethod, kind })
      if (kind === 'envio' && this.sendWaiter && !this.sendWaiter.requestId) {
        this.sendWaiter.requestId = requestId
      }
      this.rememberEndpoint(httpMethod, url, kind)
      return
    }

    if (method === 'Network.responseReceived') {
      const requestId = String(payload?.requestId || '')
      const pending = this.pending.get(requestId)
      if (pending) pending.status = Number(payload?.response?.status || 0)
      return
    }

    if (method === 'Network.loadingFailed') {
      const requestId = String(payload?.requestId || '')
      const pending = this.pending.get(requestId)
      this.pending.delete(requestId)
      if (pending?.kind === 'envio' && this.sendWaiter?.requestId === requestId) {
        this.finishSendWaiter(false)
      }
      return
    }

    if (method !== 'Network.loadingFinished') return
    const requestId = String(payload?.requestId || '')
    const pending = this.pending.get(requestId)
    if (!pending) return
    this.pending.delete(requestId)

    try {
      const body = (await win.webContents.debugger.sendCommand('Network.getResponseBody', {
        requestId
      })) as { body?: string; base64Encoded?: boolean }
      const raw = body?.base64Encoded && body.body ? Buffer.from(body.body, 'base64').toString('utf8') : body?.body
      if (raw) {
        const json = JSON.parse(raw)
        const extracted = extractConversationsFromPayload(json)
        this.mergeConversations(extracted.recentes, 'network')
        for (const item of extracted.ignoradas) this.ignoredIds.add(item.id)
      }
    } catch {
      // resposta não-JSON ou corpo já descartado
    }

    if (pending.kind === 'envio' && this.sendWaiter?.requestId === requestId) {
      this.finishSendWaiter(pending.status !== undefined && pending.status >= 200 && pending.status < 300)
    }
  }

  private static rememberEndpoint(method: string, url: string, kind: ShopeeChatEndpoint['kind']): void {
    const cleanUrl = sanitizeUrl(url)
    const key = `${method} ${cleanUrl}`
    this.endpoints.set(key, {
      method,
      url: cleanUrl,
      kind,
      vistoEm: new Date().toISOString()
    })
  }

  private static mergeConversations(
    items: Array<Omit<ShopeeMappedConversation, 'fonte' | 'ultimaMensagemLabel'>>,
    fonte: ShopeeMappedConversation['fonte']
  ): void {
    for (const item of items) {
      const at = new Date(item.ultimaMensagemAt)
      const previous = this.conversas.get(item.id)
      const conversation = {
        ...item,
        fonte,
        ultimaMensagemLabel: formatLabel(at)
      }
      this.conversas.set(item.id, conversation)

      const changed =
        !previous ||
        previous.ultimaMensagem !== conversation.ultimaMensagem ||
        previous.ultimaMensagemAt !== conversation.ultimaMensagemAt ||
        previous.clienteNome !== conversation.clienteNome
      if (changed) this.notifyConversation(conversation)
    }
  }

  private static notifyConversation(conversation: ShopeeMappedConversation): void {
    if (!this.conversationListener) return
    Promise.resolve(this.conversationListener(conversation)).catch((error) => {
      logger.error('Falha ao processar conversa recebida da Shopee:', error)
    })
  }

  private static waitForSendRequest(timeoutMs = 12000): Promise<boolean> {
    this.finishSendWaiter(false)
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        if (this.sendWaiter?.timer === timer) this.sendWaiter = null
        resolve(false)
      }, timeoutMs)
      this.sendWaiter = { requestId: null, resolve, timer }
    })
  }

  private static finishSendWaiter(ok: boolean): void {
    const waiter = this.sendWaiter
    if (!waiter) return
    this.sendWaiter = null
    clearTimeout(waiter.timer)
    waiter.resolve(ok)
  }

  private static async scrapeDom(): Promise<void> {
    const win = this.attachedWindow
    if (!win || win.isDestroyed()) return

    try {
      const rows = (await win.webContents.executeJavaScript(DOM_SCRAPE_SCRIPT, true)) as Array<{
        id: string
        nome: string
        preview: string
        tempoTexto: string
      }>

      if (!Array.isArray(rows)) return
      const now = new Date()
      const recentes: Array<Omit<ShopeeMappedConversation, 'fonte' | 'ultimaMensagemLabel'>> = []

      for (const row of rows) {
        const id = row.id || `dom-${slug(row.nome)}`
        const at = parseShopeeTimeLabel(row.tempoTexto, now)
        if (!at || !isTodayOrYesterday(at, now)) {
          this.ignoredIds.add(id)
          continue
        }
        recentes.push({
          id,
          clienteNome: row.nome,
          ultimaMensagem: row.preview || '',
          ultimaMensagemAt: at.toISOString(),
          unread: 0
        })
      }

      this.mergeConversations(recentes, 'dom')
    } catch (err: any) {
      logger.warn('Falha ao ler DOM do WebChat Shopee:', err?.message || err)
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function classifyChatEndpoint(url: string, method: string, requestBody = ''): ShopeeChatEndpoint['kind'] | null {
  const lower = url.toLowerCase()
  if (!/shopee\.com\.br/.test(lower)) return null
  if (/\.(js|css|png|jpe?g|gif|svg|webp|woff2?|ttf|map|ico)(\?|$)/.test(lower)) return null
  if (method !== 'GET' && /send|reply|message|msg/.test(lower)) return 'envio'
  if (
    method !== 'GET' &&
    /conversation|webchat|sellerchat|\/chat|\/im\//.test(lower) &&
    /text|message|content|body|reply/.test(requestBody)
  ) {
    return 'envio'
  }
  if (lower.includes('conversation') && /message|msg/.test(lower)) return 'mensagens'
  if (lower.includes('conversation') || lower.includes('webchat') || lower.includes('sellerchat')) {
    return lower.includes('conversation') ? 'conversas' : 'chat'
  }
  if (lower.includes('/chat') || lower.includes('/im/')) return 'chat'
  return null
}

function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url)
    parsed.search = ''
    parsed.hash = ''
    return parsed.toString()
  } catch {
    return url.split('?')[0]
  }
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
}

function formatLabel(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const DOM_SCRAPE_SCRIPT = `(() => {
  const TIME_RE = /(agora|ontem|hoje|\\d{1,2}:\\d{2}|\\d{1,2}\\/\\d{1,2}(?:\\/\\d{2,4})?|\\d+\\s*(s|seg|min|h|hora|horas))/i
  const seen = new Set()
  const rows = []
  const nodes = Array.from(document.querySelectorAll('div, li, a, button'))
  for (const el of nodes) {
    if (el.children.length > 10) continue
    const rect = el.getBoundingClientRect()
    if (rect.width < 160 || rect.height < 40 || rect.height > 100 || rect.left > 520) continue
    const text = (el.innerText || '').trim()
    if (!text || text.length > 280) continue
    const lines = text.split('\\n').map((s) => s.trim()).filter(Boolean)
    if (lines.length < 2) continue
    const tempoTexto = lines.find((line) => TIME_RE.test(line))
    if (!tempoTexto) continue
    const nome = lines[0]
    if (seen.has(nome + tempoTexto)) continue
    seen.add(nome + tempoTexto)
    rows.push({
      id: el.getAttribute('data-id') || '',
      nome,
      preview: lines.find((line) => line !== nome && line !== tempoTexto) || '',
      tempoTexto
    })
  }
  return rows.slice(0, 40)
})()`

function buildSendMessageScript(conversationId: string, text: string): string {
  return `(async () => {
    const conversationId = ${JSON.stringify(conversationId)};
    const text = ${JSON.stringify(text)};
    const visible = (element) => {
      if (!element) return false;
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const rows = Array.from(document.querySelectorAll('[data-id], [data-conversation-id], [data-conversationid]'));
    const row = rows.find((element) =>
      element.getAttribute('data-id') === conversationId ||
      element.getAttribute('data-conversation-id') === conversationId ||
      element.getAttribute('data-conversationid') === conversationId
    );
    if (!row || !visible(row)) {
      return { ok: false, error: 'Conversa Shopee não encontrada na janela do WebChat.' };
    }
    row.click();
    await new Promise((resolve) => setTimeout(resolve, 250));

    const editors = Array.from(document.querySelectorAll('textarea, input[type="text"], [contenteditable="true"]'))
      .filter(visible)
      .filter((element) => {
        const text = [element.getAttribute('placeholder'), element.getAttribute('aria-label'), element.getAttribute('data-testid')]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return !/search|buscar|pesquisar|filter|filtro/.test(text);
      });
    const editor = editors[editors.length - 1];
    if (!editor) return { ok: false, error: 'Campo de mensagem do WebChat não encontrado.' };

    editor.focus();
    if (editor instanceof HTMLTextAreaElement || editor instanceof HTMLInputElement) {
      const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(editor), 'value');
      if (descriptor && descriptor.set) descriptor.set.call(editor, text);
      else editor.value = text;
    } else {
      editor.textContent = text;
    }
    editor.dispatchEvent(new InputEvent('input', { bubbles: true, data: text, inputType: 'insertText' }));
    editor.dispatchEvent(new Event('change', { bubbles: true }));

    const container = editor.closest('form, [role="dialog"], section, footer, div') || document;
    const buttons = Array.from(container.querySelectorAll('button, [role="button"]')).filter(visible);
    const sendButton = buttons.find((button) => {
      const label = [button.textContent, button.getAttribute('aria-label'), button.getAttribute('title'), button.getAttribute('data-testid')]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return /send|enviar|responder|submit/.test(label);
    });
    if (!sendButton) return { ok: false, error: 'Botão de envio do WebChat não encontrado.' };
    sendButton.click();
    return { ok: true };
  })()`
}
