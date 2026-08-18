# Design System — Industrial Brutalist Grid UI

Este documento descreve a linguagem visual e a organização do Design System do **razai-sistema**. A fonte de verdade **visual** é `src/renderer/pages/DesignSystemPage.svelte` (componentes reais).

## Princípio

> Every element belongs to a cell. Every cell belongs to a grid. The grid must remain visually perceptible.

A interface é um sistema de compartimentos rígidos. Informação densa, bordas explícitas, tipografia técnica.

## Foundations

| Token / regra | Onde |
| --- | --- |
| Cores, spacing, borders, tipografia base | `foundations/tokens.css` |
| Hierarquia tipográfica | `foundations/typography.css` |
| Classes de grid modular | `foundations/grid.css` |
| Reset + scrollbar + focus | `foundations/global.css` |

Características:

- fundo escuro (`--color-bg`)
- bordas 1px (`--border-width`)
- `border-radius: 0`
- fonte mono (`--font-mono`)
- spacing modular (`--space-1` … `--space-7`)
- tracking padronizado (`--tracking-tight` / `--tracking-label` / `--tracking-header`)
- motion mínimo (`--motion-fast: 120ms linear`)
- `::selection` e caret temáticos

Regras estruturais:

- **O grid dono dos separadores**: `.grid-system` desenha as linhas internas (gap 1px sobre `--color-border`); filhos diretos nunca desenham borda própria.
- **Estado ativo por inversão**: NavItem/Tab ativo = fundo `--color-accent` + texto `--color-accent-fg` (nunca borda > 1px).
- **Ícones**: SVG autoral, stroke 1px, `shape-rendering: crispEdges`, monocromáticos (`currentColor`).
- **Checkbox/Toggle**: customizados (quadrado 1px), sem styling nativo do OS; focus visível via `:focus-visible` no irmão visual.
- **Panel `flush`**: corpo sem padding quando contém Table/Grid encostados na moldura (`Table bordered={false}`, `Grid bare`).

## Camadas de componentes

```
Foundations
    ↓
Primitives          Cell, Divider, Label, Icon, Surface
    ↓
Controls            Button, Input, Select, Checkbox, Toggle
Data Display        Status, Metric, Badge, Table, Progress
Layout              Panel, Stack, Grid, SplitPane, ScrollArea
Navigation          Sidebar, Topbar, Tabs, NavItem
    ↓
Compositions        Inspector, DataPanel, MetricPanel, EmptyState
    ↓
Feature Components / Pages
```

`DesignSystemPage` pode importar qualquer camada para documentação viva.

## Componentização

```
Nova necessidade de UI
        │
        ▼
 Já existe no Design System? ──Sim──► Reutilizar
        │ Não
        ▼
     É genérico? ──Não──► Criar na Feature
        │ Sim
        ▼
 Criar no Design System
        │
        ▼
 Adicionar ao DesignSystemPage
        │
        ▼
 Usar na Feature
```

## Preferências / proibições

**Preferir:** grid rígido, divisores 1px, compartimentos, mono, densidade, labels/estados/métricas explícitos, tokens, CSS simples, reuso.

**Evitar:** cards flutuantes, radius, shadows, glass, gradientes decorativos, whitespace excessivo, estilos duplicados, padrões de feature que deveriam ser do DS.

## Living page

Qualquer alteração reutilizável (token, tipografia, spacing, primitive, control, composition, padrão visual) **deve** aparecer em `DesignSystemPage.svelte` antes de considerar a mudança completa.

Não usar Storybook nesta fundação.
