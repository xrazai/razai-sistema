import type { Migration } from './types'

export const m012_drop_retired_tables: Migration = {
  version: 12,
  name: 'drop_retired_tables',
  up: (db) => {
    db.exec(`
      DROP TABLE IF EXISTS agente_mensagens;
      DROP TABLE IF EXISTS agente_conversas;
      DROP TABLE IF EXISTS agente_conhecimentos;
      DROP TABLE IF EXISTS agentes;
    `)
  }
}
