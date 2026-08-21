# Product

<!-- impeccable:product-schema 1 -->

## Platform

Desktop local (Electron para Windows 10/11)

## Users

O usuário principal é o dono da loja. Ele usa o sistema para executar e organizar as rotinas cotidianas do negócio sem depender de múltiplas ferramentas dispersas.

## Product Purpose

O Razai Sistema reúne as rotinas de gestão e engenharia têxtil da loja em um único lugar, facilitando a operação diária e mantendo as informações organizadas e claras.

Sucesso significa permitir que o dono encontre, registre, acompanhe e execute as tarefas do negócio com menos carga cognitiva, sem perder as informações necessárias para tomar decisões ou operar os processos.

## Positioning

O mecanismo central do produto é consolidar, em uma aplicação local, o catálogo técnico de tecidos e cores, os produtos vendáveis, vendas, pedidos, relatórios, etiquetas Shopee e impressão operacional.

Uma posição competitiva ou promessa adicional não foi definida. Não inventar claims, métricas, clientes ou provas externas.

## Operating Context

- O produto é operado pelo dono da loja em Windows 10/11.
- As rotinas abrangem cadastro e engenharia de tecidos, cadastro de cores, vínculos entre tecido e cor, vendas, pedidos, relatórios, etiquetas Shopee, geração de documentos e impressão térmica.
- Os dados do negócio são persistidos localmente em SQLite e as integrações operacionais incluem impressoras térmicas.
- A interface e os conteúdos devem ser mantidos em português.

## Capabilities and Constraints

- A aplicação existente é um sistema desktop Electron com renderer Svelte 5, bridge IPC seguro e persistência SQLite local.
- O catálogo de tecidos preserva dados técnicos e cálculos de engenharia têxtil; cores preservam dados visuais e valores LAB/HEX.
- Vínculos geram produtos vendáveis e SKUs compostos; vendas e pedidos suportam acompanhamento, impressão e documentos.
- Relatórios cobrem indicadores, análises de vendas e previsibilidade de demanda e estoque.
- Etiquetas Shopee cobrem importação, OCR, revisão, impressão Zebra e geração de PDF de cortes.
- A integração de impressão térmica ESC/POS é parte do fluxo operacional; a Gertec G250W é uma impressora homologada no projeto.
- Reduzir carga cognitiva significa melhorar organização, hierarquia e clareza. Não significa esconder ou remover informações relevantes.
- A listagem de tecidos mantém um núcleo curto de identificação e oferece as métricas completas no detalhe, com ação explícita para acessá-las.
- Ordenação, contagem filtrada, feedback de operação e erros de exclusão devem ter comunicação visual e semântica equivalente.
- Checklists Shopee sem linhas reconhecidas precisam resultar em uma pendência editável antes de qualquer impressão.

## Brand Commitments

- Nome do produto: Razai Sistema.
- Marca: Razai.
- Comunicação e interface em português.

## Evidence on Hand

- Implementação existente em `src/main`, `src/preload`, `src/shared` e `src/renderer`.
- README e especificações de módulos em `README.md` e `docs/`.
- Integração de impressão ESC/POS e helper nativo do Windows no código do projeto.
- Não há depoimentos, benchmarks, clientes externos ou outras provas de marketing confirmadas; não fabricar esses elementos.

## Product Principles

1. Reunir as rotinas cotidianas em um fluxo operacional único.
2. Reduzir a carga cognitiva pela organização e pela clareza, não pela ocultação de informação.
3. Preservar os dados técnicos necessários para a operação têxtil e comercial.
4. Manter a operação prática, local e adequada ao dia a dia do dono da loja.
5. Comunicar ações, estados e informações em português claro.

## Accessibility & Inclusion

O usuário principal informa TDAH e uma forte necessidade de organização. Isso orienta uma interface com sequência previsível, compartimentos claros, alinhamento rigoroso e preservação explícita das informações.

Requisitos operacionais confirmados:

- Cabeçalhos de tabela ordenáveis comunicam o estado com `aria-sort` e funcionam por teclado.
- Seções de formulário usam `section`, `h2` e `aria-labelledby` para manter a hierarquia para leitores de tela.
- Dicas necessárias para operar uma tabela aparecem junto do conteúdo que orientam.
- Mensagens de sucesso e erro permanecem acionáveis até o ciclo ser concluído; erros destrutivos ficam no diálogo correspondente.
- Badges podem truncar visualmente, mas preservam o texto completo em uma descrição acessível.
