import { contextBridge, ipcRenderer } from 'electron'
import type {
  AppInfo,
  DbHealth,
  RazaiApi,
  UpdateInfo,
  CreateTecidoInput,
  UpdateTecidoInput,
  CreateCorInput,
  UpdateCorInput,
  CreateVinculosInput,
  CreateVendaInput,
  CreatePedidoInput,
  UpdatePedidoInput,
  RelatorioFiltroInput,
  PrevisibilidadeFiltroInput,
  CreateAgenteInput,
  UpdateAgenteInput,
  CreateAgenteConhecimentoInput,
  UpdateAgenteConhecimentoInput,
  AgenteConversaStatus
} from '../shared/types'

const api: RazaiApi = {
  getAppInfo: (): Promise<AppInfo> => ipcRenderer.invoke('app:getInfo'),
  getDbHealth: (): Promise<DbHealth> => ipcRenderer.invoke('db:health'),
  tecidos: {
    list: (search?: string) => ipcRenderer.invoke('tecidos:list', search),
    getById: (id: string) => ipcRenderer.invoke('tecidos:getById', id),
    create: (input: CreateTecidoInput) => ipcRenderer.invoke('tecidos:create', input),
    update: (id: string, input: UpdateTecidoInput) => ipcRenderer.invoke('tecidos:update', id, input),
    delete: (id: string) => ipcRenderer.invoke('tecidos:delete', id)
  },
  cores: {
    list: (search?: string) => ipcRenderer.invoke('cores:list', search),
    getById: (id: string) => ipcRenderer.invoke('cores:getById', id),
    create: (input: CreateCorInput) => ipcRenderer.invoke('cores:create', input),
    update: (id: string, input: UpdateCorInput) => ipcRenderer.invoke('cores:update', id, input),
    delete: (id: string) => ipcRenderer.invoke('cores:delete', id)
  },
  vinculos: {
    list: (search?: string) => ipcRenderer.invoke('vinculos:list', search),
    listByTecido: (tecidoId: string) => ipcRenderer.invoke('vinculos:listByTecido', tecidoId),
    createBatch: (input: CreateVinculosInput) => ipcRenderer.invoke('vinculos:createBatch', input),
    delete: (id: string) => ipcRenderer.invoke('vinculos:delete', id),
    deleteByTecidoAndCor: (tecidoId: string, corId: string) =>
      ipcRenderer.invoke('vinculos:deleteByTecidoAndCor', tecidoId, corId)
  },
  vendas: {
    list: (search?: string) => ipcRenderer.invoke('vendas:list', search),
    getById: (id: string) => ipcRenderer.invoke('vendas:getById', id),
    create: (input: CreateVendaInput) =>
      ipcRenderer.invoke('vendas:create', JSON.parse(JSON.stringify(input))),
    delete: (id: string) => ipcRenderer.invoke('vendas:delete', id),
    imprimirCupom: (vendaId: string, printerName?: string) =>
      ipcRenderer.invoke('vendas:imprimirCupom', vendaId, printerName)
  },
  pedidos: {
    list: (search?: string) => ipcRenderer.invoke('pedidos:list', search),
    getById: (id: string) => ipcRenderer.invoke('pedidos:getById', id),
    create: (input: CreatePedidoInput) =>
      ipcRenderer.invoke('pedidos:create', JSON.parse(JSON.stringify(input))),
    update: (id: string, input: UpdatePedidoInput) =>
      ipcRenderer.invoke('pedidos:update', id, JSON.parse(JSON.stringify(input))),
    delete: (id: string) => ipcRenderer.invoke('pedidos:delete', id),
    aprovar: (id: string) => ipcRenderer.invoke('pedidos:aprovar', id),
    gerarPdf: (id: string) => ipcRenderer.invoke('pedidos:gerarPdf', id),
    compartilhar: (id: string) => ipcRenderer.invoke('pedidos:compartilhar', id),
    abrirShareNativo: (filePath: string, title: string) =>
      ipcRenderer.invoke('pedidos:abrirShareNativo', filePath, title)
  },
  settings: {
    get: (key: string): Promise<string | null> => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: string): Promise<boolean> => ipcRenderer.invoke('settings:set', key, value),
    getAll: (): Promise<Record<string, string>> => ipcRenderer.invoke('settings:getAll')
  },
  printer: {
    list: () => ipcRenderer.invoke('printer:list'),
    printTest: (printerName?: string) => ipcRenderer.invoke('printer:printTest', printerName)
  },
  backup: {
    exportTecidosCsv: (filePath?: string) => ipcRenderer.invoke('backup:exportTecidosCsv', filePath),
    exportCoresCsv: (filePath?: string) => ipcRenderer.invoke('backup:exportCoresCsv', filePath),
    exportDatabase: (destinationPath?: string) => ipcRenderer.invoke('backup:exportDatabase', destinationPath)
  },
  diagnostics: {
    getLogs: (limit?: number) => ipcRenderer.invoke('diagnostics:getLogs', limit),
    clearLogs: () => ipcRenderer.invoke('diagnostics:clearLogs'),
    getMetrics: () => ipcRenderer.invoke('diagnostics:getMetrics')
  },
  updater: {
    check: () => ipcRenderer.invoke('updater:check'),
    install: () => ipcRenderer.invoke('updater:install'),
    getStatus: () => ipcRenderer.invoke('updater:getStatus'),
    onStatusChange: (callback: (info: UpdateInfo) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, info: UpdateInfo) => callback(info)
      ipcRenderer.on('updater:status-changed', listener)
      return () => {
        ipcRenderer.removeListener('updater:status-changed', listener)
      }
    }
  },
  relatorios: {
    getKpis: (filtro?: RelatorioFiltroInput) =>
      ipcRenderer.invoke('relatorios:getKpis', filtro ? JSON.parse(JSON.stringify(filtro)) : undefined),
    getVendasUltimos7Dias: () => ipcRenderer.invoke('relatorios:getVendasUltimos7Dias'),
    getVendasPorTecidoCor: (filtro?: RelatorioFiltroInput) =>
      ipcRenderer.invoke('relatorios:getVendasPorTecidoCor', filtro ? JSON.parse(JSON.stringify(filtro)) : undefined),
    getPrevisibilidadeEstoque: (filtro?: PrevisibilidadeFiltroInput) =>
      ipcRenderer.invoke('relatorios:getPrevisibilidadeEstoque', filtro ? JSON.parse(JSON.stringify(filtro)) : undefined)
  },
  agentes: {
    list: () => ipcRenderer.invoke('agentes:list'),
    getById: (id: string) => ipcRenderer.invoke('agentes:getById', id),
    create: (input: CreateAgenteInput) =>
      ipcRenderer.invoke('agentes:create', JSON.parse(JSON.stringify(input))),
    update: (id: string, input: UpdateAgenteInput) =>
      ipcRenderer.invoke('agentes:update', id, JSON.parse(JSON.stringify(input))),
    delete: (id: string) => ipcRenderer.invoke('agentes:delete', id),
    listConhecimentos: (agenteId: string) =>
      ipcRenderer.invoke('agentes:conhecimento:list', agenteId),
    createConhecimento: (input: CreateAgenteConhecimentoInput) =>
      ipcRenderer.invoke('agentes:conhecimento:create', JSON.parse(JSON.stringify(input))),
    updateConhecimento: (id: string, input: UpdateAgenteConhecimentoInput) =>
      ipcRenderer.invoke('agentes:conhecimento:update', id, JSON.parse(JSON.stringify(input))),
    deleteConhecimento: (id: string) =>
      ipcRenderer.invoke('agentes:conhecimento:delete', id),
    listConversas: (agenteId: string, status?: AgenteConversaStatus) =>
      ipcRenderer.invoke('agentes:conversas:list', agenteId, status),
    getConversa: (conversaId: string) =>
      ipcRenderer.invoke('agentes:conversas:get', conversaId),
    listMensagens: (conversaId: string) =>
      ipcRenderer.invoke('agentes:mensagens:list', conversaId),
    enviarMensagem: (conversaId: string, texto: string) =>
      ipcRenderer.invoke('agentes:mensagens:enviar', conversaId, texto),
    aprovarSugestao: (mensagemId: string, textoEditado?: string) =>
      ipcRenderer.invoke('agentes:mensagens:aprovar', mensagemId, textoEditado),
    rejeitarSugestao: (mensagemId: string) =>
      ipcRenderer.invoke('agentes:mensagens:rejeitar', mensagemId),
    gerarRespostaIa: (agenteId: string, pergunta: string, conversaId?: string) =>
      ipcRenderer.invoke('agentes:gerarRespostaIa', agenteId, pergunta, conversaId),
    shopee: {
      abrirLogin: () => ipcRenderer.invoke('agentes:shopee:abrirLogin'),
      verificarStatus: () => ipcRenderer.invoke('agentes:shopee:verificarStatus'),
      limparSessao: () => ipcRenderer.invoke('agentes:shopee:limparSessao'),
      simularMensagem: (agenteId: string, clienteNome: string, textoPergunta: string) =>
        ipcRenderer.invoke('agentes:shopee:simularMensagem', agenteId, clienteNome, textoPergunta)
    }
  }
}

contextBridge.exposeInMainWorld('razai', api)
