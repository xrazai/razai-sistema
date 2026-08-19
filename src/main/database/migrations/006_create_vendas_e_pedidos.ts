import type { Migration } from './types'

export const m006_create_vendas_e_pedidos: Migration = {
  version: 6,
  name: 'create_vendas_e_pedidos',
  up: (db) => {
    db.exec(`
      -- TABELA DE VENDAS
      CREATE TABLE IF NOT EXISTS vendas (
        id                TEXT PRIMARY KEY NOT NULL,
        numero            INTEGER UNIQUE NOT NULL,
        pedido_origem_id  TEXT,
        cliente_nome      TEXT,
        valor_total       REAL NOT NULL,
        quantidade_total  REAL NOT NULL,
        itens_count       INTEGER NOT NULL,
        forma_pagamento   TEXT,
        observacoes       TEXT,
        created_at        TEXT NOT NULL,
        updated_at        TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_vendas_numero ON vendas(numero);
      CREATE INDEX IF NOT EXISTS idx_vendas_created_at ON vendas(created_at);

      -- TABELA DE ITENS DA VENDA
      CREATE TABLE IF NOT EXISTS venda_itens (
        id             TEXT PRIMARY KEY NOT NULL,
        venda_id       TEXT NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
        tecido_id      TEXT NOT NULL,
        cor_id         TEXT NOT NULL,
        vinculo_id     TEXT,
        sku            TEXT NOT NULL,
        tecido_nome    TEXT NOT NULL,
        tecido_codigo  TEXT NOT NULL,
        cor_nome       TEXT NOT NULL,
        cor_codigo     TEXT NOT NULL,
        cor_hex        TEXT,
        preco_unitario REAL NOT NULL,
        quantidade     REAL NOT NULL,
        subtotal       REAL NOT NULL,
        created_at     TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_venda_itens_venda_id ON venda_itens(venda_id);
      CREATE INDEX IF NOT EXISTS idx_venda_itens_sku ON venda_itens(sku);

      -- TABELA DE PEDIDOS
      CREATE TABLE IF NOT EXISTS pedidos (
        id                TEXT PRIMARY KEY NOT NULL,
        numero            INTEGER UNIQUE NOT NULL,
        cliente_nome      TEXT,
        status            TEXT NOT NULL DEFAULT 'pendente',
        valor_total       REAL NOT NULL,
        quantidade_total  REAL NOT NULL,
        itens_count       INTEGER NOT NULL,
        observacoes       TEXT,
        venda_gerada_id   TEXT REFERENCES vendas(id) ON DELETE SET NULL,
        created_at        TEXT NOT NULL,
        updated_at        TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_pedidos_numero ON pedidos(numero);
      CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
      CREATE INDEX IF NOT EXISTS idx_pedidos_created_at ON pedidos(created_at);

      -- TABELA DE ITENS DO PEDIDO
      CREATE TABLE IF NOT EXISTS pedido_itens (
        id             TEXT PRIMARY KEY NOT NULL,
        pedido_id      TEXT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
        tecido_id      TEXT NOT NULL,
        cor_id         TEXT NOT NULL,
        vinculo_id     TEXT,
        sku            TEXT NOT NULL,
        tecido_nome    TEXT NOT NULL,
        tecido_codigo  TEXT NOT NULL,
        cor_nome       TEXT NOT NULL,
        cor_codigo     TEXT NOT NULL,
        cor_hex        TEXT,
        preco_unitario REAL NOT NULL,
        quantidade     REAL NOT NULL,
        subtotal       REAL NOT NULL,
        created_at     TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_pedido_itens_pedido_id ON pedido_itens(pedido_id);
      CREATE INDEX IF NOT EXISTS idx_pedido_itens_sku ON pedido_itens(sku);
    `)
  }
}
