import { ipcMain } from 'electron'
import { getDb } from '../database/db'
import { TecidosService } from '../services/tecidos.service'
import { CoresService } from '../services/cores.service'
import { VinculosService } from '../services/vinculos.service'
import { SettingsService } from '../services/settings.service'
import { PrinterService } from '../services/printer/printer.service'
import type {
  AppInfo,
  DbHealth,
  CreateTecidoInput,
  UpdateTecidoInput,
  CreateCorInput,
  UpdateCorInput,
  CreateVinculosInput
} from '../../shared/types'

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

  // Handlers para o CRUD de Cores
  ipcMain.handle('cores:list', (_event, search?: string) => {
    return CoresService.list(search)
  })

  ipcMain.handle('cores:getById', (_event, id: string) => {
    return CoresService.getById(id)
  })

  ipcMain.handle('cores:create', (_event, input: CreateCorInput) => {
    return CoresService.create(input)
  })

  ipcMain.handle('cores:update', (_event, id: string, input: UpdateCorInput) => {
    return CoresService.update(id, input)
  })

  ipcMain.handle('cores:delete', (_event, id: string) => {
    return CoresService.delete(id)
  })

  // Handlers para Vínculos (Matriz Tecido-Cor)
  ipcMain.handle('vinculos:list', (_event, search?: string) => {
    return VinculosService.list(search)
  })

  ipcMain.handle('vinculos:listByTecido', (_event, tecidoId: string) => {
    return VinculosService.listByTecido(tecidoId)
  })

  ipcMain.handle('vinculos:createBatch', (_event, input: CreateVinculosInput) => {
    return VinculosService.createBatch(input)
  })

  ipcMain.handle('vinculos:delete', (_event, id: string) => {
    return VinculosService.delete(id)
  })

  ipcMain.handle('vinculos:deleteByTecidoAndCor', (_event, tecidoId: string, corId: string) => {
    return VinculosService.deleteByTecidoAndCor(tecidoId, corId)
  })

  // Handlers para Preferências e Configurações (app_meta)
  ipcMain.handle('settings:get', (_event, key: string) => {
    return SettingsService.get(key)
  })

  ipcMain.handle('settings:set', (_event, key: string, value: string) => {
    return SettingsService.set(key, value)
  })

  ipcMain.handle('settings:getAll', () => {
    return SettingsService.getAll()
  })

  ipcMain.handle('settings:delete', (_event, key: string) => {
    return SettingsService.delete(key)
  })

  // Handlers para Impressão Térmica ESC/POS
  ipcMain.handle('printer:list', async () => {
    return PrinterService.listPrinters()
  })

  ipcMain.handle('printer:printTest', async (_event, printerName?: string) => {
    return PrinterService.printTestReceipt(printerName)
  })
}
