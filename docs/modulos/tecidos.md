# Módulo de Tecidos — Especificação e Regras de Negócio

Este documento descreve o funcionamento, regras de validação e cálculos técnicos do **Módulo de Tecidos** do **razai-sistema**.

---

## 1. Fluxo do Módulo

O módulo é composto por duas visões principais:
1. **Listagem / Catálogo (`TecidosPage.svelte`)**:
   - Tabela com headers técnicos (`Código`, `Nome / Descrição`, `Composição`, `Gramatura (g/m²)`, `Largura`, `Fornecedor`, `Status`).
   - Busca em tempo real e contador dinâmico de itens.
   - Botão de ação superior **"Cadastrar Tecido"**.
2. **Cadastro (`TecidosCadastroPage.svelte`)**:
   - Formulário em grade modular ocupando 100% da largura útil.
   - Três seções estruturadas: Identificação Básica, Dimensões/Rendimento e Propriedades/Acabamento.

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

## 4. Regras de Arredondamento

Para garantir consistência com o uso fabril e comercial:

1. **Gramaturas ($GL$ e $GM$)**:
   - Arredondamento para a **dezena inteira mais próxima**:
     $$\text{arredondado} = \operatorname{round}\left(\frac{\text{valor}}{10}\right) \times 10$$
   - Exemplos: $273 \to 270\text{ g/m}$; $186 \to 190\text{ g/m²}$.

2. **Rendimento ($R$)**:
   - Arredondamento para o **decimal mais próximo terminado em `,00` ou `,50`** (passo de $0,50$):
     $$\text{arredondado} = \frac{\operatorname{round}(\text{valor} \times 2)}{2}$$
   - Exemplos: $2,80 \to 3,00\text{ m/kg}$; $2,30 \to 2,50\text{ m/kg}$; $3,68 \to 3,50\text{ m/kg}$.
