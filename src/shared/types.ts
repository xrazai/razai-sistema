export type AppInfo = {
  name: string
  version: string
}

export type DbHealth = {
  ok: boolean
  schemaVersion: string
  error?: string
  timestamp?: string
}

export type TecidoRecord = {
  id: string
  codigo: string
  nome: string
  composicao: string
  largura: number
  rendimento: number | null
  gramaturaLinear: number | null
  gramaturaM2: number | null
  tipo: string | null
  transparencia: string | null
  elasticidade: string | null
  acabamento: string | null
  createdAt: string
  updatedAt: string
}

export type CreateTecidoInput = {
  nome: string
  composicao: string
  largura: number
  rendimento?: number | null
  gramaturaLinear?: number | null
  gramaturaM2?: number | null
  tipo?: string | null
  transparencia?: string | null
  elasticidade?: string | null
  acabamento?: string | null
}

export type UpdateTecidoInput = Partial<CreateTecidoInput>

export type TecidosApi = {
  list: (search?: string) => Promise<TecidoRecord[]>
  getById: (id: string) => Promise<TecidoRecord | null>
  create: (input: CreateTecidoInput) => Promise<TecidoRecord>
  update: (id: string, input: UpdateTecidoInput) => Promise<TecidoRecord>
  delete: (id: string) => Promise<boolean>
}

export type CorRecord = {
  id: string
  codigo: string
  nome: string
  hex: string
  lab: string
  createdAt: string
  updatedAt: string
}

export type CreateCorInput = {
  nome: string
  hex: string
  lab: string
}

export type UpdateCorInput = Partial<CreateCorInput>

export type CoresApi = {
  list: (search?: string) => Promise<CorRecord[]>
  getById: (id: string) => Promise<CorRecord | null>
  create: (input: CreateCorInput) => Promise<CorRecord>
  update: (id: string, input: UpdateCorInput) => Promise<CorRecord>
  delete: (id: string) => Promise<boolean>
}

export type SettingsApi = {
  get: (key: string) => Promise<string | null>
  set: (key: string, value: string) => Promise<boolean>
  getAll: () => Promise<Record<string, string>>
}

export type PrinterInfo = {
  name: string
  driverName?: string
  portName?: string
  isDefault?: boolean
  status?: string
}

export type PrinterApi = {
  list: () => Promise<PrinterInfo[]>
  printTest: (printerName?: string) => Promise<{ ok: boolean; error?: string }>
}

export type VinculoRecord = {
  id: string
  tecidoId: string
  corId: string
  sku: string
  tecidoNome: string
  tecidoCodigo: string
  corNome: string
  corCodigo: string
  corHex: string
  corLab: string
  createdAt: string
  updatedAt: string
}

export type CreateVinculosInput = {
  tecidoId: string
  corIds: string[]
}

export type VinculosApi = {
  list: (search?: string) => Promise<VinculoRecord[]>
  listByTecido: (tecidoId: string) => Promise<VinculoRecord[]>
  createBatch: (input: CreateVinculosInput) => Promise<VinculoRecord[]>
  delete: (id: string) => Promise<boolean>
  deleteByTecidoAndCor: (tecidoId: string, corId: string) => Promise<boolean>
}

export type ItemLancamentoInput = {
  tecidoId: string
  corId: string
  vinculoId?: string
  sku: string
  tecidoNome: string
  tecidoCodigo: string
  corNome: string
  corCodigo: string
  corHex?: string
  precoUnitario: number
  quantidade: number
  subtotal: number
}

export type VendaItemRecord = ItemLancamentoInput & {
  id: string
  vendaId: string
  createdAt: string
}

export type VendaRecord = {
  id: string
  numero: number
  pedidoOrigemId?: string | null
  clienteNome?: string | null
  valorTotal: number
  quantidadeTotal: number
  itensCount: number
  formaPagamento?: string | null
  observacoes?: string | null
  createdAt: string
  updatedAt: string
  itens?: VendaItemRecord[]
}

export type CreateVendaInput = {
  clienteNome?: string
  pedidoOrigemId?: string
  formaPagamento?: string
  observacoes?: string
  itens: ItemLancamentoInput[]
}

export type VendasApi = {
  list: (search?: string) => Promise<VendaRecord[]>
  getById: (id: string) => Promise<VendaRecord | null>
  create: (input: CreateVendaInput) => Promise<VendaRecord>
  delete: (id: string) => Promise<boolean>
  imprimirCupom: (vendaId: string, printerName?: string) => Promise<{ ok: boolean; error?: string }>
}

export type PedidoItemRecord = ItemLancamentoInput & {
  id: string
  pedidoId: string
  createdAt: string
}

export type PedidoStatus = 'pendente' | 'aprovado' | 'cancelado'

export type PedidoRecord = {
  id: string
  numero: number
  clienteNome?: string | null
  status: PedidoStatus
  valorTotal: number
  quantidadeTotal: number
  itensCount: number
  observacoes?: string | null
  vendaGeradaId?: string | null
  createdAt: string
  updatedAt: string
  itens?: PedidoItemRecord[]
}

export type CreatePedidoInput = {
  clienteNome?: string
  observacoes?: string
  itens: ItemLancamentoInput[]
}

export type UpdatePedidoInput = {
  clienteNome?: string
  observacoes?: string
  status?: PedidoStatus
  itens?: ItemLancamentoInput[]
}

export type PedidoPdfResult = {
  ok: boolean
  filePath?: string
  fileName?: string
  title?: string
  data?: Uint8Array
  error?: string
}

export type PedidosApi = {
  list: (search?: string) => Promise<PedidoRecord[]>
  getById: (id: string) => Promise<PedidoRecord | null>
  create: (input: CreatePedidoInput) => Promise<PedidoRecord>
  update: (id: string, input: UpdatePedidoInput) => Promise<PedidoRecord>
  delete: (id: string) => Promise<boolean>
  aprovar: (id: string) => Promise<{ pedido: PedidoRecord; venda: VendaRecord }>
  gerarPdf: (id: string) => Promise<PedidoPdfResult>
  compartilhar: (id: string) => Promise<PedidoPdfResult>
  abrirShareNativo: (filePath: string, title: string) => Promise<PedidoPdfResult>
}

export type BackupResult = {
  ok: boolean
  filePath?: string
  canceled?: boolean
  error?: string
}

export type BackupApi = {
  exportTecidosCsv: (filePath?: string) => Promise<BackupResult>
  exportCoresCsv: (filePath?: string) => Promise<BackupResult>
  exportDatabase: (destinationPath?: string) => Promise<BackupResult>
}

export type SystemMetrics = {
  electronVersion: string
  nodeVersion: string
  chromeVersion: string
  platform: string
  arch: string
  memoryRssMb: number
  memoryHeapUsedMb: number
  memoryHeapTotalMb: number
  uptimeSeconds: number
  dbPath: string
  dbSizeBytes: number
  dbOk: boolean
}

export type DiagnosticsApi = {
  getLogs: (limit?: number) => Promise<string[]>
  clearLogs: () => Promise<boolean>
  getMetrics: () => Promise<SystemMetrics>
}

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error'

export type UpdateProgress = {
  percent: number
  bytesPerSecond: number
  transferred: number
  total: number
}

export type RelatorioFiltroInput = {
  dataInicio?: string
  dataFim?: string
}

export type VendaDiariaItem = {
  data: string
  label: string
  valorTotal: number
  quantidadeTotal: number
  vendasCount: number
}

export type RelatorioKpis = {
  faturamentoTotal: number
  quantidadeTotalMetros: number
  totalVendas: number
  ticketMedioVenda: number
  precoMedioMetro: number
}

export type RelatorioCorItem = {
  corId: string
  corNome: string
  corCodigo: string
  corHex?: string
  quantidadeTotal: number
  valorTotal: number
  precoMedio: number
  percentualTecido: number
  percentualGeral: number
}

export type RelatorioTecidoItem = {
  tecidoId: string
  tecidoNome: string
  tecidoCodigo: string
  quantidadeTotal: number
  valorTotal: number
  precoMedio: number
  percentualGeral: number
  cores: RelatorioCorItem[]
}

export type RelatorioVendasTecidoCor = {
  kpis: RelatorioKpis
  dataInicio?: string
  dataFim?: string
  tecidos: RelatorioTecidoItem[]
}

export type PrevisibilidadeHorizonte = 7 | 15 | 30 | 60

export type PrevisibilidadeTendencia = 'alta' | 'estavel' | 'queda'
export type ConfiancaForecast = 'alta' | 'media' | 'baixa' | 'preliminar'
export type CurvaAbc = 'A' | 'B' | 'C'

export type PrevisibilidadeFiltroInput = {
  horizonteDias?: PrevisibilidadeHorizonte
  curvaAbc?: 'todas' | 'A' | 'B' | 'C'
  tendencia?: 'todas' | 'alta' | 'estavel' | 'queda'
  search?: string
}

export type PrevisibilidadeItem = {
  tecidoId: string
  tecidoNome: string
  tecidoCodigo: string
  corId: string
  corNome: string
  corCodigo: string
  corHex?: string
  sku: string
  totalVendidoMetros: number
  totalFaturado: number
  vendasCount: number
  precoMedioMetro: number
  intervaloMedioDias: number
  tamanhoMedioPedidoMetros: number
  taxaDiariaCroston: number
  tendencia: PrevisibilidadeTendencia
  variacaoPercentual: number
  curvaAbc: CurvaAbc
  confianca: ConfiancaForecast
  horizonteDias: number
  demandaPrevistaMetros: number
  demandaPrevistaRolos: number
  valorPrevistoReposicao: number
}

export type PrevisibilidadeKpis = {
  horizonteDias: number
  demandaTotalProjetadaMetros: number
  demandaTotalProjetadaRolos: number
  investimentoTotalReposicao: number
  taxaMediaDiariaGeralMetros: number
  totalSkusAnalisados: number
  totalSkusEmAlta: number
}

export type RelatorioPrevisibilidadeResult = {
  kpis: PrevisibilidadeKpis
  itens: PrevisibilidadeItem[]
  generatedAt: string
}

export type RelatoriosApi = {
  getKpis: (filtro?: RelatorioFiltroInput) => Promise<RelatorioKpis>
  getVendasUltimos7Dias: () => Promise<VendaDiariaItem[]>
  getVendasPorTecidoCor: (filtro?: RelatorioFiltroInput) => Promise<RelatorioVendasTecidoCor>
  getPrevisibilidadeEstoque: (filtro?: PrevisibilidadeFiltroInput) => Promise<RelatorioPrevisibilidadeResult>
}

export type UpdateInfo = {
  status: UpdateStatus
  version?: string
  currentVersion?: string
  releaseDate?: string
  releaseNotes?: string
  progress?: UpdateProgress
  error?: string
}

export type UpdaterCheckResult = {
  ok: boolean
  status: UpdateStatus
  version?: string
  error?: string
}

export type UpdaterApi = {
  check: () => Promise<UpdaterCheckResult>
  install: () => Promise<void>
  getStatus: () => Promise<UpdateInfo>
  onStatusChange: (callback: (info: UpdateInfo) => void) => () => void
}

export type AgenteCanal = 'shopee' | 'whatsapp' | 'manual'
export type AgenteTipoConexao = 'web_session' | 'rest_api'
export type AgenteModoOperacao = 'copiloto' | 'autonomo' | 'pausado'
export type AgenteConhecimentoTipo = 'faq' | 'politica' | 'manual_produto' | 'texto_livre'
export type AgenteConversaStatus = 'aguardando_aprovacao' | 'respondido' | 'arquivado'
export type AgenteMensagemRemetente = 'cliente' | 'agente_sugestao' | 'agente_enviado' | 'operador'
export type AgenteMensagemStatus = 'pendente' | 'aprovado' | 'enviado' | 'rejeitado' | 'falha'

export type AgenteRecord = {
  id: string
  nome: string
  descricao: string | null
  canal: AgenteCanal
  tipoConexao: AgenteTipoConexao
  modoOperacao: AgenteModoOperacao
  promptSistema: string
  configJson: string
  ativo: boolean
  conhecimentosCount?: number
  conversasAtivasCount?: number
  createdAt: string
  updatedAt: string
}

export type CreateAgenteInput = {
  id?: string
  nome: string
  descricao?: string | null
  canal?: AgenteCanal
  tipoConexao?: AgenteTipoConexao
  modoOperacao?: AgenteModoOperacao
  promptSistema?: string
  configJson?: string
  ativo?: boolean
}

export type UpdateAgenteInput = Partial<CreateAgenteInput>

export type AgenteConhecimentoRecord = {
  id: string
  agenteId: string
  tipo: AgenteConhecimentoTipo
  titulo: string
  conteudo: string
  ativo: boolean
  ordem: number
  createdAt: string
  updatedAt: string
}

export type CreateAgenteConhecimentoInput = {
  agenteId: string
  tipo: AgenteConhecimentoTipo
  titulo: string
  conteudo: string
  ativo?: boolean
  ordem?: number
}

export type UpdateAgenteConhecimentoInput = Partial<CreateAgenteConhecimentoInput>

export type AgenteConversaRecord = {
  id: string
  agenteId: string
  clienteId: string | null
  clienteNome: string
  canal: AgenteCanal
  status: AgenteConversaStatus
  ultimaMensagemTexto: string | null
  ultimaMensagemAt: string
  createdAt: string
  updatedAt: string
  externalId?: string | null
  ultimoErro?: string | null
  mensagens?: AgenteMensagemRecord[]
}

export type AgenteMensagemRecord = {
  id: string
  conversaId: string
  remetente: AgenteMensagemRemetente
  texto: string
  status: AgenteMensagemStatus
  confianca: number | null
  createdAt: string
  externalId?: string | null
  fontes?: string[]
}

export type CreateAgenteMensagemInput = {
  conversaId: string
  remetente: AgenteMensagemRemetente
  texto: string
  status?: AgenteMensagemStatus
  confianca?: number | null
}

export type AgenteGerarRespostaResult = {
  resposta: string
  confianca: number
  fontes: string[]
}

export type ShopeeSessionStatus = {
  conectado: boolean
  shopNome?: string
  shopId?: string
  cookiesCount: number
  ultimaVerificacao: string
}

export type ShopeeChatEndpoint = {
  method: string
  url: string
  kind: 'conversas' | 'mensagens' | 'envio' | 'chat'
  vistoEm: string
}

export type ShopeeMappedConversation = {
  id: string
  clienteNome: string
  ultimaMensagem: string
  ultimaMensagemAt: string
  ultimaMensagemLabel: string
  unread: number
  fonte: 'network' | 'dom'
  ultimaMensagemId?: string
}

export type ShopeeChatMapSnapshot = {
  urlAtual: string
  mapeando: boolean
  endpoints: ShopeeChatEndpoint[]
  conversasRecentes: ShopeeMappedConversation[]
  conversasIgnoradas: number
  janelaHoje: string
  janelaOntem: string
  atualizadoEm: string
}

export type AgentesApi = {
  list: () => Promise<AgenteRecord[]>
  getById: (id: string) => Promise<AgenteRecord | null>
  create: (input: CreateAgenteInput) => Promise<AgenteRecord>
  update: (id: string, input: UpdateAgenteInput) => Promise<AgenteRecord>
  delete: (id: string) => Promise<boolean>
  listConhecimentos: (agenteId: string) => Promise<AgenteConhecimentoRecord[]>
  createConhecimento: (input: CreateAgenteConhecimentoInput) => Promise<AgenteConhecimentoRecord>
  updateConhecimento: (id: string, input: UpdateAgenteConhecimentoInput) => Promise<AgenteConhecimentoRecord>
  deleteConhecimento: (id: string) => Promise<boolean>
  listConversas: (agenteId: string, status?: AgenteConversaStatus) => Promise<AgenteConversaRecord[]>
  getConversa: (conversaId: string) => Promise<AgenteConversaRecord | null>
  listMensagens: (conversaId: string) => Promise<AgenteMensagemRecord[]>
  enviarMensagem: (conversaId: string, texto: string) => Promise<AgenteMensagemRecord>
  aprovarSugestao: (mensagemId: string, textoEditado?: string) => Promise<AgenteMensagemRecord>
  rejeitarSugestao: (mensagemId: string) => Promise<boolean>
  gerarRespostaIa: (agenteId: string, pergunta: string, conversaId?: string) => Promise<AgenteGerarRespostaResult>
  shopee: {
    abrirLogin: () => Promise<void>
    verificarStatus: () => Promise<ShopeeSessionStatus>
    limparSessao: () => Promise<boolean>
    simularMensagem: (
      agenteId: string,
      clienteNome: string,
      textoPergunta: string
    ) => Promise<{ conversaId: string; msgClienteId: string; msgSugestaoId: string; respostaIa: string; confianca: number }>
    iniciarMapeamento: () => Promise<ShopeeChatMapSnapshot>
    obterMapa: () => Promise<ShopeeChatMapSnapshot>
    atualizarMapa: () => Promise<ShopeeChatMapSnapshot>
  }
}

export type RazaiApi = {
  getAppInfo: () => Promise<AppInfo>
  getDbHealth: () => Promise<DbHealth>
  tecidos: TecidosApi
  cores: CoresApi
  vinculos: VinculosApi
  vendas: VendasApi
  pedidos: PedidosApi
  settings: SettingsApi
  printer: PrinterApi
  backup: BackupApi
  diagnostics: DiagnosticsApi
  updater: UpdaterApi
  relatorios: RelatoriosApi
  agentes: AgentesApi
}

declare global {
  interface Window {
    razai: RazaiApi
  }
}
