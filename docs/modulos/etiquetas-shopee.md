# Módulo Shopee / Etiquetas — OCR, Revisão e Impressão

Este documento descreve o fluxo local de importação, validação, revisão e impressão de etiquetas Shopee. A tela fica na rota `#shopee/etiquetas` e usa o bridge `window.razai.shopee.etiquetas` para acessar os serviços do processo principal.

## 1. Objetivo e entrada

O módulo recebe arquivos ZIP ou ZPL, organiza cada lote, extrai pedidos e linhas de corte, permite revisão manual e produz os artefatos operacionais:

- impressão ZPL em impressora Zebra configurada no spooler do Windows;
- PDF consolidado de cortes;
- histórico local de lotes, documentos, páginas e linhas;
- memória de correções exatas e equivalências de tecido, cor e SKU.

O processamento permanece local. O renderer não acessa SQLite nem caminhos de arquivos diretamente; todas as operações passam pelo preload e pelos handlers IPC.

## 2. Ciclo de vida do lote

| Estado | Significado | Próxima ação possível |
| --- | --- | --- |
| `recebido` | Arquivos aceitos e aguardando processamento | Acompanhar extração |
| `extraindo` | OCR, parsing e normalização em andamento | Aguardar progresso |
| `revisao` | Há linhas ou estrutura que precisam de confirmação | Corrigir itens e retomar |
| `pronto` / `imprimindo` | Lote validado e encaminhado para saída | Acompanhar impressão |
| `impressao_pendente` | A impressão não terminou com confirmação | Imprimir pendentes |
| `impressao_incerta` | A aplicação foi interrompida ou não confirmou a saída | Reimprimir ou confirmar como impresso |
| `gerando_pdf` / `pdf_pendente` | PDF em geração ou aguardando nova tentativa | Gerar PDF novamente |
| `concluido` | Impressão e PDF concluídos | Abrir o PDF ou consultar histórico |
| `falhou` | Falha operacional registrada | Corrigir a causa ou excluir o lote quando permitido |

Estados de impressão não são tratados como sucesso silencioso. A tela mantém a mensagem e oferece a ação de recuperação correspondente.

## 3. Extração e validação

### 3.1 Pedidos e posição do OCR

O extrator procura o identificador do pedido em linhas do cabeçalho da página, agrupando palavras pela posição vertical antes de aplicar os padrões de texto. A busca prioriza os 45% superiores da imagem e mantém fallback para o texto OCR completo.

Isso evita depender apenas de uma sequência linear do OCR quando o layout visual da etiqueta separa o rótulo (`Pedido`, `ID do pedido` ou equivalente) do valor.

### 3.2 Checklist sem linhas reconhecidas

Quando uma página do tipo `checklist` não produz nenhuma linha, o serviço materializa uma linha de revisão em vez de deixar o lote parecer completo:

1. cria um item editável com os dados disponíveis e quantidade padrão `1`;
2. marca a linha com `reviewRequired` e explica que a checklist não teve linhas reconhecidas;
3. usa a página inteira como origem visual quando a página tem rasterização disponível;
4. bloqueia a retomada até a correção ser salva;
5. aproveita uma correção exata previamente memorizada quando a combinação de documento, página e linha for conhecida.

Assim, uma checklist vazia continua rastreável e exige confirmação humana antes da impressão.

### 3.3 Confiança, memória e equivalências

Cada item registra a origem da validação: `ocr`, `exact_memory`, `equivalence`, `safe_rule`, `manual` ou `legacy`. Correções podem memorizar tecido, cor, SKU ou a combinação exata do documento. Equivalências normalizam novos textos recebidos sem apagar os valores brutos usados para auditoria.

## 4. Revisão com origem

Itens pendentes aparecem no painel **Revisão obrigatória**. A ação **Ver origem** retorna uma imagem PNG em base64 com o retângulo da linha destacada, sem expor o caminho absoluto do arquivo ou o ZPL bruto ao renderer.

Quando a origem não pode ser exibida, a API informa a razão operacional:

- `reimport_required`: o lote precisa ser reimportado para recuperar a origem;
- `text_source`: o documento só possui fonte textual;
- `file_expired`: o arquivo original expirou.

Salvar uma correção atualiza a linha, remove a pendência quando todos os dados obrigatórios estão completos e captura uma amostra de treinamento local quando possível.

## 5. Ações e recuperação

- **Retomar lote:** disponível somente quando não há revisão de item nem falha estrutural de páginas.
- **Imprimir pendentes:** disponível para estados de impressão pendente ou incerta sem revisão restante.
- **Confirmar como impresso:** encerra uma impressão incerta quando a saída física foi verificada pelo operador.
- **Gerar PDF novamente:** repete somente a etapa do PDF pendente.
- **Abrir PDF:** abre o artefato já gerado pelo helper nativo.
- **Excluir lote:** exige confirmação e mantém o erro dentro do diálogo quando a exclusão falha.

Mensagens de ação ficam próximas ao painel do lote selecionado. A troca de lote limpa mensagens transitórias para que o operador não associe uma resposta ao lote errado.

## 6. Persistência e limites de integração

Os handlers IPC de listagem, consulta e ações usam `ShopeeEtiquetasJobService`, que reconcilia lotes em revisão antes de devolvê-los ao renderer. Isso materializa checklists vazias e atualiza contadores mesmo quando o lote foi criado por uma execução anterior.

O banco local mantém documentos, páginas, itens, estados de impressão, motivos de revisão, correções e equivalências. A pasta operacional fica sob o diretório de dados do usuário em `shopee/etiquetas`; amostras de treinamento ficam em `shopee/etiquetas/treinamento`.

## 7. Impressão e saída

O módulo usa a impressora Zebra configurada no Windows em modo RAW/ZPL, separado da integração ESC/POS de recibos. O PDF de cortes é uma saída consolidada e pode ser regenerado sem reprocessar o OCR quando o lote já possui os itens normalizados.

## 8. Validação automatizada

Os fluxos relevantes são cobertos por testes unitários e E2E, sempre com banco e diretórios temporários isolados:

- `tests/unit/shopee-etiquetas.test.ts`: parsing, normalização, revisão, origem, memória, exclusão e retry;
- `tests/e2e/shopee-empty-checklist-review.spec.ts`: checklist vazia, revisão, origem e persistência da correção;
- `tests/e2e/shopee-source-preview.spec.ts`: preview OCR, correção manual, amostra e reimportação com memória exata;
- `tests/e2e/shopee-review-layout.spec.ts`: separação geométrica dos painéis de revisão, histórico e equivalências.

Nenhum teste deve usar o SQLite de desenvolvimento ou produção.
