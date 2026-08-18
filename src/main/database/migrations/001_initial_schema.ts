import type { Migration } from './types'

export const m001_initial_schema: Migration = {
  version: 1,
  name: 'initial_schema',
  up: (db) => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS app_meta (
        key   TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `)
  }
}
