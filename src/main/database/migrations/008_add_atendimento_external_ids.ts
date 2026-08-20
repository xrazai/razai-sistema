import type { Migration } from './types'

export const m008_add_atendimento_external_ids: Migration = {
  version: 8,
  name: 'add_atendimento_external_ids',
  up: (db) => {
    db.exec(`
      ALTER TABLE agente_conversas ADD COLUMN external_id TEXT;
      ALTER TABLE agente_conversas ADD COLUMN ultimo_erro TEXT;
      ALTER TABLE agente_mensagens ADD COLUMN external_id TEXT;
      ALTER TABLE agente_mensagens ADD COLUMN fontes_json TEXT;

      CREATE UNIQUE INDEX IF NOT EXISTS idx_agente_conversas_external
        ON agente_conversas (agente_id, canal, external_id)
        WHERE external_id IS NOT NULL;

      CREATE UNIQUE INDEX IF NOT EXISTS idx_agente_mensagens_external
        ON agente_mensagens (external_id)
        WHERE external_id IS NOT NULL;
    `)
  }
}
