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
}

export type RazaiApi = {
  getAppInfo: () => Promise<AppInfo>
  getDbHealth: () => Promise<DbHealth>
  tecidos: TecidosApi
  cores: CoresApi
  vinculos: VinculosApi
  settings: SettingsApi
  printer: PrinterApi
}

declare global {
  interface Window {
    razai: RazaiApi
  }
}
