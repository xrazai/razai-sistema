# Padrão de Layout do Recibo Térmico (80mm / 48 Colunas)

Este documento define a especificação canônica do **layout físico, visual e estrutural** dos recibos e cupons térmicos gerados para a impressora **Gertec G250W (80mm)** no **Razai Sistema**.

---

## 1. Especificações Físicas & Métricas da Bobina

- **Modelo Homologado**: Gertec G250W.
- **Largura da Bobina**: 80 mm.
- **Área Útil de Impressão**: ~72 mm (576 dots / 203 DPI).
- **Densidade / Fonte Padrão**: Fonte A (12×24 dots).
- **Largura da Grade (Grid Fixo)**: **Exatamente 48 caracteres por linha**.
- **Conjunto de Caracteres (Charset)**: `CP850` (Multilingual Latin I).
- **Protocolo de Envio**: Buffer Binário ESC/POS direto via Spooler Win32 (`RAW`).

---

## 2. Diagrama Visual do Recibo Padrão (Mockup Canônico)

```text
[01....................... 48 colunas .......................48]
================================================================
                         RAZAI SISTEMA                          
                  ENGENHARIA E GESTAO TEXTIL                    
                 CUPOM DE HOMOLOGACAO TERMICA                   
================================================================
IMPRESSORA:                                      G250 (USB004)
LARGURA:                                     80mm (48 Colunas)
DATA/HORA:                                 19/08/2026 14:30:00
PROTOCOLO:                                     ESC/POS RAW USB
----------------------------------------------------------------
ITEM / DESCRICAO            QTD       UNIT         TOTAL
----------------------------------------------------------------
LINHO PURO CRU              10m      45,00        450,00
VISCOSE TWILL               25m      28,50        712,50
SARJA 100% ALGODAO           5m      38,00        190,00
----------------------------------------------------------------
SUBTOTAL:                                           R$ 1.352,50
DESCONTO:                                              R$ 52,50
TOTAL:                                              R$ 1.300,00
================================================================
                   TESTE DE ACENTUACAO PT-BR                    
                  A E I O U - C - a e i o u - c                 
                Corte automatico de guilhotina OK               
----------------------------------------------------------------
                    RAZAI INDUSTRIAL BRUTALIST                  
================================================================
[ 3 Linhas de Avanço ]
[ Corte Automático de Guilhotina (GS V B 0) ]
```

---

## 3. Estrutura Modular das Seções

O layout é composto por 6 blocos sequenciais rigorosamente padronizados:

### 3.1. Cabeçalho da Empresa (Brand Header)
- **Título**: Centralizado, Negrito, Altura Dupla e Largura Dupla (`GS ! 0x11`).
  - Ex: `RAZAI SISTEMA`
- **Subtítulo / Ramo**: Centralizado, Fonte Normal (`GS ! 0x00`), sem negrito.
  - Ex: `ENGENHARIA E GESTAO TEXTIL`
- **Nome do Documento**: Centralizado, Caixa Alta.
  - Ex: `COMPROVANTE DE VENDA` / `ROMANEIO DE CORTE`
- **Fechamento**: Divisor duplo `================================================` (48 caracteres `=`).

### 3.2. Metadados e Informações Gerais (Meta Data Section)
- **Alinhamento**: Duas colunas justificadas (Chave à esquerda, Valor à direita preenchido com espaços).
- **Campos**:
  - `DOCUMENTO Nº:` / `Nº ORDEM:`
  - `DATA/HORA:` (formato `DD/MM/YYYY HH:mm:ss`)
  - `OPERADOR / VENDEDOR:`
  - `CLIENTE:`
- **Fechamento**: Divisor simples `------------------------------------------------` (48 caracteres `-`).

### 3.3. Tabela de Itens (Item Grid)
- **Cabeçalho da Tabela**: Negrito ativo (`ESC E 1`).
- **Distribuição de Largura das 48 Colunas**:
  ```text
  [ITEM / DESCRICAO ] [ QTD ] [  UNIT   ] [   TOTAL   ]
  [---- 18 cols ----] [- 6 -] [-- 10 ---] [-- 11 cols-]
  (18 + 1 + 6 + 1 + 10 + 1 + 11 = 48 colunas)
  ```
  1. **Coluna 1 (Descrição do Item)**: 18 colunas, alinhamento à esquerda (`padEnd(18)`). Corta textos maiores.
  2. **Coluna 2 (Quantidade/Unidade)**: 6 colunas, alinhamento à direita (`padStart(6)`). Ex.: `10m`, `2.5kg`, `3un`.
  3. **Coluna 3 (Valor Unitário)**: 10 colunas, alinhamento à direita (`padStart(10)`). Ex.: `45,00`.
  4. **Coluna 4 (Valor Total do Item)**: 11 colunas, alinhamento à direita (`padStart(11)`). Ex.: `450,00`.
- **Linhas de Itens**: Fonte normal, sem negrito.
- **Fechamento**: Divisor simples `------------------------------------------------`.

### 3.4. Totais e Financeiro (Totals Section)
- **Subtotal**: Alinhamento justificado à direita.
- **Descontos / Acréscimos**: Alinhamento justificado à direita.
- **Total Geral**:
  - Destaque com Negrito ativo (`ESC E 1`) e Altura Dupla (`GS ! 0x01` ou `0x10`).
  - Ex: `TOTAL:                                    R$ 1.300,00`
- **Forma de Pagamento / Parcelas**:
  - Ex: `PAGAMENTO:                           PIX (R$ 1.300,00)`
- **Fechamento**: Divisor duplo `================================================`.

### 3.5. Mensagem de Rodapé e Rastreabilidade (Footer Section)
- **Mensagem / Observações**: Centralizado.
- **Código de Barras / QR Code (Opcional)**: Centralizado.
- **Assinatura do Sistema**: `RAZAI INDUSTRIAL BRUTALIST` centralizado.
- **Fechamento**: Divisor simples `------------------------------------------------`.

### 3.6. Finalização e Corte (Finish & Cut)
- **Avanço de Papel**: 3 linhas em branco (`ESC d 3`) para ultrapassar a linha da cabeça térmica até a lâmina.
- **Comando de Guilhotina**: `GS V 66 0` (`1D 56 42 00`) — corte limpo.

---

## 4. Tabela de Comandos ESC/POS Implementados

| Ação | Código ESC/POS (Hex) | Função no TypeScript (`EscPosBuilder`) |
| :--- | :--- | :--- |
| **Inicializar** | `1B 40` | `.init()` |
| **Charset CP850** | `1B 74 02` | `.init()` (configurado internamente) |
| **Alinhar Esquerda** | `1B 61 00` | `.align('left')` |
| **Alinhar Centro** | `1B 61 01` | `.align('center')` |
| **Alinhar Direita** | `1B 61 02` | `.align('right')` |
| **Negrito On** | `1B 45 01` | `.bold(true)` |
| **Negrito Off** | `1B 45 00` | `.bold(false)` |
| **Tamanho Normal** | `1D 21 00` | `.size(1, 1)` |
| **Tamanho Dobrado (2x2)**| `1D 21 11` | `.size(2, 2)` |
| **Tamanho Altura Dupla** | `1D 21 01` | `.size(1, 2)` |
| **Divisor Simples** | Text: `"-" * 48` + `0A` | `.divider('-')` |
| **Divisor Duplo** | Text: `"=" * 48` + `0A` | `.divider('=')` |
| **Tabela 4 Colunas** | Text: `18c 6c 10c 11c` + `0A` | `.table4Columns(c1, c2, c3, c4)` |
| **Duas Colunas Justificadas** | Text: `left + spaces + right` + `0A` | `.twoColumns(left, right)` |
| **Avanço de Linhas** | `1B 64 [n]` | `.feed(n)` |
| **Corte de Guilhotina** | `1D 56 42 00` | `.cut()` |
| **Abrir Gaveta** | `1B 70 00 19 FA` | `.openDrawer()` |

---

## 5. Exemplo de Código para Geração do Recibo

```typescript
import { EscPosBuilder } from './escpos.builder'

export function gerarReciboVenda(venda: VendaData, printerName: string): Buffer {
  return new EscPosBuilder(48)
    .init()
    // 1. Cabeçalho
    .align('center')
    .size(2, 2)
    .bold(true)
    .line('RAZAI SISTEMA')
    .size(1, 1)
    .bold(false)
    .line('ENGENHARIA E GESTAO TEXTIL')
    .line('COMPROVANTE DE VENDA')
    .divider('=')

    // 2. Metadados
    .align('left')
    .twoColumns('ORDEM:', venda.codigo)
    .twoColumns('DATA/HORA:', venda.dataHora)
    .twoColumns('CLIENTE:', venda.clienteNome)
    .divider('-')

    // 3. Itens
    .bold(true)
    .table4Columns('ITEM / DESCRICAO', 'QTD', 'UNIT', 'TOTAL')
    .bold(false)
    .divider('-')
    ...venda.itens.map(item =>
      builder.table4Columns(item.nome, item.qtd, item.precoUnit, item.total)
    )
    .divider('-')

    // 4. Totais
    .bold(true)
    .twoColumns('SUBTOTAL:', venda.subtotal)
    .twoColumns('DESCONTO:', venda.desconto)
    .size(2, 1)
    .twoColumns('TOTAL:', venda.total)
    .size(1, 1)
    .bold(false)
    .divider('=')

    // 5. Rodapé
    .align('center')
    .line('Obrigado pela preferencia!')
    .divider('-')
    .line('RAZAI INDUSTRIAL BRUTALIST')

    // 6. Corte
    .cut()
    .toBuffer()
}
```

---

## 6. Regras de Manutenção do Layout

1. **Nunca ultrapassar 48 colunas**: Qualquer string somada (texto + espaços) deve ter tamanho `≤ 48`. Caracteres excedentes em tabelas devem ser truncados com `.slice(0, 18)`.
2. **Preservar os Divisores Industriais**: Usar `=` para delimitar grandes blocos (cabeçalho, totais) e `-` para separar seções internas (cabeçalhos de tabela, rodapés).
3. **Acentos em CP850**: Toda saída em texto deve passar pelo conversor de tabela `CP850` embutido no `EscPosBuilder` para garantir a impressão correta no Windows.
