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

export type RazaiApi = {
  getAppInfo: () => Promise<AppInfo>
  getDbHealth: () => Promise<DbHealth>
  tecidos: TecidosApi
}

declare global {
  interface Window {
    razai: RazaiApi
  }
}
