# Módulo de Vínculos (Matriz Tecido-Cor / Produtos Vendáveis) — Especificação e Regras de Negócio

Este documento descreve o funcionamento, fluxo de UX, regras de formação de SKU composto, persistência relacional SQLite e IPC do **Módulo de Vínculos** do **razai-sistema**.

---

## 1. Conceito e Engenharia de SKU

Na manufatura e comércio têxtil, o produto acabado comercializável decorre da aplicação de uma cor específica (cartela) sobre uma base têxtil (artigo/tecido).

- **Tecido Base**: Identificado por seu SKU de 4 letras maiúsculas (ex.: `TRAL` - *Tricoline Lisa 100% Algodão*).
- **Cor da Coleção**: Identificada por seu SKU semântico de 8 letras maiúsculas (ex.: `AZULMARI` - *Azul Marinho*, `BRANPURO` - *Branco Puro*).
- **Vínculo / Produto Vendável**: Consolidação da relação relacional entre Tecido e Cor:
  $$\text{SKU Produto} = \text{SKU\_Tecido} + \text{"-"} + \text{SKU\_Cor} \quad (\text{ex.: } \texttt{TRAL-AZULMARI})$$

---

## 2. Fluxo e Visões do Módulo

O módulo é estruturado em duas visões principais integradas ao roteador reativo do sistema:

### 2.1 Visão Mestre-Detalhes (`VinculosPage.svelte` - rota `#vinculos`)
- **Barra de Ferramentas**:
  - Busca em tempo real insensível a maiúsculas e acentos (`unaccented`) por SKU consolidado, nome/código do tecido, nome/código da cor e código HEX.
  - Badges informativos de contagem de tecidos no catálogo e total de SKUs consolidados.
  - Botão integrado na **Topbar** (`+ Cadastrar Vínculo`).
- **Painel Esquerdo (Mestre - Tecidos)**:
  - Lista densa de todos os tecidos cadastrados exibindo SKU (`TRAL`), Nome, Composição e Badge com a quantidade de cores vinculadas (`4 cores`).
  - Destaque visual para o tecido ativo.
- **Painel Direito (Detalhes - Cartela Ativa do Tecido)**:
  - Cabeçalho do tecido com SKU, especificações de largura/gramatura e ação rápida `+ Adicionar Cores`.
  - Tabela densa de produtos vinculados com:
    - Amostra de cor (Swatch).
    - Nome da cor e código HEX.
    - SKU da cor.
    - **SKU Consolidado do Produto** em destaque com botão de cópia rápida para o clipboard (`COPIADO`).
    - Ação de desvincular com diálogo de confirmação.

### 2.2 Cadastro de Vínculo em Grade / Cards (`VinculosCadastroPage.svelte` - rota `#vinculos/cadastro`)
- **Seção 1 — Seleção do Tecido Base (Seleção Única)**:
  - Grid de células modulares (`TecidoTile`) com SKU em destaque, nome, composição e métricas (largura, gramatura linear/superficial).
  - Campo de busca instantânea de tecidos.
  - Destaque visual com borda de 2px na cor de acento (`var(--color-accent)`) e badge `✓ SELECIONADO`.
- **Seção 2 — Seleção das Cores da Cartela (Seleção Múltipla em Ordem Alfabética)**:
  - Lista de cores ordenada alfabeticamente por nome.
  - Grid de células modulares (`CorTile`) com proporções idênticas aos tiles de tecido, contendo swatch da cor, HEX, código LAB e SKU da cor.
  - Cores já vinculadas ao tecido ativo aparecem com estado desabilitado sutil e etiqueta `JÁ VINCULADO`.
  - Campo de busca instantânea de cores e botões utilitários: `[Marcar Disponíveis]` e `[Limpar Seleção]`.
- **Rodapé Modular Fixo (40px)**:
  - Resumo contextual em tempo real: `Tecido: TRAL • 4 cores selecionadas → 4 novos produtos vendáveis`.
  - Botão reativo: `[Criar vínculo]` (para 1 cor) ou `[Criar vínculos (N)]` (para múltiplas cores).

---

## 3. Persistência Relacional SQLite

- **Tabela**: `vinculos` (gerenciada pela migration `005_create_vinculos.ts`).
- **Chaves Estrangeiras**:
  - `tecido_id`: `REFERENCES tecidos(id) ON DELETE CASCADE`
  - `cor_id`: `REFERENCES cores(id) ON DELETE RESTRICT`
- **Índice Único Composto**: `UNIQUE(tecido_id, cor_id)` prevenindo duplicação de vínculos.
- **Serviço Main**: `src/main/services/vinculos.service.ts` com métodos `list()`, `listByTecido()`, `createBatch()`, `delete()`, `deleteByTecidoAndCor()`.
- **IPC Handlers**: canais `vinculos:list`, `vinculos:listByTecido`, `vinculos:createBatch`, `vinculos:delete`, `vinculos:deleteByTecidoAndCor`.
- **Preload Bridge**: exposto em `window.razai.vinculos`.
