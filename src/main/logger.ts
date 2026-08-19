import { app } from 'electron'
import { join } from 'node:path'
import { existsSync, mkdirSync, appendFileSync, statSync, renameSync, readFileSync, writeFileSync } from 'node:fs'

const MAX_LOG_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

function getLogDir(): string {
  try {
    const base = app?.getPath ? app.getPath('appData') : process.env.APPDATA || '.'
    const dir = join(base, 'razai-sistema', 'logs')
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
    return dir
  } catch {
    return '.'
  }
}

export function getLogFilePath(): string {
  return join(getLogDir(), 'app.log')
}

function rotateIfNeeded(filePath: string): void {
  try {
    if (existsSync(filePath)) {
      const stats = statSync(filePath)
      if (stats.size >= MAX_LOG_SIZE_BYTES) {
        const rotatedPath = `${filePath}.1`
        if (existsSync(rotatedPath)) {
          // Substitui o backup anterior
          writeFileSync(rotatedPath, '')
        }
        renameSync(filePath, rotatedPath)
      }
    }
  } catch {
    // Silencia erros de rotação
  }
}

export function formatLogEntry(level: string, message: string, meta?: any): string {
  const timestamp = new Date().toISOString()
  let metaStr = ''
  if (meta !== undefined && meta !== null) {
    if (meta instanceof Error) {
      metaStr = ` | Error: ${meta.message}\n${meta.stack || ''}`
    } else if (typeof meta === 'object') {
      try {
        metaStr = ` | ${JSON.stringify(meta)}`
      } catch {
        metaStr = ` | [Unserializable Object]`
      }
    } else {
      metaStr = ` | ${String(meta)}`
    }
  }
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}\n`
}

function writeLog(level: string, message: string, meta?: any): void {
  const entry = formatLogEntry(level, message, meta)
  
  if (!app?.isPackaged || process.env.NODE_ENV !== 'production') {
    if (level === 'ERROR') {
      console.error(entry.trim())
    } else if (level === 'WARN') {
      console.warn(entry.trim())
    } else {
      console.log(entry.trim())
    }
  }

  try {
    const logFile = getLogFilePath()
    rotateIfNeeded(logFile)
    appendFileSync(logFile, entry, 'utf-8')
  } catch {
    // Evita crash se filesystem estiver bloqueado
  }
}

export const logger = {
  info: (message: string, meta?: any) => writeLog('INFO', message, meta),
  warn: (message: string, meta?: any) => writeLog('WARN', message, meta),
  error: (message: string, meta?: any) => writeLog('ERROR', message, meta),
  getRecentLogs: (limit = 100): string[] => {
    try {
      const logFile = getLogFilePath()
      if (!existsSync(logFile)) return []
      const content = readFileSync(logFile, 'utf-8')
      const lines = content.split('\n').filter((line) => line.trim().length > 0)
      return lines.slice(-limit)
    } catch {
      return []
    }
  },
  clearLogs: (): boolean => {
    try {
      const logFile = getLogFilePath()
      if (existsSync(logFile)) {
        writeFileSync(logFile, '', 'utf-8')
      }
      return true
    } catch {
      return false
    }
  }
}
