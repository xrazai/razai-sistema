# AGENTS.md — razai-sistema

Orientações obrigatórias para qualquer agente (humano ou IA) que trabalhar neste repositório.

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
2. Há entrada correspondente no topo do `CHANGELOG.md` (`## YYYY-MM-DD — resumo curto`).

### Prioridade e Ordem

- Score de prioridade: `score = 3× desbloqueio + 2× risco + valor` → P0 (≥12), P1 (7–11), P2 (≤6).
- Ordem de execução: P0 → P1 → P2. Em empate, a menor issue aberta (salvo indicação contrária).
- Dependências reais entre tasks abertas → **Stacked PRs**.

### Ciclo da Task

1. **Cadastrar**: criar issue com título `Task <N> — <resumo>` e body com prioridade/score, justificativa e fluxo de branch. Adicionar ao board com Priority e Status.
2. **Iniciar**: atualizar `main`, criar branch `task/<N>-<slug>` a partir de `main` e mover issue para `In progress`.
3. **Desenvolver e validar**: implementar o escopo focado da task e validar localmente.
4. **Submeter**: abrir PR via GitHub CLI (`gh pr create` ou `gh stack submit`), mover para `In review`.
5. **Concluir**: após o merge, adicionar linha no topo do `CHANGELOG.md`, fechar issue (ou mover para `Done`), apagar branch local/remota e atualizar `main`.
6. Se gerou UI genérica nova: atualizar `DesignSystemPage.svelte` antes de considerar completa.

**O que agentes NÃO devem fazer**:
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
- **Stacked PR**: apenas quando uma entrega grande pode ser dividida em camadas dependentes e significativas (ex.: Schema → Service → IPC → UI).
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
gh stack submit                        # push + criação de PRs vinculados
gh stack sync --prune                  # sincronizar após merges
gh stack merge --yes --squash          # merge bottom-up não interativo
```

- Cada camada = 1 branch = 1 PR com mudanças incrementais.
- Merge sempre **bottom-up**; rebase em cascata automático.
- Branch protection e CI valem para todas as camadas.
- Não suportado: cross-fork stacks e GitHub Desktop.

### 6. Validação Local Pré-PR

Antes de submeter PR normal ou stack completa:
1. `npm run typecheck`
2. Testes automatizados relevantes
3. `npm run build` (build completo da aplicação)

O build completo é etapa **pré-PR**, não do loop de edição. Nunca abra PR com build falhando.

**Regra em stack**: não execute o build completo para cada camada individual. Valide a branch mais alta a ser submetida/mergeada (representa o estado combinado final).

### 7. Submissão e Vinculação de Issues

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
