import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'node:path'
import { mkdirSync } from 'node:fs'
import { runMigrations } from './migrator'
import { normalizeUnaccent } from '../../shared/sku'

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not open. Call openDatabase() first.')
  }
  return db
}

export function getDatabasePath(customPath?: string): string {
  if (customPath) return customPath
  if (process.env.RAZAI_DB_PATH) return process.env.RAZAI_DB_PATH

  const dir = join(app.getPath('appData'), 'razai-sistema', 'data')
  mkdirSync(dir, { recursive: true })
  return join(dir, 'razai.sqlite')
}

export function openDatabase(customPath?: string): Database.Database {
  if (db) return db

  const path = getDatabasePath(customPath)

  db = new Database(path)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.function('unaccent', { deterministic: true }, (str: unknown) =>
    normalizeUnaccent(typeof str === 'string' ? str : (str === null || str === undefined ? '' : String(str)))
  )
  runMigrations(db)

  return db
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}
