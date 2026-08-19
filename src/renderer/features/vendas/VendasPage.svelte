<script lang="ts">
  import Icon from '../../design-system/primitives/Icon.svelte'
  import Badge from '../../design-system/data-display/Badge.svelte'
  import Button from '../../design-system/controls/Button.svelte'
  import EmptyState from '../../design-system/compositions/EmptyState.svelte'
  import Table, { type Column } from '../../design-system/data-display/Table.svelte'
  import VendasLancamentoPage from './VendasLancamentoPage.svelte'
  import VendaConfirmacaoPage from './VendaConfirmacaoPage.svelte'
  import { router } from '../../shell/router.svelte'
  import type { VendaRecord, CreateVendaInput } from '../../../shared/types'

  let viewMode = $derived.by<'list' | 'create' | 'confirm'>(() => {
    if (router.route !== 'vendas') return 'list'
    if (router.subRoute === 'novo') return 'create'
    if (router.subRoute.startsWith('confirmacao')) return 'confirm'
    return 'list'
  })

  let searchTerm = $state('')
  let debouncedSearch = $state('')
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  let vendas = $state<VendaRecord[]>([])
  let selectedVenda = $state<VendaRecord | null>(null)
  let isLoading = $state(true)
  let errorMsg = $state<string | null>(null)

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

  async function loadVendas(query = '') {
    isLoading = true
    errorMsg = null
    try {
      if (typeof window !== 'undefined' && window.razai?.vendas) {
        vendas = await window.razai.vendas.list(query)
      }
    } catch (err: any) {
      console.error('Erro ao carregar vendas:', err)
      errorMsg = err?.message || 'Falha ao carregar vendas do banco de dados.'
    } finally {
      isLoading = false
    }
  }

  $effect(() => {
    if (viewMode === 'list') {
      loadVendas(debouncedSearch)
    } else if (viewMode === 'confirm') {
      const parts = router.subRoute.split('/')
      const vendaId = parts[1]
      if (vendaId && (!selectedVenda || selectedVenda.id !== vendaId)) {
        if (typeof window !== 'undefined' && window.razai?.vendas) {
          window.razai.vendas.getById(vendaId).then((v) => {
            if (v) selectedVenda = v
          })
        }
      }
    }
  })

  const formatCurrency = (val: number) =>
    `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const columns: Column[] = [
    { key: 'numero', label: '# Venda', width: '110px' },
    { key: 'createdAt', label: 'Data/Hora', width: '160px' },
    { key: 'clienteNome', label: 'Cliente' },
    { key: 'itensCount', label: 'Itens', width: '90px', align: 'center' },
    { key: 'quantidadeTotal', label: 'Metragem', width: '110px', align: 'right' },
    { key: 'formaPagamento', label: 'Pagamento', width: '140px' },
    { key: 'valorTotal', label: 'Valor Total', width: '140px', align: 'right' },
    { key: 'actions', label: 'Ações', width: '120px', align: 'center' }
  ]

  async function handleSalvarVenda(input: CreateVendaInput) {
    try {
      if (typeof window !== 'undefined' && window.razai?.vendas) {
        const created = await window.razai.vendas.create(input)
        selectedVenda = created
        // Dispara o envio ao spooler térmico de 80mm de forma assíncrona (não-bloqueante)
        window.razai.vendas.imprimirCupom(created.id).catch((printErr) => {
          console.error('Falha ao comunicar com spooler da impressora:', printErr)
        })
        router.navigate(`vendas/confirmacao/${created.id}`)
      }
    } catch (err: any) {
      console.error('Erro ao salvar venda:', err)
      throw err
    }
  }

  async function handleReimprimir(vendaId: string) {
    if (typeof window !== 'undefined' && window.razai?.vendas) {
      await window.razai.vendas.imprimirCupom(vendaId)
    }
  }

  async function handleExcluir(id: string, numero: number) {
    if (!confirm(`Deseja realmente excluir a venda #VEN-${String(numero).padStart(4, '0')}?`)) {
      return
    }
    try {
      if (typeof window !== 'undefined' && window.razai?.vendas) {
        await window.razai.vendas.delete(id)
      }
      await loadVendas(debouncedSearch)
    } catch (err: any) {
      console.error('Erro ao excluir venda:', err)
      alert(err?.message || 'Erro ao excluir venda.')
    }
  }

  let totalFaturado = $derived(
    vendas.reduce((acc, v) => acc + v.valorTotal, 0)
  )

  let totalMetrosVendidos = $derived(
    vendas.reduce((acc, v) => acc + v.quantidadeTotal, 0)
  )
</script>

{#if viewMode === 'create'}
  <VendasLancamentoPage
    oncancel={() => router.navigate('vendas')}
    onsave={handleSalvarVenda}
  />
{:else if viewMode === 'confirm'}
  {#if selectedVenda}
    <VendaConfirmacaoPage
      venda={selectedVenda}
      onback={() => router.navigate('vendas')}
      onreprint={() => handleReimprimir(selectedVenda!.id)}
    />
  {:else}
    <div class="empty-wrap">
      <Badge text="Carregando comprovante..." tone="neutral" />
    </div>
  {/if}
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
            placeholder="Buscar por número da venda (#VEN-0001), cliente, SKU ou tecido..."
          />
          {#if searchTerm}
            <button class="clear-btn" onclick={() => (searchTerm = '')} aria-label="Limpar busca">
              ✕
            </button>
          {/if}
        </div>

        <div class="toolbar-meta">
          {#if errorMsg}
            <Badge text={errorMsg} tone="danger" />
          {:else if isLoading}
            <Badge text="Carregando..." tone="neutral" />
          {:else}
            <Badge text={`${vendas.length} vendas realizadas`} tone="neutral" />
            <Badge text={`${totalMetrosVendidos.toFixed(2).replace('.', ',')} m comercializados`} tone="neutral" />
            <Badge text={`Faturamento: ${formatCurrency(totalFaturado)}`} tone="ok" />
          {/if}
        </div>
      </div>

      <!-- CORPO DA TABELA -->
      <div class="table-area">
        {#if vendas.length === 0 && !isLoading}
          <div class="empty-wrap">
            <EmptyState
              title="Nenhuma venda registrada"
              description="Inicie um novo lançamento com 3 colunas para registrar a saída de tecidos e emitir o cupom térmico."
              actionLabel="+ Registrar Primeira Venda"
              actionIcon="plus"
              onaction={() => router.navigate('vendas/novo')}
            />
          </div>
        {:else}
          <Table {columns} rows={vendas} bordered={false} emptyMessage="Nenhuma venda encontrada.">
            {#snippet cell({ row, column, value })}
              {#if column.key === 'numero'}
                <span class="mono-num">#VEN-{String(value).padStart(4, '0')}</span>
              {:else if column.key === 'createdAt'}
                <span class="mono-date">{new Date(value).toLocaleString('pt-BR')}</span>
              {:else if column.key === 'clienteNome'}
                <span class="cliente-name">{value || 'Consumidor Final / Balcão'}</span>
              {:else if column.key === 'itensCount'}
                <Badge text={`${value} itens`} tone="neutral" />
              {:else if column.key === 'quantidadeTotal'}
                <span class="mono-val">{Number(value).toFixed(2).replace('.', ',')} m</span>
              {:else if column.key === 'formaPagamento'}
                <span class="forma-tag">{value || '—'}</span>
              {:else if column.key === 'valorTotal'}
                <span class="mono-price">{formatCurrency(Number(value))}</span>
              {:else if column.key === 'actions'}
                <div class="actions-group">
                  <button
                    type="button"
                    class="action-btn"
                    onclick={() => handleReimprimir(row.id)}
                    title="Reimprimir Cupom Térmico (80mm)"
                  >
                    <Icon name="settings" size="sm" />
                  </button>
                  <button
                    type="button"
                    class="action-btn"
                    onclick={() => router.navigate(`vendas/confirmacao/${row.id}`)}
                    title="Visualizar Comprovante"
                  >
                    <Icon name="search" size="sm" />
                  </button>
                  <button
                    type="button"
                    class="action-btn danger"
                    onclick={() => handleExcluir(row.id, row.numero)}
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

  .mono-num {
    font-family: var(--font-mono);
    font-weight: 700;
    color: var(--color-accent);
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

  .forma-tag {
    font-size: 11px;
    color: var(--color-fg-dim);
    font-family: var(--font-mono);
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

  .action-btn.danger:hover {
    border-color: var(--color-danger);
    color: var(--color-danger);
    background: var(--color-bg-sunken);
  }
</style>
