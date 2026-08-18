# Razai Sistema

Sistema Desktop de Gestão e Engenharia Têxtil — **Electron + Svelte 5 + TypeScript + SQLite + CSS Puro**.

Linguagem visual: **Industrial Brutalist Grid UI**. Consulte `AGENTS.md` e `docs/design-system.md`.

---

## 1. Visão Geral e Arquitetura

O **Razai Sistema** foi projetado para alta densidade informacional, baixa latência e total confiabilidade operacional local.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        Processo Renderer (Svelte 5)                    │
│   • AppShell & Topbar Unificada    • Módulo Tecidos (CRUD + Cálculos)  │
│   • Router Reativo (Hash-based)    • Módulo Cores (LAB/HEX Swatches)   │
│   • Design System Industrial Grid  • Living Design System Page         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ window.razai (Context Bridge)
┌───────────────────────────────────▼────────────────────────────────────┐
│                        Processo Preload (Bridge Seguro)                │
│   • contextIsolation: true         • APIs tipadas (@shared/types)      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ IPC Handlers
┌───────────────────────────────────▼────────────────────────────────────┐
│                        Processo Main (Node.js / Electron)              │
│   • Janela nativa & AppUserModelId • Serviços de Domínio (Main)        │
│   • SQLite Runner de Migrations    • better-sqlite3 (WAL Mode + C++)   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Módulos e Recursos Implementados

### 🧶 Módulo de Tecidos
- **Catálogo Técnico**: Listagem com colunas técnicas (SKU, Nome, Composição, Largura, Rendimento, Gramatura Linear, Gramatura Superficial, Tipo, Acabamento).
- **Geração de SKU**: Regra têxtil de 4 caracteres maiúsculos a partir do nome com remoção de acentuação (*unaccented*).
- **Engenharia Têxtil**: Auto-cálculo e interconversão em tempo real entre Largura ($L$), Rendimento ($R$), Gramatura Linear ($GL$) e Gramatura ($GM$).
- **CRUD Completo**: Cadastro em grid modular, detalhes, edição, busca e exclusão semântica com confirmação.

### 🎨 Módulo de Cores
- **Paleta e Swatches**: Amostra visual de cor em tempo real nas tabelas e formulários.
- **Espaços de Cor**: Conversão matemática bidirecional instantânea entre **CIE-$L^*a^*b^*$** (D65) e **sRGB HEX**.
- **Busca e Filtro**: Busca insensível a maiúsculas e acentos por nome, código HEX ou valores LAB.

### 📐 Design System Industrial Brutalist (Grid 4/8 & Line-Height 100%)
- **Line-Height 100% Universal**: Todo texto, span, label, input, button e célula tem `line-height: 100%`.
- **Alturas Múltiplas de 4 ou 8px**: Todo componente pronto, container pai, elemento filho e bloco de layout possui altura somada estritamente múltipla de 4 ou 8px.
- **Compensação Estrutural**: Padding e heights compensados com `box-sizing: border-box` e bordas rígidas de 1px.

### 🧭 Navegação & Topbar Unificada
- **Topbar Única**: Cabeçalho unificado sem duplicações de títulos em páginas.
- **Ações de Topbar**: Botões de ação primária (`+ Cadastrar Tecido`, `+ Cadastrar Cor`) integrados no canto superior direito ao lado do status de conexão do banco.
- **Roteador Reativo**: Navegação por hash URL (`#tecidos`, `#cores`, `#settings`, etc.) sem dependências externas pesadas.

### 🗄️ Banco de Dados & Persistência Local
- **SQLite Nativo (`better-sqlite3`)**: Persistência no caminho canônico `%APPDATA%\razai-sistema\data\razai.sqlite`.
- **Modo WAL & Foreign Keys**: Alta performance de leitura/escrita concorrente com integridade referencial ativa.
- **Migrations Versionadas**: Runner transacional idempotente gerenciado via tabela `schema_migrations`.

---

## 3. Estrutura de Diretórios

```
src/
├── main/                 → Electron main process, banco SQLite, migrations e IPC
│   ├── database/         → Conexão db.ts, runner migrator.ts e migrations versionadas
│   ├── ipc/              → Handlers de comunicação IPC
│   └── services/         → Lógica de negócio de Tecidos e Cores
├── preload/              → Bridge seguro (contextIsolation) expondo window.razai
├── shared/               → Tipagens TypeScript compartilhadas (types.ts, sku.ts, textile-math.ts)
└── renderer/             → Interface Svelte 5
    ├── design-system/    → Foundations, Primitives, Controls, Data Display, Layout, Compositions
    ├── features/         → Telas e regras de produto (tecidos, cores, dashboard, settings, vinculos)
    ├── shell/            → AppShell, AppSidebar, AppTopbar, Router reativo
    └── pages/            → Living Design System Page
```

---

## 4. Requisitos e Pré-requisitos

- **Sistema Operacional**: Windows 10/11 x64
- **Node.js**: 22 LTS ou superior
- **Git**: Git for Windows recente
- **Caminho Canônico**: `C:\Users\razai\Devs\raz-sistema`

---

## 5. Scripts Disponíveis (PowerShell)

```powershell
cd C:\Users\razai\Devs\raz-sistema

# Instalação de dependências e sincronização dos módulos nativos
npm install

# Desenvolvimento com Hot-Reload (Electron + Vite)
npm run dev

# Checagem estática de tipos TypeScript / Svelte
npm run typecheck

# Execução de testes unitários (Vitest)
npm run test

# Execução de testes E2E (Playwright)
npm run test:e2e

# Build de produção do código TypeScript / Svelte
npm run build

# Empacotamento rápido descompactado (dist/win-unpacked)
npm run package:win

# Geração dos instaladores completos para Windows (NSIS + Portable)
npm run build:win
```

---

## 6. Documentação Detalhada

- [Design System — Regras e Componentes](docs/design-system.md)
- [Módulo de Tecidos — Especificação e Fórmulas](docs/modulos/tecidos.md)
- [Módulo de Cores — Especificação e Conversão de Cores](docs/modulos/cores.md)
- [Guia de Empacotamento, Distribuição e Smoke Test](docs/packaging.md)
- [Workflow de Desenvolvimento e GitHub Stacks](docs/workflow-github.md)
- [Diretrizes de Agentes e Regras do Repositório](AGENTS.md)
