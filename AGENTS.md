# AGENTS.md — razai-sistema

Orientações obrigatórias para qualquer agente (humano ou IA) que trabalhar neste repositório.

---

## ⛔ REGRA DE OURO — Push e Pull Requests

> **PROIBIÇÃO ABSOLUTA DE PUSH E PR NÃO SOLICITADOS**:
>
> 1. Agentes estão **estritamente proibidos** de executar `git push`, `gh pr create` ou `gh stack submit` por iniciativa própria.
> 2. **NUNCA** abra Pull Request ou faça push para o repositório remoto sem que o usuário peça **explicitamente** na mensagem atual (ex: *"abra o PR"*, *"faça push"*, *"submeta a stack"*).
> 3. Todo trabalho (código, novas features, correções, testes e documentação) deve ser desenvolvido, testado e mantido **apenas no ambiente local**.
> 4. Não presuma que documentação, arquivos novos ou tarefas concluídas devem ser submetidos automaticamente. Finalize a implementação localmente, valide com `npm run typecheck` e `npm run build`, e **aguarde a instrução do usuário**.

---

## Stack

- **Electron** (processo main + preload + renderer)
- **Svelte 5** + **TypeScript**
- **SQLite** via `better-sqlite3` no main
- **CSS puro** (tokens e componentes do Design System) — sem Tailwind, sem CSS-in-JS, sem Storybook

## Estrutura

```
src/main/          → Electron main, DB, IPC
src/preload/       → bridge seguro (contextIsolation)
src/shared/        → tipos compartilhados main ↔ renderer
src/renderer/
  design-system/   → UI genérica e reutilizável
  features/        → UI e lógica de produto
  shell/           → casca da aplicação
  pages/           → páginas transversais (ex.: DesignSystemPage)
```

Arquivos de processo na raiz:

| Arquivo / recurso | Papel |
| --- | --- |
| [Board Razai Sistema — Kanban](https://github.com/users/xrazai/projects/6/views/1) | Backlog vivo — única fonte de tarefas pendentes (issues do repo) |
| `CHANGELOG.md` | Histórico do que já foi entregue |
| `docs/design-system.md` | Regras escritas do Design System |
| `AGENTS.md` | Este arquivo — regras para agentes |

Toda tarefa é cadastrada, movida e iterada **no board** (GitHub Projects). Não criar backlog paralelo (markdown local, Notion, etc.).

---

## Tasks e Changelog (obrigatório)

### Papéis

- **Board (GitHub Projects)**: o que falta fazer — issues com `Priority` (P0/P1/P2) e `Status` (Backlog → Ready → In progress → In review → Done).
- **`CHANGELOG.md`**: o que já foi feito, **mais recente no topo**.

Uma task só está **fechada** quando:
1. O PR foi **mergeado** e a issue movida para **Done** no board.
2. Há entrada correspondente no topo do `CHANGELOG.md` (`## YYYY-MM-DD — resumo curto`), incluída no próprio PR da task.

### Prioridade e Ordem

- Score de prioridade: `score = 3× desbloqueio + 2× risco + valor` → P0 (≥12), P1 (7–11), P2 (≤6).
- Ordem de execução: P0 → P1 → P2. Em empate, a menor issue aberta (salvo indicação contrária).
- Dependências reais entre tasks abertas → **Stacked PRs**.

### Ciclo da Task

1. **Cadastrar**: criar issue com título `Task <N> — <resumo>` e body com prioridade/score, justificativa e fluxo de branch. Adicionar ao board via CLI (`gh project item-add 6 --owner xrazai --url <url>`) com Priority e Status.
2. **Iniciar**: atualizar `main`, criar branch `task/<N>-<slug>` a partir de `main` (ou da branch anterior se stack) e mover issue para `In progress`.
3. **Desenvolver e validar**: implementar o escopo focado da task, atualizar `CHANGELOG.md` na própria branch/stack e validar localmente (`npm run typecheck` e `npm run build`).
4. **Submeter**: abrir PR via GitHub CLI (`gh pr create` ou `gh stack submit --auto --open`) **somente quando o usuário pedir explicitamente**, mover para `In review`.
5. **Concluir**: após o merge, fechar issue (ou mover para `Done`), apagar branch local/remota e atualizar `main`.
6. Se gerou UI genérica nova: atualizar `DesignSystemPage.svelte` antes de considerar completa.

### Execução Sequencial em Lote

Quando o usuário solicitar a execução de tasks em fila ou em ordem:
- Executar todas as tasks da sequência de forma autônoma e contínua.
- Criar as branches encadeadas (`task/<N>-<slug>`), fazer um commit atômico por task com mensagem padronizada e avançar imediatamente para a próxima sem pausar entre cada uma.
- Ao finalizar todo o lote, realizar a validação completa e aguardar a confirmação do usuário antes de submeter PRs.

**O que agentes NUNCA devem fazer**:
- **Abrir PR ou fazer push para o repositório remoto sem pedido explícito do usuário.**
- Abrir PR isolado exclusivo para documentação ou atualização do `CHANGELOG.md` (o changelog deve ser incluído no próprio PR/stack da task quando o PR for solicitado).
- Fechar task no chat sem atualizar board e `CHANGELOG.md`.
- Criar backlog paralelo (markdown local, Notion, etc.).
- Escrever changelog verboso (apenas o resumo curto de uma linha).
- Implementar direto em `main` ou reutilizar branch de outra task.

---

## Workflow de Desenvolvimento e Pull Requests

Otimizado para desenvolvimento local rápido, mudanças pequenas e fáceis de revisar, e uma `main` limpa.

### Fluxo Central

```text
Issue → Branch → Desenvolvimento → Validação Local → PR → CI do GitHub → Squash Merge → main
```

### 1. Iniciar de uma Issue

Todo trabalho deve estar associado a uma issue. Use a issue para entender objetivo, comportamento esperado e critérios de aceitação. Mantenha o escopo focado.

### 2. Nomenclatura de Branches

```
task/<N>-<slug-kebab>
```

- Prefixos permitidos: `task/`, `fix/` (hotfix), `chore/` (manutenção).
- Exemplo: `task/1-definir-dominio-produto`, `task/3-runner-migrations`.

### 3. Decisão: PR Normal vs. Stacked PR

- **PR Normal (padrão)**: para mudanças pequenas, autocontidas e fáceis de revisar como unidade.
- **Stacked PR**: apenas quando uma entrega grande pode ser dividida em camadas dependentes e significativas:

```text
Exemplo de Stack arquitetural:
PR 1 (base): Schema / Migration SQLite (src/main/database)
  ↑
PR 2:        Serviço de Negócio & Handlers IPC (src/main/services + src/shared)
  ↑
PR 3:        Preload Bridge & Tipagens (src/preload + src/shared)
  ↑
PR 4 (topo): Componentes UI Svelte (src/renderer/features)
```

- Não criar stacked PRs apenas por ter múltiplos commits.
- Tasks independentes devem usar branches/worktrees independentes.

### 4. Desenvolvimento Local

Priorize feedback rápido durante o loop de edição:
1. Lint do código afetado.
2. Typecheck quando relevante.
3. Menor conjunto relevante de testes.
4. Corrigir falhas imediatamente.

Múltiplos commits intermediários são permitidos e esperados. Não perca tempo fazendo squash/rewrite durante o desenvolvimento ativo.

### 5. Stacked PRs (`gh stack`)

Quando houver dependência real entre branches antes do merge:

```powershell
gh extension install github/gh-stack   # gh >= 2.90

gh stack init task/<N>-<slug>          # camada base (target: main)
gh stack add task/<M>-<slug>           # próxima camada (depende da anterior)
gh stack submit --auto --open          # push + criação não interativa de PRs prontos para review
gh stack sync --prune                  # sincronizar após merges ou alterações
gh stack merge --yes --squash          # merge bottom-up não interativo
```

- **Não esperar merge para avançar**: continue desenvolvendo as camadas superiores imediatamente sem aguardar o merge da camada de baixo.
- Cada camada = 1 branch = 1 PR com mudanças incrementais.
- **Propagação de correções**: se alterar uma camada intermediária, execute `gh stack sync --prune` seguido de `gh stack submit --auto --open` (nunca faça rebase manual complexo).
- Merge sempre **bottom-up**; rebase em cascata automático pelo GitHub.
- Branch protection e CI valem para todas as camadas. O workflow `ci.yml` deve disparar em qualquer `pull_request` (sem filtro de branches) para que os PRs intermediários recebam checks de CI.
- Não suportado: cross-fork stacks e GitHub Desktop.

### 6. Validação Local Pré-PR (Obrigatória para QUALQUER PR)

Antes de submeter **qualquer** PR (seja normal ou stack), execute a validação local completa:
1. `npm run typecheck`
2. Testes automatizados relevantes
3. `npm run build` (build completo da aplicação Electron + Svelte)

> **Regra Fundamental**: Nunca submeta um PR sem rodar o `npm run build` localmente com sucesso. A CI do GitHub é apenas uma verificação automatizada rápida, não substitui a validação local prévia.

- **Em PR Normal**: rode `npm run build` sempre antes do PR.
- **Em Stack**: durante o desenvolvimento entre camadas use checks rápidos (`typecheck`), mas antes de submeter a stack, rode o `npm run build` a partir da branch do topo (que representa o estado combinado final).

### 7. Submissão e Vinculação de Issues

> **Atenção**: Agentes só devem fazer push e abrir PR quando o usuário **pedir explicitamente**.

- **PR Normal**:
  ```powershell
  git push -u origin HEAD
  gh pr create --title "..." --body "Closes #<issue> ..." --base main
  gh pr merge --auto --squash
  ```
- **Stacked PR**:
  - Submeter com `gh stack submit`.
  - Camadas intermediárias usam `Part of #<issue>`.
  - Apenas a última camada (ou PR final) usa `Closes #<issue>`. A issue só fecha quando a mudança completa chega em `main`.

### 8. GitHub CI e Correções

- **CI rápida**: checks limitados a lint, typecheck e testes. Não rodar build completo nem gerar empacotamento Electron na CI de PR comum.
- **Correção de falhas**: inspecionar → corrigir localmente → validar → push no mesmo PR (ou `gh stack submit`/`gh stack sync` para stacks). Não abandone o PR para abrir outro.

### 9. Merge

- Merge apenas com todos os checks de CI verdes.
- **Squash and Merge** é o padrão para PRs normais.
- Para stacks, usar merge bottom-up via `gh stack merge`.
- Após merge: fechar issue se aplicável, deletar branch remota/local e atualizar `main`.

### 10. Merge Queue

Não usar GitHub Merge Queue por padrão. O projeto tem fluxo solo e prioriza baixa latência.

### 11. Releases e Empacotamento

Fluxo separado de desenvolvimento:
```text
Dev PR:  lint → typecheck → testes → build local → PR → CI → merge
Release: main → validação → Electron packaging → instaladores/artefatos → release
```
Nunca empacotar o Electron em tarefas normais de desenvolvimento.

### Matriz de Decisão Rápida

| Cenário | Ação |
| --- | --- |
| Mudança autocontida | PR normal |
| Mudança grande em camadas dependentes | Stacked PR (`gh stack`) |
| Tasks independentes | Branches / worktrees separados |
| Durante o desenvolvimento | Feedback rápido (lint / typecheck / testes focados) |
| Antes de submeter PR ou Stack | Build completo local |
| GitHub CI | Checks rápidos apenas |
| Estratégia de Merge | Squash Merge (bottom-up se stack) |
| Release | Build de distribuíveis isolado a partir da `main` |

---

## Design System — Industrial Brutalist Grid UI

Regra visual central:
- Todo elemento pertence a uma **cell**.
- Toda cell pertence a um **grid**.
- O grid deve permanecer **visualmente perceptível**.

Preferir:
- grids modulares rígidos
- bordas e divisores de 1px visíveis
- compartimentos retangulares
- tipografia monoespaçada / técnica
- densidade estruturada de informação
- labels, estados, métricas e timestamps explícitos
- tokens compartilhados (`foundations/tokens.css`)
- CSS simples e componentes reutilizáveis

Evitar:
- cards flutuantes, border-radius excessivo, shadows, glassmorphism, gradientes decorativos, whitespace excessivo, estilos duplicados fora do DS.

## Componentização

Fluxo obrigatório para nova UI:
1. Já existe no DS? → **Reutilizar**.
2. Não existe e **não é genérico**? → Criar em `features/`.
3. Não existe e **é genérico**? → Criar em `design-system/` → Adicionar em `DesignSystemPage.svelte` → Usar na Feature.

Hierarquia:
```
Foundations → Primitives → Controls / Data Display / Layout / Navigation
                              ↓
                         Compositions
                              ↓
              Feature Components → Pages
```

## Living Design System

- `src/renderer/pages/DesignSystemPage.svelte` é a **fonte de verdade visual**.
- Usa componentes e tokens reais de produção (nunca mockados).
- Qualquer alteração visual só é considerada completa quando refletida nessa página.

---

## Backend / Dados

- SQLite **apenas no main**. Renderer acessa via IPC (`preload` → `window.razai`).
- Schema inicial: `src/main/database/schema.ts`.
- Migrations versionadas: `src/main/database/migrations/`.
- Tipagens IPC: `src/shared/types.ts`.

---

## Ambiente e Comandos

- Caminho canônico no Windows: `C:\\Users\\razai\\Devs\\raz-sistema`
- Executar comandos (`git`, `npm`, `gh`) no PowerShell nativo do Windows.

```powershell
cd C:\\Users\\razai\\Devs\\raz-sistema

# Node.js 22 LTS
node -v

npm install
npm run dev
npm run build
npm run typecheck
```
