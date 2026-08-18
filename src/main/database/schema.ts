import type Database from 'better-sqlite3'
import { runMigrations } from './migrator'

/**
 * Aplica as migrations versionadas no banco SQLite.
 */
export function applySchema(db: Database.Database): void {
  runMigrations(db)
}
