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
  status: 'desconectado' | 'conectando' | 'conectado' | 'erro'
  shopNome?: string
  shopId?: string
  cookiesCount: number
  ultimaVerificacao: string
}

export class ShopeeSessionManager {
  private static readonly PARTITION = 'persist:shopee-seller'
  private static loginWindow: BrowserWindow | null = null
  private static integrationBound = false
  private static sessionStatus: 'desconectado' | 'conectando' | 'conectado' | 'erro' = 'desconectado'

  static getSession() {
    return session.fromPartition(this.PARTITION)
  }

  static async abrirJanelaLogin(): Promise<void> {
    this.bindConversationIntegration()
    if (this.loginWindow && !this.loginWindow.isDestroyed()) {
      this.loginWindow.focus()
      // Auto-reanexar o mapper quando a janela já existe
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

    // Definir status inicial
    this.sessionStatus = 'conectando'

    await ShopeeChatMapper.attach(this.loginWindow)
    this.loginWindow.loadURL(SHOPEE_WEBCHAT_URL)

    // Verificar status inicial após a página terminar de carregar
    // Isso garante que verificamos o estado assim que a página carregar,
    // complementando o listener de navegação que vem depois
    this.loginWindow.webContents.on('did-finish-load', async () => {
      await this.verificarEAtualizarStatus()
    })

    // Monitorar carga útil para detectar autenticação
    this.loginWindow.webContents.on('did-navigate-in-page', async (event, url) => {
      if (url.includes('seller.shopee.com.br')) {
        // Verificar cookies após navegação
        await this.verificarEAtualizarStatus()
      }
    })

    this.loginWindow.on('closed', () => {
      this.loginWindow = null
      this.sessionStatus = 'desconectado'
      logger.info('Janela de login da Shopee fechada pelo operador.')
    })
  }

  private static async verificarEAtualizarStatus(): Promise<void> {
    try {
      const sess = this.getSession()
      const cookies = await sess.cookies.get({ domain: '.shopee.com.br' })
      const hasAuthCookie = cookies.some((c) => c.name.includes('SPC_') || c.name.includes('shopee_token'))

      if (hasAuthCookie) {
        this.sessionStatus = 'conectado'
        logger.info('Sessão Shopee autenticada com sucesso.')
      } else {
        this.sessionStatus = 'conectando'
      }
    } catch (err: any) {
      this.sessionStatus = 'erro'
      logger.error('Erro ao verificar status da sessão Shopee:', err)
    }
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
      // Retornar status consistente com o rastreamento interno
      // Em vez de verificar cookies novamente, usamos o sessionStatus
      // que já foi atualizado via verificarEAtualizarStatus() ou navegação
      const baseStatus = this.sessionStatus === 'erro' ? 'erro' : this.sessionStatus

      // Contar cookies apenas para relatório, mas status vem do rastreamento
      let cookiesCount = 0
      try {
        const sess = this.getSession()
        cookiesCount = (await sess.cookies.get({ domain: '.shopee.com.br' })).length
      } catch {
        // Ignorar erro ao contar cookies - status já é consistente
      }

      // Extrair shopId real dos cookies se autenticado
      let shopId: string | undefined
      try {
        const sess = this.getSession()
        const cookies = await sess.cookies.get({ domain: '.shopee.com.br' })
        // Procurar por cookie que contenha ID da loja Shopee
        const shopCookie = cookies.find((c) => c.name.includes('shopid') || c.name.includes('shop_id'))
        if (shopCookie) {
          shopId = shopCookie.value
        }
      } catch {
        // Ignorar erro ao extrair shopId
      }

      return {
        status: baseStatus,
        shopNome: baseStatus === 'conectado' ? 'Loja Razai Shopee' : undefined,
        shopId,
        cookiesCount,
        ultimaVerificacao: new Date().toISOString()
      }
    } catch (err: any) {
      logger.error('Erro ao verificar status da sessão Shopee:', err)
      return {
        status: 'erro',
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
      this.sessionStatus = 'desconectado'
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
