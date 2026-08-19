import type { Migration } from './types'

export const m007_create_agentes: Migration = {
  version: 7,
  name: 'create_agentes',
  up: (db) => {
    db.exec(`
      -- TABELA DE AGENTES
      CREATE TABLE IF NOT EXISTS agentes (
        id             TEXT PRIMARY KEY NOT NULL,
        nome           TEXT NOT NULL,
        descricao      TEXT,
        canal          TEXT NOT NULL DEFAULT 'shopee',
        tipo_conexao   TEXT NOT NULL DEFAULT 'web_session',
        modo_operacao  TEXT NOT NULL DEFAULT 'copiloto',
        prompt_sistema TEXT NOT NULL DEFAULT '',
        config_json    TEXT NOT NULL DEFAULT '{}',
        ativo          INTEGER NOT NULL DEFAULT 1,
        created_at     TEXT NOT NULL,
        updated_at     TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_agentes_canal ON agentes(canal);
      CREATE INDEX IF NOT EXISTS idx_agentes_ativo ON agentes(ativo);

      -- TABELA DE BASE DE CONHECIMENTO DO AGENTE
      CREATE TABLE IF NOT EXISTS agente_conhecimentos (
        id         TEXT PRIMARY KEY NOT NULL,
        agente_id  TEXT NOT NULL REFERENCES agentes(id) ON DELETE CASCADE,
        tipo       TEXT NOT NULL DEFAULT 'faq',
        titulo     TEXT NOT NULL,
        conteudo   TEXT NOT NULL,
        ativo      INTEGER NOT NULL DEFAULT 1,
        ordem      INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_agente_conhecimentos_agente ON agente_conhecimentos(agente_id);
      CREATE INDEX IF NOT EXISTS idx_agente_conhecimentos_tipo ON agente_conhecimentos(tipo);
      CREATE INDEX IF NOT EXISTS idx_agente_conhecimentos_ativo ON agente_conhecimentos(ativo);

      -- TABELA DE CONVERSAS DE AGENTES
      CREATE TABLE IF NOT EXISTS agente_conversas (
        id                    TEXT PRIMARY KEY NOT NULL,
        agente_id             TEXT NOT NULL REFERENCES agentes(id) ON DELETE CASCADE,
        cliente_id            TEXT,
        cliente_nome          TEXT NOT NULL,
        canal                 TEXT NOT NULL DEFAULT 'shopee',
        status                TEXT NOT NULL DEFAULT 'aguardando_aprovacao',
        ultima_mensagem_texto TEXT,
        ultima_mensagem_at    TEXT NOT NULL,
        created_at            TEXT NOT NULL,
        updated_at            TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_agente_conversas_agente ON agente_conversas(agente_id);
      CREATE INDEX IF NOT EXISTS idx_agente_conversas_status ON agente_conversas(status);
      CREATE INDEX IF NOT EXISTS idx_agente_conversas_ultima_msg ON agente_conversas(ultima_mensagem_at);

      -- TABELA DE MENSAGENS DE CONVERSAS
      CREATE TABLE IF NOT EXISTS agente_mensagens (
        id           TEXT PRIMARY KEY NOT NULL,
        conversa_id  TEXT NOT NULL REFERENCES agente_conversas(id) ON DELETE CASCADE,
        remetente    TEXT NOT NULL,
        texto        TEXT NOT NULL,
        status       TEXT NOT NULL DEFAULT 'enviado',
        confianca    REAL,
        created_at   TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_agente_mensagens_conversa ON agente_mensagens(conversa_id);
      CREATE INDEX IF NOT EXISTS idx_agente_mensagens_created_at ON agente_mensagens(created_at);
    `)
  }
}
