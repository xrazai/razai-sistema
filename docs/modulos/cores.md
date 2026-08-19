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
   - Tabela de alta densidade (`Amostra`, `Nome da Cor`, `HEX`, `LAB (L / A / B)`, `Atualizado em`).
   - Clique na linha para abrir a tela de detalhes da cor.
2. **Cadastro (`CoresCadastroPage.svelte` - rota `#cores/cadastro`)**:
   - Formulário em grade modular (`Grid cols={3}`).
   - Campos com swatch embutido na extremidade direita do input (`Input swatch={...}`) fornecendo feedback visual instantâneo durante a digitação.
   - Conversão bidirecional automática: digitar HEX calcula e preenche o LAB; digitar LAB calcula e preenche o HEX.
3. **Detalhes e Edição (`CoresDetalhesPage.svelte` - rota `#cores/<id>`)**:
   - Visualização e edição dos parâmetros da cor com swatch e tag HEX de pré-visualização.
   - Ações de atualização, cancelamento e exclusão com diálogo semântico de confirmação.

---

## 2. Estrutura e Regras de Campos

| Campo | Tipo | Obrigatoriedade | Formato / Validação | Descrição |
| --- | --- | --- | --- | --- |
| **Nome da cor** | Texto simples | **Obrigatório** | `String não vazia` | Nome comercial da cor (ex.: *Amarelo Canário*, *Preto Absoluto*). |
| **HEX** | Texto com swatch | **Obrigatório** | `#RRGGBB` (sempre em maiúsculas) | Código hexadecimal sRGB de 6 caracteres precedido por `#` (ex.: `#FFCC00`). |
| **LAB** | Texto com swatch | **Obrigatório** | `00,00 / 00,00 / 00,00` | Coordenadas no espaço de cor CIE-$L^*a^*b^*$ com iluminante D65. |

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
