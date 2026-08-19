import { dialog, BrowserWindow } from 'electron'
import { writeFileSync } from 'node:fs'
import { getDb } from '../database/db'
import type { BackupResult } from '../../shared/types'

export function convertToCsv(
  columns: { key: string; label: string }[],
  rows: Record<string, any>[]
): string {
  const escapeCell = (val: any): string => {
    if (val === null || val === undefined) return ''
    const str = String(val)
    if (
      str.includes(';') ||
      str.includes(',') ||
      str.includes('"') ||
      str.includes('\n') ||
      str.includes('\r')
    ) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const headerLine = columns.map((col) => escapeCell(col.label)).join(';')
  const dataLines = rows.map((row) =>
    columns.map((col) => escapeCell(row[col.key])).join(';')
  )

  // \uFEFF é o BOM UTF-8 para garantir abertura com caracteres acentuados no Excel
  return '\uFEFF' + [headerLine, ...dataLines].join('\r\n')
}

function getTodayString(): string {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export async function exportTecidosCsv(customPath?: string): Promise<BackupResult> {
  try {
    const db = getDb()
    const rows = db
      .prepare(
        `SELECT codigo, nome, composicao, largura, rendimento, gramatura_linear AS gramaturaLinear, gramatura_m2 AS gramaturaM2, tipo, acabamento, created_at AS createdAt FROM tecidos ORDER BY nome ASC`
      )
      .all() as Record<string, any>[]

    const columns = [
      { key: 'codigo', label: 'SKU' },
      { key: 'nome', label: 'Nome' },
      { key: 'composicao', label: 'Composição' },
      { key: 'largura', label: 'Largura (m)' },
      { key: 'rendimento', label: 'Rendimento (m/kg)' },
      { key: 'gramaturaLinear', label: 'Gramatura Linear (g/m)' },
      { key: 'gramaturaM2', label: 'Gramatura (g/m²)' },
      { key: 'tipo', label: 'Tipo' },
      { key: 'acabamento', label: 'Acabamento' },
      { key: 'createdAt', label: 'Cadastrado em' }
    ]

    const csvContent = convertToCsv(columns, rows)

    let destPath = customPath
    if (!destPath) {
      const win = BrowserWindow.getFocusedWindow()
      const result = await dialog.showSaveDialog(win || undefined, {
        title: 'Exportar Tecidos em CSV',
        defaultPath: `tecidos_backup_${getTodayString()}.csv`,
        filters: [{ name: 'Arquivo CSV (*.csv)', extensions: ['csv'] }]
      })

      if (result.canceled || !result.filePath) {
        return { ok: false, canceled: true }
      }
      destPath = result.filePath
    }

    writeFileSync(destPath, csvContent, 'utf-8')
    return { ok: true, filePath: destPath }
  } catch (err: any) {
    return { ok: false, error: err?.message ?? String(err) }
  }
}

export async function exportCoresCsv(customPath?: string): Promise<BackupResult> {
  try {
    const db = getDb()
    const rows = db
      .prepare(
        `SELECT codigo, nome, hex, lab, created_at AS createdAt FROM cores ORDER BY nome ASC`
      )
      .all() as Record<string, any>[]

    const columns = [
      { key: 'codigo', label: 'SKU' },
      { key: 'nome', label: 'Nome da Cor' },
      { key: 'hex', label: 'HEX' },
      { key: 'lab', label: 'LAB' },
      { key: 'createdAt', label: 'Cadastrado em' }
    ]

    const csvContent = convertToCsv(columns, rows)

    let destPath = customPath
    if (!destPath) {
      const win = BrowserWindow.getFocusedWindow()
      const result = await dialog.showSaveDialog(win || undefined, {
        title: 'Exportar Cores em CSV',
        defaultPath: `cores_backup_${getTodayString()}.csv`,
        filters: [{ name: 'Arquivo CSV (*.csv)', extensions: ['csv'] }]
      })

      if (result.canceled || !result.filePath) {
        return { ok: false, canceled: true }
      }
      destPath = result.filePath
    }

    writeFileSync(destPath, csvContent, 'utf-8')
    return { ok: true, filePath: destPath }
  } catch (err: any) {
    return { ok: false, error: err?.message ?? String(err) }
  }
}

export async function exportDatabase(customPath?: string): Promise<BackupResult> {
  try {
    let destPath = customPath
    if (!destPath) {
      const win = BrowserWindow.getFocusedWindow()
      const result = await dialog.showSaveDialog(win || undefined, {
        title: 'Fazer Backup do Banco SQLite',
        defaultPath: `razai_backup_${getTodayString()}.sqlite`,
        filters: [{ name: 'Banco de Dados SQLite (*.sqlite, *.db)', extensions: ['sqlite', 'db'] }]
      })

      if (result.canceled || !result.filePath) {
        return { ok: false, canceled: true }
      }
      destPath = result.filePath
    }

    const db = getDb()
    db.pragma('wal_checkpoint(TRUNCATE)')
    await db.backup(destPath)

    return { ok: true, filePath: destPath }
  } catch (err: any) {
    return { ok: false, error: err?.message ?? String(err) }
  }
}
