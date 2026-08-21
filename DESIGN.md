---
name: "Razai Sistema"
description: "Sistema de controle de loja para rotinas têxteis e comerciais, com precisão geométrica e calor operacional."
colors:
  bg: "#0e0e0e"
  bg-elevated: "#141414"
  bg-sunken: "#0a0a0a"
  fg: "#e8e8e8"
  fg-muted: "#9a9a9a"
  fg-dim: "#6a6a6a"
  border: "#2a2a2a"
  border-strong: "#4a4a4a"
  accent: "#c8c8c8"
  accent-fg: "#0e0e0e"
  ok: "#7a9a7a"
  warn: "#b8a060"
  danger: "#b07070"
  info: "#7088a0"
typography:
  display:
    fontFamily: '"IBM Plex Mono", "Consolas", "Courier New", monospace'
    fontSize: "18px"
    fontWeight: 500
    lineHeight: "100%"
    letterSpacing: "0.04em"
  headline:
    fontFamily: '"IBM Plex Mono", "Consolas", "Courier New", monospace'
    fontSize: "15px"
    fontWeight: 500
    lineHeight: "100%"
    letterSpacing: "0.04em"
  title:
    fontFamily: '"IBM Plex Mono", "Consolas", "Courier New", monospace'
    fontSize: "13px"
    fontWeight: 500
    lineHeight: "100%"
    letterSpacing: "0.04em"
  body:
    fontFamily: '"IBM Plex Mono", "Consolas", "Courier New", monospace'
    fontSize: "13px"
    fontWeight: 400
    lineHeight: "100%"
    letterSpacing: "0.01em"
  label:
    fontFamily: '"IBM Plex Mono", "Consolas", "Courier New", monospace'
    fontSize: "11px"
    fontWeight: 500
    lineHeight: "100%"
    letterSpacing: "0.08em"
rounded:
  none: "0"
spacing:
  space-1: "4px"
  space-2: "8px"
  space-3: "12px"
  space-4: "16px"
  space-5: "24px"
  space-6: "32px"
  space-7: "48px"
  cell-pad: "12px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-fg}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "8px 12px"
    height: "32px"
  button-secondary:
    backgroundColor: "{colors.bg-elevated}"
    textColor: "{colors.fg}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "8px 12px"
    height: "32px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.fg-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "8px 12px"
    height: "32px"
  input:
    backgroundColor: "{colors.bg-sunken}"
    textColor: "{colors.fg}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "8px 12px"
    height: "32px"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.fg-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "8px 12px"
    height: "40px"
  panel-head:
    backgroundColor: "{colors.bg-elevated}"
    textColor: "{colors.fg-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "8px 16px"
    height: "40px"
  badge:
    backgroundColor: "{colors.bg-elevated}"
    textColor: "{colors.fg-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "4px 8px"
    height: "20px"
---

# Design System: Razai Sistema

## Overview

**Creative North Star: "Sistema de Controle de Loja — Precisão Acolhedora"**

Razai Sistema é uma superfície de controle escura para o dia a dia da loja. A assinatura atual é técnica, firme e organizada: cada informação pertence a uma caixa própria, cada sequência deve ser legível e cada linha deve fechar geometricamente. A interface não tenta parecer uma vitrine; ela deve se comportar como uma ferramenta confiável de operação.

Acolhimento é uma camada tonal, não uma licença para suavizar a estrutura. O tema permanece escuro e plano, com contraste controlado, estados claros e ritmo previsível. A sensação desejada é a de usar uma ferramenta precisa e bem cuidada em um ambiente confortável — uma metáfora de calor e segurança aplicada sem gradientes decorativos, excesso de ornamento ou perda de informação.

**Key Characteristics:**

- Superfície de controle escura e técnica.
- Informação compartimentada em células e painéis visíveis.
- Geometria rigorosa, sequências corretas e alinhamento verificável.
- Profundidade plana, com camadas tonais e divisores estruturais.
- Componentes firmes, responsivos e previsíveis.
- Comunicação operacional em português.
- Semântica equivalente à hierarquia visual, com foco em teclado e feedback recuperável.

## Colors

A paleta implementada é quase monocromática, com cinzas de carvão para estruturar a superfície e cores dessaturadas para comunicar estado. A direção acolhedora deve ser obtida por temperatura neutra sutil, contraste confortável e ritmo estável — nunca por decoração que enfraqueça a leitura.

### Primary

- **Prata de Sinal** (`#c8c8c8`): Acento principal para ações primárias, seleção ativa, foco, preenchimentos e feedback de interação.

### Neutral

- **Carvão Base** (`#0e0e0e`): Fundo principal da aplicação e da área de conteúdo.
- **Carvão Rebaixado** (`#0a0a0a`): Superfícies de entrada, estados rebaixados e trilhos de controle.
- **Grafite Elevado** (`#141414`): Topbar, sidebar, cabeçalhos e superfícies de apoio.
- **Branco de Trabalho** (`#e8e8e8`): Texto primário, títulos e conteúdo de alta prioridade.
- **Cinza Operacional** (`#9a9a9a`): Labels, metadados e texto secundário legível.
- **Cinza Dim** (`#6a6a6a`): Placeholders, estados inativos e informações auxiliares.
- **Linha de Grade** (`#2a2a2a`): Divisores e compartimentos estruturais.
- **Linha Forte** (`#4a4a4a`): Bordas de controles e estados de maior definição.

### Status

- **Verde de Confirmação** (`#7a9a7a`): Operação concluída ou conexão saudável.
- **Âmbar de Atenção** (`#b8a060`): Aviso, espera ou estado que requer observação.
- **Vermelho de Falha** (`#b07070`): Erro, perigo ou ação destrutiva.
- **Azul de Informação** (`#7088a0`): Informação contextual e filtros ativos.

**The Warmth Without Noise Rule.** Acolhimento vem de temperatura tonal, contraste e ritmo controlados — não de gradientes, superfícies decorativas ou cores saturadas.

## Typography

**Display Font:** IBM Plex Mono (com Consolas, Courier New e monospace como fallback)

**Body Font:** IBM Plex Mono (com Consolas, Courier New e monospace como fallback)

**Label/Mono Font:** IBM Plex Mono; IBM Plex Sans existe como apoio para descrições que pedem leitura mais suave.

**Character:** A monoespacialidade torna códigos, sequências, colunas e medidas visualmente verificáveis. A hierarquia é compacta, explícita e técnica; a variação de peso, escala e contraste organiza sem depender de espaços vagos.

### Hierarchy

- **Display** (500, 18px, line-height 100%, letter-spacing 0.04em): Títulos principais e nomes de superfície, sempre em caixa alta.
- **Headline** (500, 15px, line-height 100%, letter-spacing 0.04em): Títulos de seção e cabeçalhos intermediários.
- **Title** (500, 13px, line-height 100%, letter-spacing 0.04em): Títulos locais, conteúdo destacado e nomenclatura de trabalho.
- **Body** (400, 13px, line-height 100%, letter-spacing 0.01em): Dados, descrições, valores e texto operacional.
- **Label** (500, 11px, line-height 100%, letter-spacing 0.08em, caixa alta): Labels, headers de tabela, badges, estados e ações compactas.

**The Baseline Rule.** Todo elemento textual deve usar line-height de 100% para preservar a sequência vertical e tornar o alinhamento auditável.

## Layout

O shell principal usa uma coluna lateral fixa de 220px e uma área de trabalho fluida. A área principal é dividida em uma topbar de 40px e conteúdo rolável. O grid é visível: separadores de 1px pertencem ao grid, não são linhas duplicadas desenhadas por cada filho.

O ritmo parte de uma escala de 4px, com passos de 4, 8, 12, 16, 24, 32 e 48px. O compasso estrutural é 40px para brand, navegação, topbar, toolbars, cabeçalhos de painel e linhas de tabela; controles padrão ocupam 32px, controles compactos 24px e indicadores 20px. Grids de 2, 3, 4, 6 e 12 colunas são previstos pelos fundamentos.

O conteúdo deve manter `min-width: 0`, permitir rolagem onde a densidade exigir e preservar compartimentos em vez de comprimir informações até que percam contexto. A adaptação existente é pontual — por exemplo, o drop zone muda de composição abaixo de 640px — enquanto o produto permanece uma aplicação desktop Windows.

**The Exact Cell Rule.** Cada elemento pertence a uma célula; cada célula pertence a um grid; o grid deve permanecer visualmente perceptível.

**The Sequence Rule.** Ordem, alinhamento, altura e relação entre pai e filho devem fechar em múltiplos verificáveis de 4 ou 8px, com o ritmo estrutural de 40px onde a interface cruza áreas.

## Elevation & Depth

O sistema é plano por padrão. Profundidade é comunicada por diferenças tonais entre carvão base, superfícies elevadas e fundos rebaixados, além de divisores estruturais de 1px. Os `box-shadow` existentes são inset e funcionam como linhas de fechamento geométrico, não como sombras flutuantes. Não há vocação para cards suspensos, blur, glassmorphism ou gradientes.

**The Flat-by-Default Rule.** Superfícies permanecem planas em repouso; estados ganham definição por contraste, borda, inversão de cor ou divisor estrutural.

## Shapes

A linguagem formal é retangular e precisa: `border-radius: 0` em todos os componentes, bordas físicas de 1px quando o compartimento precisa de contorno e sombras inset quando o divisor deve preservar o box model. Inputs, selects, botões, tabs, badges, painéis e células compartilham a mesma disciplina de cantos retos.

Ícones são SVGs próprios de 12 ou 14px, com traço de 1px e `shape-rendering: crispEdges`. Estados vazios podem usar borda tracejada para diferenciar ausência de dados de uma falha estrutural; essa é uma exceção semântica, não uma decoração.

## Components

### Buttons

Componentes de ação firmes, compactos e responsivos ao estado.

- **Shape:** retangular, sem raio (`0`), borda de 1px.
- **Primary:** Prata de Sinal no fundo, Carvão Base no texto, 32px de altura e padding 8px 12px; versão compacta com 24px e padding 4px 8px.
- **Secondary:** Grafite Elevado no fundo, Branco de Trabalho no texto e Linha Forte no contorno.
- **Ghost:** Fundo transparente, texto secundário e Linha de Grade no contorno.
- **Danger:** Fundo transparente com Vermelho de Falha no texto e no contorno; hover inverte para preenchido.
- **Hover / Active / Focus:** Hover reforça a borda; active usa inversão tonal; focus-visible usa outline de 1px; transições usam 120ms linear.

### Inputs / Fields

Campos técnicos que fazem o valor parecer parte do mesmo compartimento que sua unidade ou amostra.

- **Style:** Fundo Carvão Rebaixado, borda de 1px Linha Forte, sem raio, fonte monoespacial, 32px de altura e padding 8px 12px.
- **Grouped fields:** Prefixos, sufixos e swatches ocupam células laterais próprias, separadas por Linha de Grade.
- **Focus:** Borda Prata de Sinal e fundo Carvão Base; `focus-within` comunica o grupo inteiro.
- **Disabled:** Opacidade reduzida e cursor de indisponibilidade, sem remover a estrutura do campo.

### Navigation

Navegação funciona como régua de orientação do sistema, não como decoração lateral.

- **Sidebar:** 220px de largura, Grafite Elevado, divisor vertical inset.
- **Brand:** 40px de altura, padding 8px 12px, label monoespaciada em caixa alta.
- **Nav item:** 40px de altura, padding 8px 12px, texto secundário em repouso e hover com fundo Carvão Base.
- **Active:** Prata de Sinal no fundo e Carvão Base no texto; subnavegação usa 32px e uma linha inset de 2px para indicar contexto.
- **Topbar:** 40px de altura, padding 8px 16px, título à esquerda e ações à direita.

### Panels / Cells

Painéis são compartimentos de trabalho: delimitam contexto, não flutuam sobre ele.

- **Panel:** Fundo Carvão Base, borda de 1px Linha de Grade, flex vertical e altura mínima controlada.
- **Panel head:** 40px, Grafite Elevado, padding 8px 16px, label em caixa alta e ações alinhadas no mesmo eixo.
- **Panel body:** padding padrão de 12px; modo `flush` remove o padding para tabelas e grids que já controlam seus próprios compartimentos.
- **Cell:** Fundo Carvão Base, padding opcional de 12px e borda opcional de 1px.

### Tables / Toolbars

Dados são apresentados como sequência auditável, com cabeçalho, linhas e estado de ordenação claramente separados.

- **Table:** Cabeçalhos e linhas com 40px de altura, padding 8px 16px, cabeçalho sticky e divisores inset inferior/direito.
- **Sorting:** A coluna ativa usa Prata de Sinal e fundo Carvão Rebaixado; indicadores de ordenação permanecem visíveis e o estado é exposto por `aria-sort`. Cabeçalhos ordenáveis aceitam clique, Enter e Espaço.
- **Row state:** Hover usa Grafite Elevado; linha clicável comunica cursor e mantém todas as colunas preservadas.
- **Table toolbar:** 40px, busca fluida à esquerda, filtros no centro e metadados/ações à direita, mantendo cada bloco como célula. A contagem mostra `filtrados de total` somente quando o filtro reduz o conjunto.
- **Table hint:** Instruções essenciais ficam imediatamente antes da tabela, no mesmo fluxo visual da interação que descrevem.

### Status / Badges

Indicadores compactos que tornam estado e contagem visíveis sem deslocar o layout.

- **Badge:** 20px de altura, padding 4px 8px, fundo Grafite Elevado, contorno de 1px e label em caixa alta.
- **Overflow:** Textos longos usam ellipsis dentro do badge; `title` e `aria-label` mantêm a mensagem completa disponível.
- **Status:** 20px de altura com ponto quadrado de 6px; o texto permanece explícito.
- **Tones:** Verde de Confirmação, Âmbar de Atenção, Vermelho de Falha e Azul de Informação carregam significado operacional.

### Semantics / Accessibility

- Seções de formulário são `section` com `aria-labelledby` apontando para headings `h2`; títulos não são apenas spans estilizados.
- Foco visível usa o acento do sistema sem alterar a geometria do componente.
- Mensagens de sucesso e erro permanecem no contexto da operação, com recuperação disponível quando a ação falha.
- Organização reduz carga cognitiva pela ordem, pelos compartimentos e pela clareza, nunca pela remoção silenciosa de dados.

### Empty States

Ausência de dados é tratada como um estado do sistema, não como um espaço sem explicação.

- **Style:** Borda tracejada de 1px, fundo Carvão Base, min-height de 160px, conteúdo centralizado e descrição com largura máxima de 440px.
- **Action:** Ações opcionais usam Button secundário compacto, mantendo o próximo passo explícito.
- **Tone:** Falhas e avisos mudam borda, título e ícone sem substituir a estrutura do estado.

## Do's and Don'ts

### Do:

- **Do** preserve cada informação relevante em sua própria célula, painel ou coluna identificável.
- **Do** use os tokens reais de `src/renderer/design-system/foundations/tokens.css`.
- **Do** mantenha o ritmo de 40px em elementos estruturais e múltiplos de 4/8px em componentes.
- **Do** use divisores inset para fechar geometrias sem introduzir colisões de borda.
- **Do** faça hover, active, focus-visible, disabled, loading e error comunicarem estados sem reorganizar a estrutura.
- **Do** mantenha a interface em português claro, técnico e operacional.
- **Do** trate o aconchego como temperatura tonal e conforto de leitura dentro do tema escuro.

### Don't:

- **Don't** esconda informação relevante para reduzir carga cognitiva; organize-a e torne sua relação explícita.
- **Don't** use border-radius, sombras flutuantes, blur, glassmorphism ou gradientes decorativos.
- **Don't** quebre sequências, desalinhem linhas ou crie alturas arbitrárias fora do ritmo modular.
- **Don't** substitua caixas e divisores por whitespace indefinido ou cards suspensos.
- **Don't** use cores saturadas ou ornamentos quentes para simular aconchego.
- **Don't** introduza outra família tipográfica ou outra escala sem uma razão de produto documentada.
