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
}

declare global {
  interface Window {
    razai: RazaiApi
  }
}
