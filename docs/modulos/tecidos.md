# Módulo de Tecidos — Especificação e Regras de Negócio

Este documento descreve o funcionamento, regras de validação e cálculos técnicos do **Módulo de Tecidos** do **razai-sistema**.

---

## 1. Fluxo do Módulo

O módulo é composto por três visões principais:
1. **Listagem / Catálogo (`TecidosPage.svelte`)**:
   - Tabela com headers técnicos (`SKU`, `Nome`, `Composição`, `Largura (m)`, `Rendimento (m/kg)`, `Gramatura Linear (g/m)`, `Gramatura (g/m²)`, `Tipo`, `Acabamento`).
   - Busca em tempo real (insensível a acentos e case-insensitive) e contador dinâmico de itens.
   - Botão de ação superior **"Cadastrar Tecido"**.
   - Clique na linha para visualização e edição detalhada.
2. **Cadastro (`TecidosCadastroPage.svelte`)**:
   - Formulário em grade modular ocupando 100% da largura útil.
   - Três seções estruturadas: Identificação Básica, Dimensões/Rendimento e Propriedades/Acabamento.
3. **Detalhes / Edição (`TecidosDetalhesPage.svelte`)**:
   - Visualização e edição completa dos dados técnicos e métricas recalculadas.
   - Ações de atualização e exclusão com confirmação.

---

## 2. Estrutura e Regras de Campos

### 2.1 Seção 01 — Identificação Básica (Grid 2 colunas)
| Campo | Tipo | Obrigatoriedade | Descrição / Exemplo |
| --- | --- | --- | --- |
| **Nome** | Texto simples | **Obrigatório** | Identificação comercial do tecido (ex.: *Tricoline Lisa 100% Algodão*). |
| **Composição** | Texto simples | **Obrigatório** | Descrição percentual das fibras (ex.: *100% Algodão*, *97% Algodão / 3% Elastano*). |

---

### 2.2 Seção 02 — Dimensões e Rendimento (Grid 4 colunas)
Os campos numéricos desta seção seguem o padrão métrico brasileiro e iniciam vazios com placeholders ilustrativos.

| Campo | Sufixo | Obrigatoriedade | Placeholder padrão |
| --- | --- | --- | --- |
| **Largura ($L$)** | `m` | **Obrigatório** | `1,50` |
| **Rendimento ($R$)** | `m/kg` | Condicional (ver regra) | `2,80` |
| **Gramatura Linear ($GL$)** | `g/m` | Condicional (ver regra) | `270` |
| **Gramatura Superficial ($GM$)** | `g/m²` | Condicional (ver regra) | `180` |

> **Regra de Validação**: Além da **Largura ($L$)**, é obrigatório fornecer **ao menos um** dos três valores secundários ($R$, $GL$ ou $GM$). Os dois restantes são deduzidos e preenchidos automaticamente.

---

### 2.3 Seção 03 — Propriedades e Acabamento (Grid 4 colunas)
| Campo | Tipo | Opções |
| --- | --- | --- |
| **Tipo** | Select | *Selecione (padrão)*, *Liso*, *Estampado* |
| **Transparência** | Select | *Selecione (padrão)*, *Nenhuma*, *Baixa*, *Média*, *Alta* |
| **Elasticidade** | Select | *Selecione (padrão)*, *Nenhuma*, *Baixa*, *Média*, *Alta* |
| **Acabamento** | Select | *Selecione (padrão)*, *Fosco*, *Semi-brilho*, *Brilhante* |

---

## 3. Fórmulas de Engenharia Têxtil e Auto-cálculo

As conversões físicas entre largura ($L$ em metros), rendimento ($R$ em metros lineares por quilo), gramatura linear ($GL$ em gramas por metro linear) e gramatura superficial ($GM$ em gramas por metro quadrado) são dadas por:

### 3.1 Relações Fundamentais
$$GL = \frac{1000}{R} = GM \times L$$

$$GM = \frac{GL}{L} = \frac{1000}{R \times L}$$

$$R = \frac{1000}{GL} = \frac{1000}{GM \times L}$$

### 3.2 Cenários de Interconversão
1. **Entrada: Largura ($L$) + Rendimento ($R$)**:
   - $GL = \frac{1000}{R}$
   - $GM = \frac{GL}{L}$
2. **Entrada: Largura ($L$) + Gramatura Linear ($GL$)**:
   - $R = \frac{1000}{GL}$
   - $GM = \frac{GL}{L}$
3. **Entrada: Largura ($L$) + Gramatura Superficial ($GM$)**:
   - $GL = GM \times L$
   - $R = \frac{1000}{GL}$

---

## 5. Regra de Geração de SKU / Código do Tecido

Para o catálogo de tecidos, o identificador de SKU é padronizado em **4 caracteres maiúsculos**, gerados deterministicamente a partir do nome do tecido:

- **2 primeiros caracteres da primeira palavra** + **2 primeiros caracteres da última palavra**.
- Caso o nome seja composto por uma **única palavra**, utilizam-se os **4 primeiros caracteres** dessa palavra.
- Caracteres especiais e acentos são removidos (*unaccented*).

### Exemplos:
| Nome do Tecido | Primeira Palavra | Última Palavra | SKU Gerado |
| --- | --- | --- | --- |
| **Anarruga** | `AN` (Anarruga) | — | **`ANAR`** |
| **Cetim** | `CE` (Cetim) | — | **`CETI`** |
| **Cetim com Elastano** | `CE` (Cetim) | `EL` (Elastano) | **`CEEL`** |
| **Tricoline Lisa 100% Algodão** | `TR` (Tricoline) | `AL` (Algodão) | **`TRAL`** |
| **Linho Puro Rústico** | `LI` (Linho) | `RU` (Rústico) | **`LIRU`** |
| **Sarja Acetinada com Elastano** | `SA` (Sarja) | `EL` (Elastano) | **`SAEL`** |
| **Viscose Sarjada** | `VI` (Viscose) | `SA` (Sarjada) | **`VISA`** |
| **Jeans Denim Pesado** | `JE` (Jeans) | `PE` (Pesado) | **`JEPE`** |
