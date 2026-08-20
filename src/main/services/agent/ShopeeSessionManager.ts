import { BrowserWindow, session } from 'electron'
import { logger } from '../../logger'
import { LLMProvider } from './LLMProvider'
import { randomUUID } from 'node:crypto'
import { getDb } from '../../database/db'
import { ShopeeChatMapper, SHOPEE_WEBCHAT_URL } from './ShopeeChatMapper'
import { ShopeeConversationIntegration } from './ShopeeConversationIntegration'
import { AgentesService } from './agentes.service'
import type { AgenteMensagemRecord, ShopeeChatMapSnapshot } from '../../../shared/types'

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
  private static integrationBound = false

  static getSession() {
    return session.fromPartition(this.PARTITION)
  }

  static async abrirJanelaLogin(): Promise<void> {
    this.bindConversationIntegration()
    if (this.loginWindow && !this.loginWindow.isDestroyed()) {
      this.loginWindow.focus()
      await ShopeeChatMapper.attach(this.loginWindow)
      return
    }

    const sess = this.getSession()

    this.loginWindow = new BrowserWindow({
      width: 1024,
      height: 720,
      title: 'Shopee Seller Centre — WebChat',
      webPreferences: {
        session: sess,
        nodeIntegration: false,
        contextIsolation: true
      }
    })

    await ShopeeChatMapper.attach(this.loginWindow)
    this.loginWindow.loadURL(SHOPEE_WEBCHAT_URL)

    this.loginWindow.on('closed', () => {
      this.loginWindow = null
      logger.info('Janela de login da Shopee fechada pelo operador.')
    })
  }

  static async iniciarMapeamento(): Promise<ShopeeChatMapSnapshot> {
    await this.abrirJanelaLogin()
    return ShopeeChatMapper.refresh()
  }

  static obterMapa(): ShopeeChatMapSnapshot {
    return ShopeeChatMapper.getSnapshot()
  }

  static async atualizarMapa(): Promise<ShopeeChatMapSnapshot> {
    if (this.loginWindow && !this.loginWindow.isDestroyed()) {
      await ShopeeChatMapper.attach(this.loginWindow)
    }
    return ShopeeChatMapper.refresh()
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
      ShopeeChatMapper.reset()
      logger.info('Sessão e cookies da Shopee limpos.')
      return true
    } catch (err: any) {
      logger.error('Erro ao limpar sessão da Shopee:', err)
      return false
    }
  }

  static async enviarMensagem(conversaId: string, texto: string): Promise<AgenteMensagemRecord> {
    const conversa = AgentesService.getConversa(conversaId)
    if (!conversa) throw new Error('Conversa não encontrada.')

    try {
      await this.enviarParaShopeeSeNecessario(conversa.externalId, conversa.canal, texto)
      return AgentesService.enviarMensagem(conversaId, texto)
    } catch (error) {
      this.registrarFalha(conversaId, texto, error)
      throw error
    }
  }

  static async aprovarSugestao(mensagemId: string, textoEditado?: string): Promise<AgenteMensagemRecord> {
    const mensagem = AgentesService.getMensagem(mensagemId)
    if (!mensagem) throw new Error('Mensagem não encontrada.')
    const conversa = AgentesService.getConversa(mensagem.conversaId)
    if (!conversa) throw new Error('Conversa não encontrada.')
    const texto = textoEditado?.trim() || mensagem.texto

    try {
      await this.enviarParaShopeeSeNecessario(conversa.externalId, conversa.canal, texto)
      return AgentesService.aprovarSugestao(mensagemId, texto)
    } catch (error) {
      this.registrarFalha(conversa.id, texto, error)
      throw error
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
      `INSERT INTO agente_mensagens (id, conversa_id, remetente, texto, status, confianca, fontes_json, created_at)
       VALUES (?, ?, 'agente_sugestao', ?, 'pendente', ?, ?, ?)`
    ).run(msgSugestaoId, conversaId, resIa.resposta, resIa.confianca, JSON.stringify(resIa.fontes || []), now)

    return {
      conversaId,
      msgClienteId,
      msgSugestaoId,
      respostaIa: resIa.resposta,
      confianca: resIa.confianca
    }
  }

  private static bindConversationIntegration(): void {
    if (this.integrationBound) return
    ShopeeChatMapper.onConversation((conversation) => ShopeeConversationIntegration.ingest(conversation))
    this.integrationBound = true
  }

  private static async enviarParaShopeeSeNecessario(
    externalId: string | null | undefined,
    canal: string,
    texto: string
  ): Promise<void> {
    if (canal !== 'shopee' || !externalId || externalId.startsWith('sim-')) return
    if (externalId.startsWith('dom-')) {
      throw new Error('A conversa ainda não possui uma identidade Shopee confiável para envio.')
    }
    await ShopeeChatMapper.sendMessage(externalId, texto)
  }

  private static registrarFalha(conversaId: string, texto: string, error: unknown): void {
    const message = error instanceof Error ? error.message : String(error)
    try {
      AgentesService.registrarFalhaEnvio(conversaId, texto, message)
    } catch (persistError) {
      logger.error('Não foi possível registrar a falha de envio no Atendimento:', persistError)
    }
  }
}
