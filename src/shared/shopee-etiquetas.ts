export type ShopeeEtiquetaLoteStatus =
  | 'recebido'
  | 'extraindo'
  | 'revisao'
  | 'pronto'
  | 'imprimindo'
  | 'impressao_pendente'
  | 'impressao_incerta'
  | 'gerando_pdf'
  | 'pdf_pendente'
  | 'concluido'
  | 'falhou'

export type ShopeeEtiquetaPageType = 'envio' | 'checklist' | 'desconhecida'

export type ShopeeEtiquetaValidationSource =
  | 'ocr'
  | 'exact_memory'
  | 'equivalence'
  | 'safe_rule'
  | 'manual'
  | 'legacy'

export type ShopeeEtiquetaProgress = {
  loteId: string
  status: ShopeeEtiquetaLoteStatus
  progress: number
  message: string
}

export type ShopeeEtiquetaItem = {
  id: string
  paginaId: string
  rowOrder: number
  orderId: string | null
  productRaw: string
  variationRaw: string
  fabricRaw: string
  colorRaw: string
  quantity: number
  sku: string
  fabricName: string
  colorName: string
  cutMm: number | null
  widthMm: number | null
  confidence: number
  validationSource: ShopeeEtiquetaValidationSource
  reviewReason: string | null
  reviewRequired: boolean
  sourcePreviewAvailable: boolean
  sourcePreviewUnavailableReason: 'reimport_required' | 'text_source' | 'file_expired' | null
}

export type ShopeeEtiquetaSourceBounds = {
  x: number
  y: number
  width: number
  height: number
}

export type ShopeeEtiquetaSourcePreview = {
  mimeType: 'image/png'
  imageBase64: string
  width: number
  height: number
  highlight: ShopeeEtiquetaSourceBounds
  entryName: string
  pageNumber: number
}

export type ShopeeEtiquetaDocumento = {
  id: string
  arquivoId: string
  entryName: string
  documentHash: string
  byteSize: number
  documentOrder: number
  printStatus: string
  printError: string | null
  printedAt: string | null
}

export type ShopeeEtiquetaLoteResumo = {
  id: string
  status: ShopeeEtiquetaLoteStatus
  progress: number
  errorMessage: string | null
  pdfAvailable: boolean
  fileCount: number
  pageCount: number
  orderCount: number
  itemCount: number
  reviewCount: number
  createdAt: string
  updatedAt: string
  expiresAt: string
  filesExpiredAt: string | null
}

export type ShopeeEtiquetaLoteDetalhe = ShopeeEtiquetaLoteResumo & {
  documents: ShopeeEtiquetaDocumento[]
  items: ShopeeEtiquetaItem[]
}

export type ShopeeEtiquetaCorrecaoInput = {
  itemId: string
  orderId: string
  productRaw: string
  variationRaw: string
  fabricName: string
  colorName: string
  cutMm: number
  widthMm: number | null
  quantity: number
  sku: string
  rememberFabric?: boolean
  rememberColor?: boolean
  rememberSku?: boolean
  rememberExact?: boolean
}

export type ShopeeEtiquetaEquivalencia = {
  id: string
  kind: 'tecido' | 'cor' | 'sku'
  sourceKey: string
  sku: string
  canonicalValue: string
  createdAt: string
  updatedAt: string
}

export type ShopeeEtiquetaEquivalenciaInput = {
  kind: 'tecido' | 'cor' | 'sku'
  source: string
  sku?: string
  canonicalValue: string
}

export type ShopeeEtiquetaLearningStats = {
  exactCorrections: number
  trainingSamples: number
  skuEquivalences: number
}

export type ShopeeEtiquetaActionResult = {
  ok: boolean
  loteId?: string
  error?: string
}

export type ShopeeEtiquetasApi = {
  importFiles: (files: File[]) => Promise<ShopeeEtiquetaActionResult>
  listBatches: () => Promise<ShopeeEtiquetaLoteResumo[]>
  getBatch: (id: string) => Promise<ShopeeEtiquetaLoteDetalhe | null>
  getItemSourcePreview: (itemId: string) => Promise<ShopeeEtiquetaSourcePreview>
  deleteBatch: (id: string) => Promise<ShopeeEtiquetaActionResult>
  correctItem: (input: ShopeeEtiquetaCorrecaoInput) => Promise<ShopeeEtiquetaLoteDetalhe | null>
  resumeBatch: (id: string) => Promise<ShopeeEtiquetaActionResult>
  retryPrinting: (id: string) => Promise<ShopeeEtiquetaActionResult>
  confirmPrinted: (id: string) => Promise<ShopeeEtiquetaActionResult>
  regeneratePdf: (id: string) => Promise<ShopeeEtiquetaActionResult>
  openPdf: (id: string) => Promise<ShopeeEtiquetaActionResult>
  listEquivalences: () => Promise<ShopeeEtiquetaEquivalencia[]>
  saveEquivalence: (input: ShopeeEtiquetaEquivalenciaInput) => Promise<ShopeeEtiquetaEquivalencia>
  deleteEquivalence: (id: string) => Promise<boolean>
  getLearningStats: () => Promise<ShopeeEtiquetaLearningStats>
  listPrinters: () => Promise<Array<{ name: string; driverName?: string; portName?: string; isDefault?: boolean; status?: string }>>
  getZebraPrinter: () => Promise<string | null>
  setZebraPrinter: (name: string) => Promise<boolean>
  testZebra: (name?: string) => Promise<{ ok: boolean; error?: string }>
  onProgress: (callback: (progress: ShopeeEtiquetaProgress) => void) => () => void
}
