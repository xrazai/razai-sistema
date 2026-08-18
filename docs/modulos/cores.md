# Módulo de Cores — Especificação e Regras de Negócio

Este documento descreve o funcionamento, regras de validação, estrutura de dados e especificações técnicas do **Módulo de Cores** do **razai-sistema**.

---

## 1. Fluxo do Módulo

O módulo segue rigorosamente a arquitetura e os padrões de navegação e componentes do sistema:

1. **Listagem / Paleta (`CoresPage.svelte`)**:
   - Tabela com headers técnicos (`Amostra`, `Nome da Cor`, `HEX`, `LAB (L / A / B)`, `Atualizado em`).
   - Amostra visual de cor (swatch) renderizada em cada linha.
   - Busca em tempo real (insensível a acentos, case-insensitive e busca por HEX/LAB).
   - Contador dinâmico de itens e resultados filtrados.
   - Botão de ação superior **"Cadastrar Cor"**.
   - Clique na linha para visualização e edição detalhada.
2. **Cadastro (`CoresCadastroPage.svelte`)**:
   - Formulário em grade modular (`Grid cols={3}`).
   - Campos com swatch embutido na extremidade direita do input com feedback visual instantâneo.
   - Botões de ação: **Cancelar** e **Salvar Cor**.
3. **Detalhes / Edição (`CoresDetalhesPage.svelte`)**:
   - Visualização e edição dos campos cadastrais.
   - Pré-visualização da amostra de cor com swatch indicador e tag HEX no cabeçalho.
   - Ações de atualização, cancelamento e exclusão com modal semântico de confirmação.

---

## 2. Estrutura e Regras de Campos

| Campo | Tipo | Obrigatoriedade | Formato / Validação | Descrição |
| --- | --- | --- | --- | --- |
| **Nome da cor** | Texto simples | **Obrigatório** | `String não vazia` | Nome comercial da cor (ex.: *Amarelo Canário*, *Preto Absoluto*). |
| **HEX** | Texto com swatch | **Obrigatório** | `#RRGGBB` (sempre em maiúsculas) | Código hexadecimal sRGB de 6 caracteres precedido por `#` (ex.: `#FFCC00`). |
| **LAB** | Texto com swatch | **Obrigatório** | `00,00 / 00,00 / 00,00` | Coordenadas no espaço de cor CIE-$L^*a^*b^*$ com iluminante D65. |

---

## 3. Feedback Visual e Amostras (Swatches)

- Os campos **HEX** e **LAB** utilizam o componente `Input` do Design System com a propriedade `swatch`.
- O swatch interno exibe um quadrado de 18x18px com a cor calculada ou uma micro-grade indicando estado neutro/vazio.
- A conversão entre **CIE-L\*a\*b\*** (D65) e **sRGB HEX** é calculada matematicamente em tempo real no frontend, permitindo que a amostra de cor responda imediatamente à digitação em qualquer um dos formatos.
