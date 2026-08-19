import { BrowserWindow, session } from 'electron'
import { logger } from '../../logger'
import { AgentesService } from './agentes.service'
import { LLMProvider } from './LLMProvider'
import { randomUUID } from 'node:crypto'
import { getDb } from '../../database/db'

export type ShopeeSessionStatus = {
  conectado: boolean
  shopNome?: string
  shopId?: string
  cookiesCount: number
  ultimaVerificacao: string
}

export class ShopeeSessionManager {
  private static readonly PARTITION = 'persist:shopee-seller'
  private static loginWindow: BrowserWindow | null = null

  static getSession() {
    return session.fromPartition(this.PARTITION)
  }

  static async abrirJanelaLogin(): Promise<void> {
    if (this.loginWindow && !this.loginWindow.isDestroyed()) {
      this.loginWindow.focus()
      return
    }

    const sess = this.getSession()

    this.loginWindow = new BrowserWindow({
      width: 1024,
      height: 720,
      title: 'Shopee Seller Centre — Conectar Sessão',
      webPreferences: {
        session: sess,
        nodeIntegration: false,
        contextIsolation: true
      }
    })

    this.loginWindow.loadURL('https://seller.shopee.com.br/webchat/conversations')

    this.loginWindow.on('closed', () => {
      this.loginWindow = null
      logger.info('Janela de login da Shopee fechada pelo operador.')
    })
  }

  static async verificarStatus(): Promise<ShopeeSessionStatus> {
    try {
      const sess = this.getSession()
      const cookies = await sess.cookies.get({ domain: '.shopee.com.br' })
      const hasAuthCookie = cookies.some((c) => c.name.includes('SPC_') || c.name.includes('shopee_token'))

      return {
        conectado: hasAuthCookie,
        cookiesCount: cookies.length,
        shopNome: hasAuthCookie ? 'Loja Razai Shopee' : undefined,
        ultimaVerificacao: new Date().toISOString()
      }
    } catch (err: any) {
      logger.error('Erro ao verificar cookies da Shopee:', err)
      return {
        conectado: false,
        cookiesCount: 0,
        ultimaVerificacao: new Date().toISOString()
      }
    }
  }

  static async limparSessao(): Promise<boolean> {
    try {
      const sess = this.getSession()
      await sess.clearStorageData()
      logger.info('Sessão e cookies da Shopee limpos.')
      return true
    } catch (err: any) {
      logger.error('Erro ao limpar sessão da Shopee:', err)
      return false
    }
  }

  /**
   * Simula a chegada de uma nova mensagem da Shopee para teste do fluxo completo
   */
  static async simularMensagemRecebida(
    agenteId: string,
    clienteNome: string,
    textoPergunta: string
  ) {
    const db = getDb()
    const conversaId = `conv-${randomUUID().substring(0, 8)}`
    const now = new Date().toISOString()

    // 1. Cria a conversa
    db.prepare(
      `INSERT INTO agente_conversas (id, agente_id, cliente_nome, canal, status, ultima_mensagem_texto, ultima_mensagem_at, created_at, updated_at)
       VALUES (?, ?, ?, 'shopee', 'aguardando_aprovacao', ?, ?, ?, ?)`
    ).run(conversaId, agenteId, clienteNome, textoPergunta, now, now, now)

    // 2. Registra mensagem do cliente
    const msgClienteId = `msg-${randomUUID().substring(0, 8)}`
    db.prepare(
      `INSERT INTO agente_mensagens (id, conversa_id, remetente, texto, status, created_at)
       VALUES (?, ?, 'cliente', ?, 'enviado', ?)`
    ).run(msgClienteId, conversaId, textoPergunta, now)

    // 3. Gera a sugestão da IA
    const resIa = await LLMProvider.generateResponse(agenteId, textoPergunta, conversaId)

    // 4. Salva a sugestão pendente
    const msgSugestaoId = `msg-${randomUUID().substring(0, 8)}`
    db.prepare(
      `INSERT INTO agente_mensagens (id, conversa_id, remetente, texto, status, confianca, created_at)
       VALUES (?, ?, 'agente_sugestao', ?, 'pendente', ?, ?)`
    ).run(msgSugestaoId, conversaId, resIa.resposta, resIa.confianca, now)

    return {
      conversaId,
      msgClienteId,
      msgSugestaoId,
      respostaIa: resIa.resposta,
      confianca: resIa.confianca
    }
  }
}
