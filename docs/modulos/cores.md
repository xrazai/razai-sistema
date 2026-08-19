# Módulo de Cores — Especificação e Regras de Negócio

Este documento descreve o funcionamento, regras de validação, conversão de espaços de cor e persistência do **Módulo de Cores** do **razai-sistema**.

---

## 1. Fluxo e Visões do Módulo

O módulo é estruturado em três visões principais integradas ao roteador reativo:

1. **Listagem / Paleta (`CoresPage.svelte` - rota `#cores`)**:
   - Cabeçalho integrado na **Topbar Unificada** com o botão **"+ Cadastrar Cor"** e status do banco.
   - Amostra visual de cor (swatch) renderizada em cada linha da tabela.
   - Célula de HEX com **botão de cópia rápida** e feedback temporário visual (`COPIADO` / checkmark).
   - Busca em tempo real (insensível a maiúsculas e acentos) por nome, código HEX ou valores LAB.
   - Tabela de alta densidade (`Amostra`, `SKU`, `Nome da Cor`, `HEX`, `LAB (L / A / B)`, `Atualizado em`).
   - Clique na linha para abrir a tela de detalhes da cor.
2. **Cadastro (`CoresCadastroPage.svelte` - rota `#cores/cadastro`)**:
   - Formulário em grade modular (`Grid cols={4}`).
   - Validação de nome comercial em **exatamente 2 palavras** (`<Família> <Variação>`).
   - Preview automático do SKU semântico de 8 caracteres (`4 letras da Família + 4 letras da Variação`).
   - Campos com swatch embutido na extremidade direita do input (`Input swatch={...}`) fornecendo feedback visual instantâneo durante a digitação.
   - Conversão bidirecional automática: digitar HEX calcula e preenche o LAB; digitar LAB calcula e preenche o HEX.
3. **Detalhes e Edição (`CoresDetalhesPage.svelte` - rota `#cores/<id>`)**:
   - Visualização e edição dos parâmetros da cor com swatch, tag de SKU e tag HEX de pré-visualização.
   - Ações de atualização, cancelamento e exclusão com diálogo semântico de confirmação.

---

## 2. Estrutura e Regras de Campos

| Campo | Tipo | Obrigatoriedade | Formato / Validação | Descrição |
| --- | --- | --- | --- | --- |
| **SKU** | Texto técnico | **Automático / Único** | `8 caracteres maiúsculos` | 4 letras da família + 4 letras da variação (preenchido com `X` se menor que 4). Resolução de colisão alfabética sem números. |
| **Nome da cor** | Texto simples | **Obrigatório** | `Exatamente 2 palavras` | Nome comercial da cor no formato `<Família> <Variação>` (ex.: *Azul Marinho*, *Verde Militar*, *Rosa Chá*). |
| **HEX** | Texto com swatch | **Obrigatório** | `#RRGGBB` (sempre em maiúsculas) | Código hexadecimal sRGB de 6 caracteres precedido por `#` (ex.: `#FFCC00`). |
| **LAB** | Texto com swatch | **Obrigatório** | `00,00 / 00,00 / 00,00` | Coordenadas no espaço de cor CIE-$L^*a^*b^*$ com iluminante D65. |

---

## 3. Regras de Geração e Resolução de Colisão do SKU

1. **Estrutura Base (8 Chars)**:
   - 4 primeiras letras da Família (1ª palavra).
   - 4 primeiras letras da Variação (2ª palavra).
   - Preenchimento com `X` caso alguma palavra tenha menos de 4 letras.
2. **Resolução de Conflito / Colisão (Sem Números)**:
   - **Passo 1**: Mantém a Família e as 2 primeiras letras da Variação e busca novas combinações das 2 últimas letras usando as letras da palavra de variação.
   - **Passo 2**: Altera as 2 primeiras letras da variação usando outras letras da palavra de variação.
   - **Passo 3**: Permutação alfabética pura (A-Z) garantindo unicidade determinística sem números.

---

## 3. Conversão Matemática de Espaços de Cor

A conversão entre **CIE-$L^*a^*b^*$** (D65) e **sRGB** é realizada diretamente no frontend em tempo real (`src/renderer/features/cores/utils.ts`):

1. **LAB $\rightarrow$ XYZ**: Conversão das coordenadas $L^*, a^*, b^*$ para o espaço de cor CIE-XYZ com ponto branco de referência D65 ($X_n=95.0489, Y_n=100.0, Z_n=108.8840$).
2. **XYZ $\rightarrow$ Linear sRGB**: Aplicação da matriz de transformação de cor sRGB padrão.
3. **Linear sRGB $\rightarrow$ Gamut Clamped sRGB**: Aplicação da curva de correção de gama (gamma correction $\gamma=2.4$) com clamping no intervalo $[0, 255]$.
4. **sRGB $\rightarrow$ HEX**: Formatação dos canais R, G, B em string hexadecimal `#RRGGBB`.

---

## 4. Persistência SQLite & IPC

- **Tabela**: `cores` (gerenciada pela migration `003_create_cores.ts`).
- **Serviço Main**: `src/main/services/cores.service.ts` com métodos `list()`, `getById()`, `create()`, `update()`, `delete()`.
- **IPC Handlers**: canais `cores:list`, `cores:get-by-id`, `cores:create`, `cores:update`, `cores:delete`.
- **Preload Bridge**: exposto em `window.razai.cores`.
