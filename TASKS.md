# TASKS — razai-sistema

Backlog ordenado por **sugestão de implementação** (menor número = fazer antes).
Origin não tem Issues/Kanban neste beta — este arquivo é a fonte de tarefas.

Só entram aqui **pendentes**. Task feita sai da ordem; o registro fica no `CHANGELOG.md`.

## Ordem sugerida (pendentes)

| # | Task | Por quê nesta ordem |
| --- | --- | --- |
| 1 | Definir o domínio do produto (estoque, pedidos, produção, clientes…?) | Evita modelar schema/IPC no escuro |
| 2 | Modelar a primeira entidade no SQLite (`schema` + IPC + tela mínima na Feature) | Primeiro valor de produto sobre a fundação |
| 3 | Runner mínimo de migrations (`src/main/database/migrations/`) | Precisa existir assim que o schema começar a evoluir |
| 4 | Roteamento simples no renderer (sem lib — hash/state no shell) | Necessário antes de crescer features/páginas |
| 5 | Persistência de preferências de UI em `app_meta` / `settings` | Settings já existem na UI; fechar o ciclo |
| 6 | Fontes técnicas locais (IBM Plex Mono/Sans) — sem CDN | Visual do DS completo, sem dependência de rede |
| 7 | Menu nativo Electron + DevTools só em dev | App desktop “de verdade” |
| 8 | Falha de IPC/DB na UI com `Status` + `EmptyState` | Robustez antes de empacotar |
| 9 | Empacotar app (Windows) + smoke test | Distribuição mínima |
| 10 | Segunda feature de produto (CRUD: lista + inspector + formulário) | Expande o domínio com padrão estabelecido |
| 11 | Busca/filtro em tabelas densas (DS se for genérico) | Escala a lista da feature |
| 12 | Export CSV / backup do SQLite | Operação real do usuário |
| 13 | Logs no main + painel Diagnóstico em Settings | Operação/suporte |
| 14 | Proteções de branch / fluxo de PR no Origin | Processo de equipe |
| 15 | Habilitar stacked PRs (`gh stack`) no repo e no fluxo de tasks | Destrava PRs dependentes sem esperar merge; antes do CI para os checks nascerem por camada |
| 16 | CI ciente de stacked PRs (GitHub Actions) | Só com fluxo de PR estável |
| 17 | Autoupdate do instalador | Depois do packaging maduro |

## Checklist (mesma ordem)

- [ ] **1.** Definir o domínio do produto
- [ ] **2.** Primeira entidade (schema + IPC + tela mínima)
- [ ] **3.** Runner mínimo de migrations
- [ ] **4.** Roteamento simples no renderer
- [ ] **5.** Persistir preferências de UI
- [ ] **6.** Fontes IBM Plex locais
- [ ] **7.** Menu nativo Electron + DevTools em dev
- [ ] **8.** Tratamento de falha IPC/DB na UI
- [ ] **9.** Empacotar app (Windows) + smoke test
- [ ] **10.** Segunda feature (CRUD completo)
- [ ] **11.** Busca/filtro em tabelas
- [ ] **12.** Export CSV / backup SQLite
- [ ] **13.** Logs + Diagnóstico em Settings
- [ ] **14.** Proteções de branch / PR no Origin
- [ ] **15.** Stacked PRs (`gh stack`) no repo e no fluxo
- [ ] **16.** CI ciente de stacked PRs
- [ ] **17.** Autoupdate do instalador

## Ao terminar / cadastrar task

Regras completas em [`AGENTS.md`](./AGENTS.md) (seção **Tasks e changelog**).

Resumo: task feita → **remover** da ordem aqui → renumerar 1…N → uma linha curta no topo de [`CHANGELOG.md`](./CHANGELOG.md). UI genérica → DS + `DesignSystemPage`.
