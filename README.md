# Razai Sistema

Sistema Desktop de Gestão e Engenharia Têxtil — **Electron + Svelte 5 + TypeScript + SQLite + CSS Puro**.

Linguagem visual: **Industrial Brutalist Grid UI**. Consulte `AGENTS.md` e `docs/design-system.md`.

---

## 1. Visão Geral e Arquitetura

O **Razai Sistema** foi projetado para alta densidade informacional, baixa latência e total confiabilidade operacional local.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        Processo Renderer (Svelte 5)                    │
│   • AppShell & Topbar Unificada    • Tecidos, Cores e Vínculos         │
│   • Router Reativo (Hash-based)    • Vendas, Pedidos e Relatórios      │
│   • Design System Industrial Grid  • Agentes & Atendimento Shopee     │
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
- **Geração de SKU**: Regra têxtil de 4 caracteres maiúsculos a partir do nome com remoção de acentuação (*unaccented*) e resolução alfabética de colisões sem números.
- **Engenharia Têxtil**: Auto-cálculo e interconversão em tempo real entre Largura ($L$), Rendimento ($R$), Gramatura Linear ($GL$) e Gramatura ($GM$).
- **CRUD Completo**: Cadastro em grid modular, detalhes, edição, busca e exclusão semântica com confirmação.

### 🎨 Módulo de Cores
- **Paleta e Swatches**: Amostra visual de cor em tempo real nas tabelas e formulários.
- **SKU Semântico (8 Caracteres)**: 4 letras da Família + 4 letras da Variação com resolução determinística alfabética sem números.
- **Espaços de Cor**: Conversão matemática bidirecional instantânea entre **CIE-$L^*a^*b^*$** (D65) e **sRGB HEX**.
- **Ações Rápidas**: Cópia de HEX em 1 clique com feedback visual (`COPIADO` / checkmark).
- **Busca e Filtro**: Busca insensível a maiúsculas e acentos por nome, código HEX ou valores LAB.

### 🔗 Módulo de Vínculos (Matriz Tecido-Cor / Produtos Vendáveis)
- **SKU Composto Determinístico**: Geração automática de SKU de produto comercializável ($\text{SKU\_Tecido} + \text{"-"} + \text{SKU\_Cor}$, ex.: `TRAL-AZULMARI`).
- **Visão Mestre-Detalhes**: Lista densa de tecidos à esquerda com contagem de cartela ativa e tabela de cores vinculadas à direita com cópia rápida de SKU.
- **Cadastro em Lote com Grade Modular**: Seleção de tecido base em grid de `TecidoTile` (76px) e seleção múltipla de cores em grid de `CorTile` (76px) ordenado alfabeticamente.
- **Integridade Relacional**: Chaves estrangeiras com `ON DELETE CASCADE` para tecidos e `ON DELETE RESTRICT` para cores com índice único composto.

### 💰 Módulos de Vendas e Pedidos
- **Vendas**: Lançamento de itens por tecido/cor vinculados, cálculo de totais, histórico e impressão de cupom térmico ESC/POS.
- **Pedidos**: Criação e edição de pedidos, aprovação com conversão em venda, detalhes, exclusão e acompanhamento de status.
- **Documentos**: Geração de PDF A4 e compartilhamento por Web Share, com fallback para o helper nativo do Windows.

### 📊 Módulo de Relatórios
- **Indicadores**: KPIs de faturamento, quantidade, número de vendas, ticket médio e preço médio por metro.
- **Análises**: Vendas dos últimos 7 dias e relatório hierárquico por tecido e cor com filtros de período.
- **Previsibilidade**: Estimativa de demanda e estoque por tecido usando Croston-SBA em horizontes configuráveis.

### 🤖 Módulo de Agentes e Atendimento Shopee
- **Agentes**: Cadastro de agentes, modo de operação, prompt de sistema e base de conhecimento com FAQs, políticas e manuais.
- **Co-piloto**: Central de conversas com geração de respostas, aprovação ou rejeição de sugestões e histórico de mensagens.
- **Shopee**: Sessão persistente de Seller Centre e mapeamento de conversas recentes do WebChat.

### 🖨️ Integração de Impressora Térmica ESC/POS (80mm)
- **Comunicação Binária RAW Direta**: Builder fluente `EscPosBuilder` com suporte a 48 colunas (80mm), corte automático de guilhotina (`auto-cut`), negrito, tamanhos escalados e charset PT-BR (`CP850`).
- **Spooler Win32 USB**: Envio direto para a impressora via spooler do Windows (`winspool.drv`), homologado na impressora **Gertec G250W**.
- **Painel em Settings**: Detecção e seleção de impressoras disponíveis, persistência da impressora padrão e emissão de cupom de teste.

### ⚙️ Preferências e Configurações (Settings)
- **Persistência em Banco (`app_meta`)**: Salva tema visual, módulo padrão de inicialização e impressora configurada diretamente no SQLite local.
- **Operação e Suporte**: Exportação CSV, backup do SQLite, logs de diagnóstico, métricas do sistema e verificação de atualizações.

### 📐 Design System Industrial Brutalist (Grid 4/8 & Line-Height 100%)
- **Line-Height 100% Universal**: Todo texto, span, label, input, button, célula e pseudo-elemento tem `line-height: 100%`.
- **Ritmo Modular Rígido de 40px**: Linhas horizontais alinhadas de ponta a ponta na tela (Brand, Topbar, NavItem, Toolbar, Table th/td/footer, Painéis).
- **Alturas Múltiplas de 4 ou 8px**: Todo componente e bloco de layout possui altura somada estritamente múltipla de 4 ou 8px (20px, 24px, 32px, 40px, 48px, 56px, 76px/80px).
- **Divisores Virtuais Inset**: Linhas desenhadas via `box-shadow: inset` para zero colisão de bordas e zero subtração física no modelo de caixa.

### 🧭 Navegação & Topbar Unificada
- **Topbar Única**: Cabeçalho unificado sem duplicações de títulos em páginas.
- **Ações de Topbar**: Botões de ação primária (`+ Cadastrar Tecido`, `+ Cadastrar Cor`, `+ Cadastrar Vínculo`, `+ Nova Venda`, `+ Novo Pedido`) integrados no canto superior direito ao lado do status de conexão do banco.
- **Roteador Reativo**: Navegação por hash URL (`#tecidos`, `#cores`, `#vinculos`, `#vendas`, `#pedidos`, `#relatorios`, `#agentes`, `#settings`, etc.) sem dependências externas pesadas.

### 🗄️ Banco de Dados & Persistência Local
- **SQLite Nativo (`better-sqlite3`)**: Persistência no caminho canônico `%APPDATA%\razai-sistema\data\razai.sqlite`.
- **Modo WAL & Foreign Keys**: Alta performance de leitura/escrita concorrente com integridade referencial ativa.
- **Migrations Versionadas**: Runner transacional idempotente gerenciado via tabela `schema_migrations`.

---

## 3. Estrutura de Diretórios

```
src/
├── main/                 → Electron main process, banco SQLite, migrations, IPC e serviços
│   ├── database/         → Conexão db.ts, runner migrator.ts e migrations versionadas
│   ├── ipc/              → Handlers de comunicação IPC
│   └── services/         → Lógica de negócio (Tecidos, Cores, Vínculos, Vendas, Pedidos, Relatórios, Agentes)
│       ├── agent/        → ContextBuilder, LLM, sessão e mapeamento Shopee
│       ├── pdf/          → Geração de PDF e compartilhamento nativo
│       └── printer/      → EscPosBuilder, Win32 RAW Spooler e serviço de impressão
├── preload/              → Bridge seguro (contextIsolation) expondo window.razai
├── shared/               → Tipagens TypeScript compartilhadas (types.ts, sku.ts, textile-math.ts)
└── renderer/             → Interface Svelte 5
    ├── design-system/    → Foundations, Primitives, Controls, Data Display, Layout, Compositions
    ├── features/         → Telas e regras de produto (tecidos, cores, vinculos, vendas, pedidos, relatorios, agentes, settings)
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

### Validação no GitHub Actions

O workflow [`CI`](.github/workflows/ci.yml) é executado ao abrir ou atualizar qualquer Pull Request e também em pushes para a `main`.

Atualmente, o job de validação instala as dependências com `npm ci` e executa:

```powershell
npm run lint
npm run typecheck
```

Testes automatizados e build completo ainda não fazem parte da CI. Antes de submeter um PR, execute localmente:

```powershell
npm run lint
npm run typecheck
npm run test
npm run build
```

## 6. Documentação Detalhada

- [Design System — Regras, Baseline e Componentes](docs/design-system.md)
- [Módulo de Tecidos — Especificação e Fórmulas](docs/modulos/tecidos.md)
- [Módulo de Cores — Especificação e Conversão de Cores](docs/modulos/cores.md)
- [Módulo de Vínculos — Matriz Tecido-Cor e SKU Composto](docs/modulos/vinculos.md)
- [Impressão Térmica ESC/POS — Especificação Técnica (80mm)](docs/impressora-termal-escpos.md)
- [Padrão de Layout de Recibo Térmico 80mm](docs/padrao-layout-recibo-80mm.md)
- [Guia de Empacotamento, Distribuição e Smoke Test](docs/packaging.md)
- [Workflow de Desenvolvimento e GitHub Stacks](docs/workflow-github.md)
- [Diretrizes de Agentes e Regras do Repositório](AGENTS.md)
