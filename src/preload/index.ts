import { contextBridge, ipcRenderer } from 'electron'
import type {
  AppInfo,
  DbHealth,
  RazaiApi,
  CreateTecidoInput,
  UpdateTecidoInput,
  CreateCorInput,
  UpdateCorInput
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
  }
}

contextBridge.exposeInMainWorld('razai', api)
