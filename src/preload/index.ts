import { contextBridge, ipcRenderer } from 'electron'
import type {
  AppInfo,
  DbHealth,
  RazaiApi,
  CreateTecidoInput,
  UpdateTecidoInput,
  CreateCorInput,
  UpdateCorInput,
  CreateVinculosInput
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
  settings: {
    get: (key: string): Promise<string | null> => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: string): Promise<boolean> => ipcRenderer.invoke('settings:set', key, value),
    getAll: (): Promise<Record<string, string>> => ipcRenderer.invoke('settings:getAll')
  }
}

contextBridge.exposeInMainWorld('razai', api)
