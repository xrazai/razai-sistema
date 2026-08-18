import { ipcMain } from 'electron'
import { getDb } from '../database/db'
import { TecidosService } from '../services/tecidos.service'
import type { AppInfo, DbHealth, CreateTecidoInput, UpdateTecidoInput } from '../../shared/types'

export function registerIpcHandlers(): void {
  ipcMain.handle('app:getInfo', (): AppInfo => ({
    name: 'razai-sistema',
    version: '0.1.0'
  }))

  ipcMain.handle('db:health', (): DbHealth => {
    try {
      const row = getDb()
        .prepare(`SELECT value FROM app_meta WHERE key = 'schema_version'`)
        .get() as { value: string } | undefined

      return {
        ok: true,
        schemaVersion: row?.value ?? 'unknown',
        timestamp: new Date().toISOString()
      }
    } catch (err: any) {
      return {
        ok: false,
        schemaVersion: 'none',
        error: err?.message || 'Falha ao conectar com o banco de dados SQLite',
        timestamp: new Date().toISOString()
      }
    }
  })

  // Handlers para o CRUD de Tecidos
  ipcMain.handle('tecidos:list', (_event, search?: string) => {
    return TecidosService.list(search)
  })

  ipcMain.handle('tecidos:getById', (_event, id: string) => {
    return TecidosService.getById(id)
  })

  ipcMain.handle('tecidos:create', (_event, input: CreateTecidoInput) => {
    return TecidosService.create(input)
  })

  ipcMain.handle('tecidos:update', (_event, id: string, input: UpdateTecidoInput) => {
    return TecidosService.update(id, input)
  })

  ipcMain.handle('tecidos:delete', (_event, id: string) => {
    return TecidosService.delete(id)
  })
}
