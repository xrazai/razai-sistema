<script lang="ts">
  import Icon from '../../design-system/primitives/Icon.svelte'
  import Badge from '../../design-system/data-display/Badge.svelte'
  import Button from '../../design-system/controls/Button.svelte'
  import EmptyState from '../../design-system/compositions/EmptyState.svelte'
  import Table, { type Column } from '../../design-system/data-display/Table.svelte'
  import PedidosLancamentoPage from './PedidosLancamentoPage.svelte'
  import PedidosDetalhesPage from './PedidosDetalhesPage.svelte'
  import { router } from '../../shell/router.svelte'
  import { sharePedidoPdf } from './sharePedidoPdf'
  import type { PedidoRecord, CreatePedidoInput, UpdatePedidoInput } from '../../../shared/types'

  let viewMode = $derived.by<'list' | 'create' | 'details'>(() => {
    if (router.route !== 'pedidos') return 'list'
    if (router.subRoute === 'novo') return 'create'
    if (router.subRoute && router.subRoute !== '') return 'details'
    return 'list'
  })

  let searchTerm = $state('')
  let debouncedSearch = $state('')
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  let pedidos = $state<PedidoRecord[]>([])
  let selectedPedido = $state<PedidoRecord | null>(null)
  let isLoading = $state(true)
  let errorMsg = $state<string | null>(null)
  let notification = $state<string | null>(null)

  $effect(() => {
    const term = searchTerm
    if (!term) {
      if (debounceTimer) clearTimeout(debounceTimer)
      debouncedSearch = ''
      return
    }
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      debouncedSearch = term
    }, 200)
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer)
    }
  })

  async function loadPedidos(query = '') {
    isLoading = true
    errorMsg = null
    try {
      if (typeof window !== 'undefined' && window.razai?.pedidos) {
        pedidos = await window.razai.pedidos.list(query)
      }
    } catch (err: any) {
      console.error('Erro ao carregar pedidos:', err)
      errorMsg = err?.message || 'Falha ao carregar pedidos do banco de dados.'
    } finally {
      isLoading = false
    }
  }

  $effect(() => {
    if (viewMode === 'list') {
      loadPedidos(debouncedSearch)
    } else if (viewMode === 'details') {
      const pedidoId = router.subRoute
      if (pedidoId && (!selectedPedido || selectedPedido.id !== pedidoId)) {
        if (typeof window !== 'undefined' && window.razai?.pedidos) {
          window.razai.pedidos.getById(pedidoId).then((p) => {
            if (p) selectedPedido = p
          })
        }
      }
    }
  })

  const formatCurrency = (val: number) =>
    `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const columns: Column[] = [
    { key: 'numero', label: '# Pedido', width: '110px' },
    { key: 'createdAt', label: 'Data/Hora', width: '160px' },
    { key: 'status', label: 'Status', width: '120px', align: 'center' },
    { key: 'clienteNome', label: 'Cliente' },
    { key: 'itensCount', label: 'Itens', width: '90px', align: 'center' },
    { key: 'quantidadeTotal', label: 'Quantidade', width: '110px', align: 'right' },
    { key: 'valorTotal', label: 'Valor Total', width: '140px', align: 'right' },
    { key: 'actions', label: 'Ações', width: '160px', align: 'center' }
  ]

  async function handleSalvarNovoPedido(input: CreatePedidoInput, sharePdf = false) {
    try {
      if (typeof window !== 'undefined' && window.razai?.pedidos) {
        const created = await window.razai.pedidos.create(input)
        if (sharePdf) {
          try {
            await sharePedidoPdf(created.id)
          } catch (pdfErr: any) {
            console.error('Erro ao compartilhar PDF:', pdfErr)
            notification = pdfErr?.message || 'Pedido salvo, mas o compartilhamento do PDF falhou.'
            setTimeout(() => {
              notification = null
            }, 4000)
          }
        }
        router.navigate('pedidos')
        await loadPedidos(debouncedSearch)
      }
    } catch (err: any) {
      console.error('Erro ao salvar pedido:', err)
      throw err
    }
  }

  async function handleUpdatePedido(id: string, input: UpdatePedidoInput) {
    try {
      if (typeof window !== 'undefined' && window.razai?.pedidos) {
        const updated = await window.razai.pedidos.update(id, input)
        selectedPedido = updated
        await loadPedidos(debouncedSearch)
      }
    } catch (err: any) {
      console.error('Erro ao atualizar pedido:', err)
      throw err
    }
  }

  async function handleAprovarPedido(id: string) {
    try {
      if (typeof window !== 'undefined' && window.razai?.pedidos) {
        const res = await window.razai.pedidos.aprovar(id)
        notification = `Pedido #${res.pedido.numero} aprovado com sucesso e convertido em Venda #${res.venda.numero}!`
        setTimeout(() => {
          notification = null
        }, 4000)
        await loadPedidos(debouncedSearch)
        router.navigate('pedidos')
      }
    } catch (err: any) {
      console.error('Erro ao aprovar pedido:', err)
      alert(err?.message || 'Erro ao aprovar pedido.')
    }
  }

  async function handleSharePdf(id: string) {
    await sharePedidoPdf(id)
  }

  async function handleExcluirPedido(id: string) {
    try {
      if (typeof window !== 'undefined' && window.razai?.pedidos) {
        await window.razai.pedidos.delete(id)
      }
      router.navigate('pedidos')
      await loadPedidos(debouncedSearch)
    } catch (err: any) {
      console.error('Erro ao excluir pedido:', err)
      alert(err?.message || 'Erro ao excluir pedido.')
    }
  }

  let totalPendente = $derived(
    pedidos.filter((p) => p.status === 'pendente').reduce((acc, p) => acc + p.valorTotal, 0)
  )

  let pedidosPendentesCount = $derived(
    pedidos.filter((p) => p.status === 'pendente').length
  )
</script>

{#if viewMode === 'create'}
  <PedidosLancamentoPage
    oncancel={() => router.navigate('pedidos')}
    onsave={handleSalvarNovoPedido}
  />
{:else if viewMode === 'details' && selectedPedido}
  <PedidosDetalhesPage
    pedido={selectedPedido}
    onback={() => router.navigate('pedidos')}
    onsave={handleUpdatePedido}
    ondelete={handleExcluirPedido}
    onaprovar={handleAprovarPedido}
    onshare={handleSharePdf}
  />
{:else}
  <div class="page">
    <div class="layout">
      <!-- BARRA DE FERRAMENTAS / BUSCA -->
      <div class="toolbar">
        <div class="search-box">
          <Icon name="search" size="sm" />
          <input
            type="text"
            class="search-input"
            bind:value={searchTerm}
            placeholder="Buscar por número (#PED-0001), cliente, status, SKU..."
          />
          {#if searchTerm}
            <button class="clear-btn" onclick={() => (searchTerm = '')} aria-label="Limpar busca">
              ✕
            </button>
          {/if}
        </div>

        <div class="toolbar-meta">
          {#if notification}
            <Badge text={notification} tone="ok" />
          {:else if errorMsg}
            <Badge text={errorMsg} tone="danger" />
          {:else if isLoading}
            <Badge text="Carregando..." tone="neutral" />
          {:else}
            <Badge text={`${pedidos.length} pedidos no histórico`} tone="neutral" />
            <Badge text={`${pedidosPendentesCount} pedidos pendentes`} tone="warn" />
            <Badge text={`Em Aberto: ${formatCurrency(totalPendente)}`} tone="ok" />
          {/if}
        </div>
      </div>

      <!-- CORPO DA TABELA -->
      <div class="table-area">
        {#if pedidos.length === 0 && !isLoading}
          <div class="empty-wrap">
            <EmptyState
              title="Nenhum pedido registrado"
              description="Cadastre pedidos de clientes em 3 colunas, gere PDFs técnicos para WhatsApp e converta em vendas com 1 clique."
              actionLabel="+ Registrar Primeiro Pedido"
              actionIcon="plus"
              onaction={() => router.navigate('pedidos/novo')}
            />
          </div>
        {:else}
          <Table {columns} rows={pedidos} bordered={false} emptyMessage="Nenhum pedido encontrado.">
            {#snippet cell({ row, column, value })}
              {#if column.key === 'numero'}
                <button
                  type="button"
                  class="link-btn mono-num"
                  onclick={() => router.navigate(`pedidos/${row.id}`)}
                >
                  #PED-{String(value).padStart(4, '0')}
                </button>
              {:else if column.key === 'createdAt'}
                <span class="mono-date">{new Date(value).toLocaleString('pt-BR')}</span>
              {:else if column.key === 'status'}
                <Badge
                  text={value.toUpperCase()}
                  tone={value === 'aprovado' ? 'ok' : value === 'cancelado' ? 'danger' : 'warn'}
                />
              {:else if column.key === 'clienteNome'}
                <span class="cliente-name">{value || 'Consumidor / Balcão'}</span>
              {:else if column.key === 'itensCount'}
                <Badge text={`${value} itens`} tone="neutral" />
              {:else if column.key === 'quantidadeTotal'}
                <span class="mono-val">{Number(value).toFixed(2).replace('.', ',')}</span>
              {:else if column.key === 'valorTotal'}
                <span class="mono-price">{formatCurrency(Number(value))}</span>
              {:else if column.key === 'actions'}
                <div class="actions-group">
                  <button
                    type="button"
                    class="action-btn"
                    onclick={() => {
                      handleSharePdf(row.id).catch((err) => {
                        console.error('Erro ao compartilhar PDF:', err)
                        errorMsg = err?.message || 'Erro ao gerar e compartilhar PDF.'
                      })
                    }}
                    title="Compartilhar PDF (WhatsApp)"
                  >
                    <Icon name="copy" size="sm" />
                  </button>

                  {#if row.status === 'pendente'}
                    <button
                      type="button"
                      class="action-btn success"
                      onclick={() => handleAprovarPedido(row.id)}
                      title="Aprovar e Converter em Venda"
                    >
                      <Icon name="check" size="sm" />
                    </button>
                  {/if}

                  <button
                    type="button"
                    class="action-btn"
                    onclick={() => router.navigate(`pedidos/${row.id}`)}
                    title="Editar / Ver Detalhes"
                  >
                    <Icon name="settings" size="sm" />
                  </button>

                  <button
                    type="button"
                    class="action-btn danger"
                    onclick={() => {
                      if (confirm(`Excluir o pedido #PED-${String(row.numero).padStart(4, '0')}?`)) {
                        handleExcluirPedido(row.id)
                      }
                    }}
                    title="Excluir Registro"
                  >
                    ✕
                  </button>
                </div>
              {/if}
            {/snippet}
          </Table>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .page {
    height: 100%;
    min-height: 0;
    display: grid;
  }

  .layout {
    display: grid;
    grid-template-rows: 40px 1fr;
    height: 100%;
    min-height: 0;
  }

  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 40px;
    padding: 0 var(--space-3);
    background: var(--color-bg-elevated);
    box-shadow: inset 0 -1px 0 0 var(--color-border);
    box-sizing: border-box;
    gap: var(--space-3);
  }

  .search-box {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex: 1;
    max-width: 520px;
  }

  .search-input {
    width: 100%;
    background: transparent;
    border: none;
    outline: none;
    color: var(--color-fg);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    line-height: 100%;
  }

  .search-input::placeholder {
    color: var(--color-fg-dim);
  }

  .clear-btn {
    background: transparent;
    border: none;
    color: var(--color-fg-muted);
    cursor: pointer;
    font-size: 11px;
    padding: 2px 4px;
    line-height: 100%;
  }

  .toolbar-meta {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .table-area {
    height: 100%;
    min-height: 0;
    overflow: auto;
    background: var(--color-bg);
  }

  .empty-wrap {
    height: 100%;
    display: grid;
  }

  .link-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    padding: 0;
  }

  .mono-num {
    font-family: var(--font-mono);
    font-weight: 700;
    color: var(--color-accent);
  }

  .link-btn.mono-num:hover {
    text-decoration: underline;
  }

  .mono-date {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-fg-muted);
  }

  .cliente-name {
    font-weight: 500;
    color: var(--color-fg);
  }

  .mono-val {
    font-family: var(--font-mono);
    color: var(--color-fg);
  }

  .mono-price {
    font-family: var(--font-mono);
    font-weight: 700;
    color: var(--color-fg);
  }

  .actions-group {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
  }

  .action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: transparent;
    border: 1px solid var(--color-border);
    color: var(--color-fg-muted);
    cursor: pointer;
    transition: all var(--motion-fast);
  }

  .action-btn:hover {
    border-color: var(--color-fg);
    color: var(--color-fg);
    background: var(--color-bg-elevated);
  }

  .action-btn.success:hover {
    border-color: var(--color-ok);
    color: var(--color-ok);
    background: var(--color-bg-sunken);
  }

  .action-btn.danger:hover {
    border-color: var(--color-danger);
    color: var(--color-danger);
    background: var(--color-bg-sunken);
  }
</style>
