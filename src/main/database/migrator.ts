import type Database from 'better-sqlite3'
import { migrations } from './migrations'

/**
 * Runner de migrations SQLite transacional e idempotente.
 * Executa as migrations pendentes em ordem crescente de versão.
 */
export function runMigrations(db: Database.Database): void {
  // Garante a tabela de controle de migrations
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    INTEGER PRIMARY KEY NOT NULL,
      name       TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `)

  const rows = db.prepare('SELECT version FROM schema_migrations').all() as { version: number }[]
  const appliedVersions = new Set(rows.map((r) => r.version))

  const pending = migrations
    .filter((m) => !appliedVersions.has(m.version))
    .sort((a, b) => a.version - b.version)

  for (const migration of pending) {
    const runTransaction = db.transaction(() => {
      migration.up(db)

      db.prepare(`
        INSERT INTO schema_migrations (version, name, applied_at)
        VALUES (?, ?, datetime('now'))
      `).run(migration.version, migration.name)

      // Mantém app_meta atualizado com a versão máxima
      db.prepare(`
        INSERT INTO app_meta (key, value)
        VALUES ('schema_version', ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `).run(String(migration.version))
    })

    runTransaction()
  }
}
