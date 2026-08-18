<script lang="ts">
  import Panel from '../../design-system/layout/Panel.svelte'
  import Stack from '../../design-system/layout/Stack.svelte'
  import Cell from '../../design-system/primitives/Cell.svelte'
  import Icon from '../../design-system/primitives/Icon.svelte'
  import Button from '../../design-system/controls/Button.svelte'
  import Table, { type Column } from '../../design-system/data-display/Table.svelte'
  import Badge from '../../design-system/data-display/Badge.svelte'
  import TecidosCadastroPage, { type NovoTecidoData } from './TecidosCadastroPage.svelte'

  type Tecido = {
    id: string
    codigo: string
    nome: string
    composicao: string
    gramatura: string
    largura: string
    fornecedor: string
    status: 'ativo' | 'inativo' | 'esgotado'
    rendimento?: string
    gramaturaLinear?: string
    tipo?: string
    transparencia?: string
    elasticidade?: string
    acabamento?: string
  }

  const columns: Column[] = [
    { key: 'codigo', label: 'Código', width: '110px' },
    { key: 'nome', label: 'Nome / Descrição' },
    { key: 'composicao', label: 'Composição' },
    { key: 'gramatura', label: 'Gramatura (g/m²)', width: '150px' },
    { key: 'largura', label: 'Largura', width: '110px' },
    { key: 'fornecedor', label: 'Fornecedor' },
    { key: 'status', label: 'Status', width: '110px', align: 'center' }
  ]

  let viewMode = $state<'list' | 'create'>('list')
  let searchTerm = $state('')
  let selectedTecido = $state<Tecido | null>(null)

  // Lista padrão inicial de tecidos cadastrados
  let tecidos = $state<Tecido[]>([
    {
      id: '1',
      codigo: 'TC-001',
      nome: 'Tricoline Lisa 100% Algodão',
      composicao: '100% Algodão',
      gramatura: '120 g/m²',
      largura: '1.50 m',
      fornecedor: 'Têxtil Santa Catarina',
      status: 'ativo',
      rendimento: '2.80 m/kg',
      gramaturaLinear: '180 g/m',
      tipo: 'liso',
      transparencia: 'nenhuma',
      elasticidade: 'nenhuma',
      acabamento: 'fosco'
    },
    {
      id: '2',
      codigo: 'TC-002',
      nome: 'Linho Puro Rústico',
      composicao: '100% Linho',
      gramatura: '240 g/m²',
      largura: '1.45 m',
      fornecedor: 'Fiação & Tecelagem Imperial',
      status: 'ativo',
      rendimento: '2.40 m/kg',
      gramaturaLinear: '348 g/m',
      tipo: 'liso',
      transparencia: 'baixa',
      elasticidade: 'nenhuma',
      acabamento: 'fosco'
    },
    {
      id: '3',
      codigo: 'TC-003',
      nome: 'Sarja Acetinada com Elastano',
      composicao: '97% Algodão / 3% Elastano',
      gramatura: '260 g/m²',
      largura: '1.60 m',
      fornecedor: 'Vicunha Têxtil',
      status: 'ativo',
      rendimento: '2.10 m/kg',
      gramaturaLinear: '416 g/m',
      tipo: 'liso',
      transparencia: 'nenhuma',
      elasticidade: 'baixa',
      acabamento: 'semi_brilho'
    },
    {
      id: '4',
      codigo: 'TC-004',
      nome: 'Crepe Georgette Premium',
      composicao: '100% Poliéster',
      gramatura: '85 g/m²',
      largura: '1.40 m',
      fornecedor: 'Tecidos Finos Aurora',
      status: 'esgotado',
      rendimento: '8.40 m/kg',
      gramaturaLinear: '119 g/m',
      tipo: 'estampado',
      transparencia: 'alta',
      elasticidade: 'nenhuma',
      acabamento: 'semi_brilho'
    },
    {
      id: '5',
      codigo: 'TC-005',
      nome: 'Viscose Sarjada',
      composicao: '100% Viscose',
      gramatura: '165 g/m²',
      largura: '1.48 m',
      fornecedor: 'Malharia Sul',
      status: 'ativo',
      rendimento: '4.10 m/kg',
      gramaturaLinear: '244 g/m',
      tipo: 'liso',
      transparencia: 'baixa',
      elasticidade: 'nenhuma',
      acabamento: 'fosco'
    },
    {
      id: '6',
      codigo: 'TC-006',
      nome: 'Jeans Denim Pesado 12oz',
      composicao: '98% Algodão / 2% Elastano',
      gramatura: '380 g/m²',
      largura: '1.65 m',
      fornecedor: 'Santana Textiles',
      status: 'inativo',
      rendimento: '1.60 m/kg',
      gramaturaLinear: '627 g/m',
      tipo: 'liso',
      transparencia: 'nenhuma',
      elasticidade: 'baixa',
      acabamento: 'fosco'
    }
  ])

  let filteredTecidos = $derived(
    tecidos.filter((item) => {
      if (!searchTerm.trim()) return true
      const term = searchTerm.toLowerCase()
      return (
        item.codigo.toLowerCase().includes(term) ||
        item.nome.toLowerCase().includes(term) ||
        item.composicao.toLowerCase().includes(term) ||
        item.fornecedor.toLowerCase().includes(term)
      )
    })
  )

  function handleNovoTecido(novo: NovoTecidoData) {
    const nextNum = tecidos.length + 1
    const padNum = String(nextNum).padStart(3, '0')
    const novoItem: Tecido = {
      id: String(Date.now()),
      codigo: `TC-${padNum}`,
      nome: novo.nome,
      composicao: novo.composicao || '—',
      gramatura: novo.gramaturaM2 ? `${novo.gramaturaM2} g/m²` : '—',
      largura: novo.largura ? `${novo.largura} m` : '—',
      fornecedor: 'Padrão Local',
      status: 'ativo',
      rendimento: novo.rendimento ? `${novo.rendimento} m/kg` : undefined,
      gramaturaLinear: novo.gramaturaLinear ? `${novo.gramaturaLinear} g/m` : undefined,
      tipo: novo.tipo || undefined,
      transparencia: novo.transparencia || undefined,
      elasticidade: novo.elasticidade || undefined,
      acabamento: novo.acabamento || undefined
    }

    tecidos = [novoItem, ...tecidos]
    selectedTecido = novoItem
    viewMode = 'list'
  }

  function getStatusTone(status: Tecido['status']): 'ok' | 'warn' | 'danger' {
    if (status === 'ativo') return 'ok'
    if (status === 'esgotado') return 'warn'
    return 'danger'
  }

  function getStatusLabel(status: Tecido['status']): string {
    if (status === 'ativo') return 'Ativo'
    if (status === 'esgotado') return 'Esgotado'
    return 'Inativo'
  }
</script>

{#if viewMode === 'create'}
  <TecidosCadastroPage
    oncancel={() => (viewMode = 'list')}
    onsave={handleNovoTecido}
  />
{:else}
  <div class="page">
    <Panel title="Tecidos" flush>
      {#snippet actions()}
        <Button variant="primary" size="sm" onclick={() => (viewMode = 'create')}>
          <Icon name="plus" size="sm" />
          <span>Cadastrar Tecido</span>
        </Button>
      {/snippet}

      <div class="layout">
        <!-- Barra superior de ferramentas / busca / contadores -->
        <div class="toolbar">
          <div class="search-box">
            <Icon name="search" size="sm" />
            <input
              type="text"
              class="search-input"
              bind:value={searchTerm}
              placeholder="Buscar por código, nome, composição ou fornecedor..."
            />
            {#if searchTerm}
              <button class="clear-btn" onclick={() => (searchTerm = '')} aria-label="Limpar busca">
                ✕
              </button>
            {/if}
          </div>
          <div class="toolbar-meta">
            <Badge text={`${filteredTecidos.length} de ${tecidos.length} itens`} tone="neutral" />
          </div>
        </div>

        <!-- Tabela padrão de itens -->
        <div class="table-container">
          <Table
            {columns}
            rows={filteredTecidos}
            bordered={false}
            emptyMessage="Nenhum tecido encontrado para os critérios de busca."
            onrowclick={(row) => (selectedTecido = row as Tecido)}
          >
            {#snippet cell({ row, column, value })}
              {#if column.key === 'codigo'}
                <span class="code">{value}</span>
              {:else if column.key === 'status'}
                <Badge text={getStatusLabel(value)} tone={getStatusTone(value)} />
              {:else if column.key === 'nome'}
                <span class="fabric-name">{value}</span>
              {:else}
                <span>{value ?? '—'}</span>
              {/if}
            {/snippet}
          </Table>
        </div>

        <!-- Barra de rodapé informativa -->
        <footer class="footer">
          <span class="footer-note">Pressione um item da tabela para visualizar detalhes</span>
          {#if selectedTecido}
            <span class="footer-selected">
              Selecionado: <strong>{selectedTecido.codigo} — {selectedTecido.nome}</strong>
            </span>
          {/if}
        </footer>
      </div>
    </Panel>
  </div>
{/if}

<style>
  .page {
    height: 100%;
    min-height: 0;
    display: grid;
  }

  .page :global(.panel) {
    height: 100%;
    min-height: 0;
  }

  .layout {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }

  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-3);
    background: var(--color-bg-sunken);
    border-bottom: var(--border-width) solid var(--color-border);
  }

  .search-box {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex: 1;
    max-width: 460px;
    padding: var(--space-1) var(--space-2);
    border: var(--border-width) solid var(--color-border);
    background: var(--color-bg);
    color: var(--color-fg-muted);
  }

  .search-box:focus-within {
    border-color: var(--color-border-strong);
    color: var(--color-fg);
  }

  .search-input {
    width: 100%;
    border: none;
    background: transparent;
    color: var(--color-fg);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    outline: none;
  }

  .search-input::placeholder {
    color: var(--color-fg-dim);
  }

  .clear-btn {
    border: none;
    background: transparent;
    color: var(--color-fg-dim);
    font-size: var(--text-xs);
    padding: 0 var(--space-1);
    cursor: pointer;
  }

  .clear-btn:hover {
    color: var(--color-fg);
  }

  .toolbar-meta {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .table-container {
    flex: 1;
    min-height: 0;
    overflow: auto;
    background: var(--color-bg);
  }

  .code {
    font-weight: 600;
    color: var(--color-accent);
    letter-spacing: var(--tracking-tight);
  }

  .fabric-name {
    color: var(--color-fg);
  }

  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-3);
    border-top: var(--border-width) solid var(--color-border);
    background: var(--color-bg-elevated);
    font-size: var(--text-xs);
    color: var(--color-fg-dim);
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
  }

  .footer-selected strong {
    color: var(--color-fg);
  }
</style>
