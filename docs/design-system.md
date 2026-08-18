# Design System — Industrial Brutalist Grid UI

Este documento descreve a linguagem visual, componentes, tokens e padrões arquiteturais do Design System do **razai-sistema**. A fonte de verdade visual viva é `src/renderer/pages/DesignSystemPage.svelte` (utilizando exclusivamente componentes reais de produção).

---

## 1. Princípio Fundamental

> **Every element belongs to a cell. Every cell belongs to a grid. The grid must remain visually perceptible.**

A interface é estruturada como um maquinário de precisão: compartimentos rígidos de 1px, sem curvas decorativas, sombras suaves ou gradientes, priorizando alta densidade de informação técnica, contraste e previsibilidade.

---

## 2. Foundations e Tokens

| Token / Regra | Arquivo | Descrição |
| --- | --- | --- |
| Cores, Espaçamentos, Bordas, Tokens | `src/renderer/design-system/foundations/tokens.css` | Cores semânticas (`--color-bg`, `--color-border`, `--color-accent`, etc.), spacing modular (`--space-1` a `--space-7`), borda de 1px (`--border-width`). |
| Hierarquia Tipográfica | `src/renderer/design-system/foundations/typography.css` | Família monoespaçada (`--font-mono`), escalas (`--text-2xs` a `--text-2xl`) e letter-spacing técnico (`--tracking-tight`, `--tracking-label`, `--tracking-header`). |
| Classes de Grid Modular | `src/renderer/design-system/foundations/grid.css` | Utilitários `.grid-system`, `.grid-header`, `.grid-footer`, `.grid-row`. |
| Reset Global & Scrollbar | `src/renderer/design-system/foundations/global.css` | Scrollbars técnicas quadradas, focus states `:focus-visible` e seleção de texto customizada. |

### Regras Visuais Mandatórias:
- **Tema Escuro Industrial**: Fundo primário `#0e0e0e`, superfícies elevadas `#161616`, fundos rebaixados `#080808`.
- **Bordas Rígidas**: `1px solid var(--color-border)` (#262626). `border-radius: 0` em todos os elementos.
- **Tipografia Técnica & Line-Height 100%**: Todas as tipografias e textos utilizam `line-height: 100%` (ou `1`), garantindo alinhamento óptico e vertical controlado.
- **Grid de Alturas em Múltiplos de 4/8**: Todo componente final possui altura total calculada estritamente múltipla de 4 ou 8px (ex.: Badges/Status `20px`, Botões `24px`/`32px`, Inputs/Selects `32px`, NavItems `36px`, Topbar/Footers `40px`, Toolbars `48px`).
- **Sem Decorações Supérfluas**: Proibido uso de box-shadows flutuantes, glassmorphism, blur ou gradientes decorativos.

---

## 3. Regras de Ouro de Altura e Baseline (Grid 4/8 & Line-Height 100%)

> ### 1. Line-Height 100% Universal
> Todo e qualquer elemento textual (`span`, `p`, `label`, `button`, `input`, `select`, `th`, `td`, `div`, títulos `h1-h6`) possui obrigatoriamente `line-height: 100%` (ou `1`), eliminando qualquer entrelinha residual fracionária.
>
> ### 2. Componentes Prontos e Compensação Estrutural
> A altura somada total de qualquer componente pronto (somando conteúdo, padding e bordas de 1px com `box-sizing: border-box`) deve resultar estritamente em um múltiplo de 4 ou 8px:
> - **Micro / Tags / Status**: `20px` (múltiplo de 4)
> - **Botão Pequeno (`size="sm"`)**: `24px` (múltiplo de 8)
> - **Botão Padrão (`size="md"`) / Input / Select**: `32px` (múltiplo de 8)
> - **Item de Menu Lateral (`NavItem`)**: `36px` (múltiplo de 4)
> - **Abas (`Tabs`) / Cabeçalho de Tabela (`th`)**: `32px` (múltiplo de 8)
> - **Linhas de Tabela (`td`) / Topbar / Painéis**: `40px` (múltiplo de 8)
> - **Toolbars de Busca / Cabeçalhos de Formulário / Modais**: `48px` (múltiplo de 8)
> - **Rodapés de Ação (`.form-footer`)**: `56px` (múltiplo de 8)
>
> ### 3. Relação Hierárquica Pai-Filho
> Se um componente estiver aninhado dentro de outro componente, **tanto os elementos filhos quanto os elementos pais** devem possuir altura somada estritamente múltipla de 4 ou 8.
> Exemplo: Campo de formulário composto:
> $$\text{Label }(16\text{px}) + \text{Margin }(8\text{px}) + \text{Input }(32\text{px}) = 56\text{px}\quad(7 \times 8\text{px})$$
>
> ### 4. Blocos de Layout
> Todo e qualquer bloco que compõe o layout (barras laterais, topbars, toolbars, seções de formulário, rodapés, modais e containers) deve ter sua altura somada cravada em múltiplos de 4 ou 8.

---

## 4. Catálogo de Camadas e Componentes

### 3.1 Primitives (`design-system/primitives/`)
- `Cell.svelte`: Célula retangular estrutural com bordas ou fundo configurável.
- `Divider.svelte`: Divisor horizontal ou vertical de 1px.
- `Label.svelte`: Rótulo de campo com indicador opcional de obrigatoriedade (`required`).
- `Icon.svelte`: Ícones vetoriais SVG autorais, traço de 1px com `crispEdges`. Ícones: `grid`, `dash`, `settings`, `system`, `chevron`, `chevron-left`, `arrow-left`, `check`, `empty`, `fabric`, `palette`, `link`, `plus`, `search`.
- `Surface.svelte`: Compartimento de fundo elevado ou rebaixado.

### 3.2 Controls (`design-system/controls/`)
- `Button.svelte`: Botões industriais com variantes `primary`, `secondary`, `ghost`, `danger` e tamanhos `md` e `sm`.
- `Input.svelte`: Campo de entrada monoespaçado com suporte a afixos de unidade (`suffix="m"`, `suffix="g/m²"`, `prefix="R$"`) e amostra de cor (`swatch="#FFCC00"`).
- `Select.svelte`: Caixa de seleção estilizada com indicador de chevron SVG e estados de foco explícitos.
- `Checkbox.svelte`: Caixa de marcação técnica quadrada de 1px.
- `Toggle.svelte`: Chave comutadora retangular de alta visibilidade.

### 3.3 Data Display (`design-system/data-display/`)
- `Table.svelte`: Tabela técnica com ordenação automática e interativa por colunas (ASC/DESC), colunas com alinhamento e largura customizável, clique na linha e fallback de dados vazios.
- `Status.svelte`: Indicador de estado do sistema com pontos luminosos (`ok`, `warn`, `danger`, `neutral`).
- `Badge.svelte`: Tag compacta em monoespaçado para status, mensagens e contadores.
- `Metric.svelte`: Exibição destacada de valores numéricos com rótulo e unidade.
- `Progress.svelte`: Barra de progresso retangular de 1px com preenchimento sólido.

### 3.4 Layout (`design-system/layout/`)
- `Panel.svelte`: Painel encapsulador com suporte a modo `flush`, snippets `header` e `actions`.
- `Grid.svelte`: Grid CSS modular com suporte a múltiplas colunas (`cols={1..6}`) e modo sem margens (`bare`).
- `Stack.svelte`: Empilhamento vertical ou horizontal com espaçamentos parametrizados.
- `SplitPane.svelte`: Divisor de tela ajustável para layouts duplos.
- `ScrollArea.svelte`: Área com rolagem customizada e barras finas industriais.

### 3.5 Navigation (`design-system/navigation/`)
- `Sidebar.svelte`: Barra lateral de navegação com logotipo e compartimentos verticais.
- `NavItem.svelte`: Item de menu lateral com ícone, estado ativo por inversão de cores e contador opcional.
- `Topbar.svelte`: Barra de cabeçalho unificada no topo do viewport, contendo título dinâmico da rota e slot de ações à direita.
- `Tabs.svelte`: Abas horizontais de alternância de contexto.
- `Breadcrumb.svelte`: Trilha navegável com itens clicáveis e separadores técnicos `/`.

### 3.6 Compositions (`design-system/compositions/`)
- `EmptyState.svelte`: Estado vazio contextualizado com ícone, título técnico, descrição e botão de ação opcional.
- `DataPanel.svelte`: Composição combinando métricas, tabelas e cabeçalhos.
- `MetricPanel.svelte`: Painel de monitoramento e indicadores rápidos.
- `Inspector.svelte`: Painel lateral de inspeção e edição de detalhes.

---

## 4. Padrão de Topbar Unificada e Ações

Para eliminar cabeçalhos duplicados nas telas e maximizar a área útil:
1. **Topbar Única**: Existe apenas uma barra de topo (`AppTopbar`), que gerencia o título da seção atual (`TECIDOS`, `CORES`, `INÍCIO`, etc.).
2. **Ações Primárias no Topo**: Botões de cadastro ou ações globais da tela atual (`+ Cadastrar Tecido`, `+ Cadastrar Cor`) ficam posicionados na extremidade direita da Topbar, ao lado do indicador de conexão do banco (`SQLite Online`).
3. **Páginas Livres de Repetição**: As páginas de listagem começam diretamente na barra de ferramentas e busca (`.toolbar`), fluindo imediatamente para a tabela de dados (`Table`).

---

## 5. Fluxo de Criação de Novos Componentes

```text
Nova necessidade de UI
        │
        ▼
 Já existe no Design System? ──Sim──► Reutilizar
        │ Não
        ▼
     É genérico? ──Não──► Criar em src/renderer/features/
        │ Sim
        ▼
 Criar em src/renderer/design-system/
        │
        ▼
 Adicionar ao DesignSystemPage.svelte
        │
        ▼
 Usar na Feature
```
