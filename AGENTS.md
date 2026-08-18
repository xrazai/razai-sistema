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

## Tasks e changelog (obrigatório)

### Papéis

- **Board (GitHub Projects)** — o que falta fazer: issues do repo com `Priority` (P0/P1/P2) e `Status` (Backlog → Ready → In progress → In review → Done).
- **`CHANGELOG.md`** — o que já foi feito, **mais recente no topo**.

Uma task só está “fechada” quando:

1. O PR foi **mergeado** e a issue foi movida para **Done** no board, **e**
2. Tem entrada correspondente em `CHANGELOG.md` (resumo de poucas palavras).

### Prioridade e ordem de implementação

- Prioridade calculada como **score = 3× desbloqueio + 2× risco + valor** → P0 (≥12), P1 (7–11), P2 (≤6).
- Ao trabalhar, preferir **P0 → P1 → P2**; dentro da mesma prioridade, a menor issue aberta, salvo o usuário pedir outra.
- Dependências reais entre tasks abertas → **stacked PRs** (ver abaixo).

### Cadastrar nova task

1. Entender dependências (o que precisa existir antes).
2. Criar **issue** no repo com título `Task <N> — <resumo>` e body com prioridade/score, justificativa de ordem e fluxo de branch.
3. Adicionar ao board e preencher `Priority` e `Status`.
4. Não cadastrar task genérica demais (“melhorar app”); quebrar em entregas verificáveis.

### Concluir uma task

1. Entregar o código/docs pedidos pela task **na branch da task** (ver **Branches e PRs** abaixo).
2. Mover a issue para **In progress** / **In review** conforme o andamento.
3. Em `CHANGELOG.md`, **no topo**, uma linha — data + poucas palavras:

```md
## YYYY-MM-DD — resumo curto
```

4. Abrir PR para `main` (ou empilhar), push da branch e aguardar merge (não entregar task só em `main` local).
5. Após o merge: **fechar a issue** e mover para **Done** no board.
6. Se a task gerou UI genérica nova: atualizar `DesignSystemPage.svelte` (ver Design System abaixo) **antes** de considerar completa.

### O que agentes NÃO devem fazer

- Fechar task só no chat, sem mover a issue no board e sem `CHANGELOG.md`.
- Criar segundo backlog (markdown paralelo, Notion, etc.).
- Escrever changelog longo (arquivos, commits, notas) — só o resumo curto.
- Implementar task direto em `main` ou reutilizar branch de outra task.

---

## Branches e PRs (obrigatório)

Toda task pendente no board é entregue em **uma branch nova** + **PR para `main`**. Uma task = uma branch = um PR (stacked quando houver dependência).

### Nomenclatura

```
task/<N>-<slug-kebab>
```

| Parte | Regra | Exemplo |
| --- | --- | --- |
| Prefixo | Sempre `task/` | `task/` |
| `N` | Número da issue no board (sem zero à esquerda) | `1`, `15` |
| `slug` | 2–5 palavras da task, kebab-case, sem acento | `definir-dominio-produto` |

Exemplos:

- Task 1 → `task/1-definir-dominio-produto`
- Task 3 → `task/3-runner-migrations`
- Task 9 → `task/9-empacotar-app-windows`

### Fluxo

1. Atualizar `main` local (`git pull` em `main`).
2. Criar a branch a partir de `main` com o nome no padrão acima.
3. Implementar só o escopo daquela task (+ `CHANGELOG.md` e movimentação da issue no board).
4. Commit(s) na branch; **não** commitar a entrega em `main`.
5. Push da branch e abrir PR para `main` com **GitHub CLI** (`gh pr create` — ver **GitHub** abaixo).
6. Após o merge, apagar a branch remota/local se ainda existir e voltar para `main` atualizada.

Hotfix / chore fora de task numerada: usar `fix/<slug>` ou `chore/<slug>`, ainda assim com PR para `main` — não empilhar em `main` direto.

### Stacked PRs — `gh stack` (preview)

Quando uma task **depende** de outra ainda não mergeada, empilhar em vez de esperar o merge (feature em preview do GitHub; habilitar no repo antes de usar):

```powershell
gh extension install github/gh-stack   # gh >= 2.90

gh stack init task/<N>-<slug>          # camada de baixo (trunk: main)
gh stack add task/<M>-<slug>           # próxima camada, depende da de baixo
gh stack submit                        # push + PRs linked (--auto em terminal não interativo)
gh stack sync --prune                  # após merges; seguro em automação
gh stack merge --yes --squash          # merge bottom-up, não interativo
```

Regras:

- Uma task = uma camada = um PR. Empilhar **só com dependência real**; tasks independentes → PRs separados para `main`.
- Merge sempre **bottom-up**; o GitHub faz rebase cascata do restante automaticamente.
- Branch protection e checks de CI (GitHub Actions) valem para **todas** as camadas — nenhuma camada mergeia sem passar nos checks.
- Não suportado: cross-fork stacks e GitHub Desktop.

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
- CSS simples
- componentes reutilizáveis

Evitar:

- cards flutuantes
- border-radius excessivo
- shadows
- glassmorphism
- gradientes decorativos
- whitespace excessivo
- estilos duplicados fora do Design System
- padrões visuais específicos de feature quando já existir componente no Design System

## Componentização

Fluxo obrigatório para nova necessidade de UI:

1. Já existe no Design System? → **Reutilizar**.
2. Não existe e **não é genérico**? → **Criar na Feature** (`features/`).
3. Não existe e **é genérico**? →
   1. Criar no Design System
   2. Adicionar ao `DesignSystemPage.svelte`
   3. Usar na Feature

Hierarquia de dependência (não inverter):

```
Foundations → Primitives → Controls / Data Display / Layout / Navigation
                              ↓
                         Compositions
                              ↓
              Feature Components → Pages
```

`DesignSystemPage` consome qualquer camada como fonte de verdade visual.

Regras:

- UI genérica → `design-system/`
- UI de produto → `features/`
- Features **compõem** o Design System; não reimplementam estilos
- Promover para o Design System **somente** quando for genuinamente genérico e reutilizável
- Não introduzir nova linguagem visual sem precedente no Design System; se for necessário, implemente primeiro no Design System

## Living Design System

- `src/renderer/pages/DesignSystemPage.svelte` é a **fonte de verdade visual** do Design System atual.
- Deve usar os **componentes e tokens reais de produção**.
- Nunca criar versões fake só para documentação.
- Qualquer mudança em componente, token, tipografia, spacing, layout ou padrão visual **só está completa** quando refletida nessa página.
- Não introduzir Storybook ou outro framework de DS sem necessidade demonstrada.
- Preferir a menor abstração que resolve a necessidade atual.

## Backend / dados

- SQLite só no **main**. Renderer acessa dados via IPC (`preload` → `window.razai`).
- Schema inicial em `src/main/database/schema.ts`.
- Migrations versionadas em `src/main/database/migrations/` quando o schema evoluir — sem framework prematuro.
- Tipagens IPC em `src/shared/types.ts`.

## GitHub (git / PR)

- Remote: configurar `origin` apontando para o repositório GitHub (`https://github.com/<org>/<repo>.git`).
- Fonte da verdade do backlog: **board** (issues) + **`CHANGELOG.md`**.
- Fluxo de branch por task: ver **Branches e PRs** acima.
- CI e apps são opcionais; só quando houver task correspondente.

### PRs — GitHub CLI

```powershell
# Em C:\Users\razai\Devs\raz-sistema, na branch da entrega:
git push -u origin HEAD

gh pr create --title "…" --body "…" --base main
```

- **Usar** `gh pr create`, `gh pr view`, `gh pr merge`.
- Tasks dependentes ainda não mergeadas: usar `gh stack` (ver **Stacked PRs** acima) em vez de esperar o merge.

## Como trabalhar

- Antes de implementar: ler a task de maior prioridade no board (ou a que o usuário indicar) e este `AGENTS.md`.
- Abrir branch `task/<N>-<slug>` a partir de `main` **antes** de codar a task.
- Não inventar bibliotecas de UI, roteadores ou state managers sem pedido explícito.
- Não expandir o escopo além do pedido / da task.
- Manter o visual Industrial Brutalist; não “modernizar” com cards, shadows ou glass.
- Em dúvida de onde colocar um componente: seguir o fluxo de componentização.
- Ao terminar entrega alinhada a uma task: mover a issue para **Done** no board, adicionar resumo curto em `CHANGELOG.md` e abrir PR no GitHub (`gh pr create` ou `gh stack submit`).
- Documentação viva do DS: `docs/design-system.md` + `DesignSystemPage.svelte`.

### Shell: PowerShell no Windows

Caminho canônico do repo: **`C:\Users\razai\Devs\raz-sistema`**.

Rodar `git`, `npm` e `gh` **somente** nesse caminho nativo do Windows (PowerShell).

Evitar:

- Misturar `node_modules` compilados em outro SO com Node no Windows

## Comandos

```powershell
cd C:\Users\razai\Devs\raz-sistema

# Node.js 22 LTS instalado nativamente no Windows
node -v

npm install
npm run dev
npm run build
npm run typecheck
```
