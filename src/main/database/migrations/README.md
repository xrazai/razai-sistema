# Migrations SQLite

Este diretório contém as migrations versionadas e estruturadas do banco de dados SQLite do **Razai Sistema**.

---

## 1. Arquitetura do Migrator (`migrator.ts`)

O runner de migrations (`src/main/database/migrator.ts`) opera com as seguintes garantias:
- **Idempotência**: Cada migration só é executada uma única vez, rastreada pela tabela `schema_migrations`.
- **Atomicidade Transacional**: Cada migration é executada dentro de uma transação SQLite exclusiva (`db.transaction`). Se uma etapa falhar, o estado anterior é preservado integralmente.
- **Versão Máxima em `app_meta`**: A cada migration aplicada com sucesso, a tabela `app_meta` tem a chave `schema_version` atualizada automaticamente.

---

## 2. Histórico de Migrations

| Versão | Arquivo | Nome da Migration | Conteúdo / Tabelas |
|---|---|---|---|
| `1` | `001_initial_schema.ts` | `initial_schema` | Tabelas de infraestrutura `app_meta` e dados base. |
| `2` | `002_create_tecidos.ts` | `create_tecidos` | Tabela `tecidos` (SKU, nome, composição, métricas e acabamento). |
| `3` | `003_create_cores.ts` | `create_cores` | Tabela `cores` (nome, hex, lab, timestamps). |

---

## 3. Como Adicionar uma Nova Migration

1. Crie o arquivo versionado seguindo o padrão numérico incremental (ex.: `004_create_vinculos.ts`):
   ```typescript
   import type { Migration } from './types'

   export const m004_create_vinculos: Migration = {
     version: 4,
     name: 'create_vinculos',
     up(db) {
       db.exec(`
         CREATE TABLE IF NOT EXISTS vinculos (
           id         TEXT PRIMARY KEY NOT NULL,
           tecido_id  TEXT NOT NULL,
           cor_id     TEXT NOT NULL,
           created_at TEXT NOT NULL,
           FOREIGN KEY (tecido_id) REFERENCES tecidos(id) ON DELETE CASCADE,
           FOREIGN KEY (cor_id) REFERENCES cores(id) ON DELETE CASCADE
         );
       `)
     }
   }
   ```

2. Exporte a nova migration no array `migrations` em `src/main/database/migrations/index.ts`.
3. Ao inicializar o aplicativo (`openDatabase()`), o runner detectará a nova versão e a aplicará automaticamente.
