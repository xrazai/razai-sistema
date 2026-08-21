# Módulo de Tecidos — Especificação e Regras de Negócio

Este documento descreve o funcionamento, regras de validação, cálculos de engenharia têxtil e persistência do **Módulo de Tecidos** do **razai-sistema**.

---

## 1. Fluxo e Visões do Módulo

O módulo é estruturado em três visões principais integradas ao roteador reativo:

1. **Listagem / Catálogo (`TecidosPage.svelte` - rota `#tecidos`)**:
   - Cabeçalho integrado na **Topbar Unificada** com o botão **"+ Cadastrar Tecido"** e status do banco.
   - Barra de ferramentas com busca em tempo real (*unaccented* e insensível a maiúsculas) e contadores dinâmicos de resultados.
   - Tabela de alta densidade com o núcleo operacional (`SKU`, `Nome`, `Composição`) e a ação **Mais campos**; largura, rendimento, gramaturas, tipo e acabamento continuam disponíveis no detalhe do tecido.
   - A primeira coluna permanece fixa em janelas menores, enquanto os valores textuais usam truncamento visual com o conteúdo completo preservado no título acessível.
   - A instrução para abrir uma linha aparece junto da tabela. O clique na linha, a ação **Mais campos** e os cabeçalhos ordenáveis levam ao detalhe sem retirar informações do cadastro.
   - Ordenação interativa por cabeçalho com `aria-sort`, suporte a Enter/Espaço e foco visível. A contagem mostra apenas o total quando o filtro não reduz a lista; com filtro efetivo, mostra `filtrados de total`.
2. **Cadastro (`TecidosCadastroPage.svelte` - rota `#tecidos/cadastro`)**:
   - Formulário em grid modular preenchendo 100% da largura útil.
   - Três seções estruturadas: Identificação Básica, Dimensões/Rendimento e Propriedades/Acabamento.
   - Validações estritas de negócio com mensagens de feedback contextualizadas.
3. **Detalhes e Edição (`TecidosDetalhesPage.svelte` - rota `#tecidos/<id>`)**:
   - Visualização completa e recálculo automático de métricas ao editar valores numéricos.
   - Ações de salvar alterações, cancelar e exclusão com diálogo semântico de confirmação.

As três seções do cadastro e da edição são elementos `section` identificados por headings `h2`. Essa hierarquia mantém a ordem visual e fornece contexto consistente para leitores de tela.

### 1.1. Feedback e recuperação

- Após criar, atualizar ou excluir, a listagem exibe uma confirmação persistente até que o usuário a dispense.
- Erros de exclusão permanecem dentro do diálogo de confirmação, recebem foco e mantêm a ação de tentar novamente disponível.
- Erros de validação permanecem no contexto do formulário; nenhuma métrica ou campo técnico é ocultado para simplificar a tela.

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

## 4. Regra de Geração de SKU do Tecido

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
### 4.1 Resolução de Colisão (Sem Números)
Caso o SKU base de 4 caracteres já exista no banco de dados para outro tecido:
1. **Começando pela última parte do SKU**: o sistema mantém os caracteres da 1ª parte e busca novas combinações de 2 letras na última palavra (ex: `Tule Renda Alencon` -> base `TUAL`; em colisão com `Tule Rústico Algodão`, gera `TUAG` usando as letras de *Algodão*).
2. Se houver palavras intermediárias, tenta pares de letras das palavras intermediárias.
3. Tenta novas combinações da 1ª palavra combinadas com a última.
4. Permutação alfabética pura (A-Z) garantindo unicidade estrita de 4 letras sem utilizar números.

## 5. Preservação de informação e responsividade

A redução de carga cognitiva no catálogo é feita por hierarquia, não por descarte de dados:

- **Núcleo na listagem:** SKU, Nome e Composição são os campos necessários para identificação rápida.
- **Detalhe completo:** métricas de engenharia e propriedades permanecem no detalhe e podem ser consultadas por **Mais campos**.
- **Sequência previsível:** busca, contagem, dica de interação, tabela e seleção seguem uma ordem estável.
- **Geometria fechada:** a tabela usa células e divisores do grid; a primeira coluna fixa tem fundo opaco para não misturar valores durante a rolagem.
- **Contagem honesta:** o total sem filtro vem da lista completa; o formato `n de total` só aparece quando há redução real pelo filtro.
