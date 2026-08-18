import type Database from 'better-sqlite3'

/**
 * Schema inicial. Migrations versionadas entram em ./migrations/
 * quando houver mudanças evolutivas — não inventar abstrações antes disso.
 */
export function applySchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_meta (
      key   TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    INSERT OR IGNORE INTO app_meta (key, value) VALUES ('schema_version', '1');
  `)
}
