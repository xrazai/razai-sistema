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

export function openDatabase(customPath?: string): Database.Database {
  if (db) return db

  let path = customPath
  if (!path) {
    const dir = join(app.getPath('userData'), 'data')
    mkdirSync(dir, { recursive: true })
    path = join(dir, 'razai.sqlite')
  }

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
