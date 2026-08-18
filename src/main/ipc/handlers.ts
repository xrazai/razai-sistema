import { ipcMain } from 'electron'
import { getDb } from '../database/db'
import type { AppInfo, DbHealth } from '../../shared/types'

export function registerIpcHandlers(): void {
  ipcMain.handle('app:getInfo', (): AppInfo => ({
    name: 'razai-sistema',
    version: '0.1.0'
  }))

  ipcMain.handle('db:health', (): DbHealth => {
    const row = getDb()
      .prepare(`SELECT value FROM app_meta WHERE key = 'schema_version'`)
      .get() as { value: string } | undefined

    return {
      ok: true,
      schemaVersion: row?.value ?? 'unknown'
    }
  })
}
