import { app } from 'electron'
import { existsSync, statSync } from 'node:fs'
import { getDb, getDatabasePath } from '../database/db'
import { logger } from '../logger'
import type { SystemMetrics } from '../../shared/types'

export class DiagnosticsService {
  static async getLogs(limit = 100): Promise<string[]> {
    return logger.getRecentLogs(limit)
  }

  static async clearLogs(): Promise<boolean> {
    return logger.clearLogs()
  }

  static async getMetrics(): Promise<SystemMetrics> {
    const mem = process.memoryUsage()
    const uptimeSeconds = Math.floor(process.uptime())
    const dbPath = getDatabasePath()
    let dbSizeBytes = 0
    let dbOk = false

    try {
      if (existsSync(dbPath)) {
        dbSizeBytes = statSync(dbPath).size
      }
      const db = getDb()
      const row = db.prepare(`SELECT 1 as alive`).get() as { alive: number } | undefined
      dbOk = row?.alive === 1
    } catch {
      dbOk = false
    }

    return {
      electronVersion: process.versions.electron || 'unknown',
      nodeVersion: process.versions.node || 'unknown',
      chromeVersion: process.versions.chrome || 'unknown',
      platform: process.platform,
      arch: process.arch,
      memoryRssMb: Math.round((mem.rss / (1024 * 1024)) * 100) / 100,
      memoryHeapUsedMb: Math.round((mem.heapUsed / (1024 * 1024)) * 100) / 100,
      memoryHeapTotalMb: Math.round((mem.heapTotal / (1024 * 1024)) * 100) / 100,
      uptimeSeconds,
      dbPath,
      dbSizeBytes,
      dbOk
    }
  }
}
