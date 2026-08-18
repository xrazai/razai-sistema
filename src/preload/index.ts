import { contextBridge, ipcRenderer } from 'electron'
import type { AppInfo, DbHealth, RazaiApi } from '../shared/types'

const api: RazaiApi = {
  getAppInfo: (): Promise<AppInfo> => ipcRenderer.invoke('app:getInfo'),
  getDbHealth: (): Promise<DbHealth> => ipcRenderer.invoke('db:health')
}

contextBridge.exposeInMainWorld('razai', api)
