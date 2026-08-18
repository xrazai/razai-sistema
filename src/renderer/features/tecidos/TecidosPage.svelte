<script lang="ts">
  import Panel from '../../design-system/layout/Panel.svelte'
  import Stack from '../../design-system/layout/Stack.svelte'
  import Cell from '../../design-system/primitives/Cell.svelte'
  import Icon from '../../design-system/primitives/Icon.svelte'
  import Button from '../../design-system/controls/Button.svelte'
  import Table, { type Column } from '../../design-system/data-display/Table.svelte'
  import Badge from '../../design-system/data-display/Badge.svelte'
  import TecidosCadastroPage, { type NovoTecidoData } from './TecidosCadastroPage.svelte'
  import TecidosDetalhesPage, { type Tecido } from './TecidosDetalhesPage.svelte'
  import { generateTecidoSku } from './utils'

  const columns: Column[] = [
    { key: 'codigo', label: 'SKU', width: '90px' },
    { key: 'nome', label: 'Nome' },
    { key: 'composicao', label: 'Composição' },
    { key: 'largura', label: 'Largura (m)', width: '120px' },
    { key: 'rendimento', label: 'Rendimento (m/kg)', width: '150px' },
    { key: 'gramaturaLinear', label: 'Gramatura Linear (g/m)', width: '170px' },
    { key: 'gramaturaM2', label: 'Gramatura (g/m²)', width: '150px' },
    { key: 'tipo', label: 'Tipo', width: '110px' },
    { key: 'acabamento', label: 'Acabamento', width: '120px' }
  ]

  let viewMode = $state<'list' | 'create' | 'details'>('list')
  let searchTerm = $state('')
  let selectedTecido = $state<Tecido | null>(null)

  // Lista inicial de tecidos com SKUs de 4 caracteres
  let tecidos = $state<Tecido[]>([
    {
      id: '1',
      codigo: 'TRAL',
      nome: 'Tricoline Lisa 100% Algodão',
      composicao: '100% Algodão',
      largura: '1,50',
      rendimento: '5,50',
      gramaturaLinear: '180',
      gramaturaM2: '120',
      tipo: 'liso',
      transparencia: 'nenhuma',
      elasticidade: 'nenhuma',
      acabamento: 'fosco'
    },
    {
      id: '2',
      codigo: 'CETI',
      nome: 'Cetim',
      composicao: '100% Poliéster',
      largura: '1,50',
      rendimento: '6,50',
      gramaturaLinear: '150',
      gramaturaM2: '100',
      tipo: 'liso',
      transparencia: 'nenhuma',
      elasticidade: 'nenhuma',
      acabamento: 'brilhante'
    },
    {
      id: '3',
      codigo: 'CEEL',
      nome: 'Cetim com Elastano',
      composicao: '97% Poliéster / 3% Elastano',
      largura: '1,45',
      rendimento: '5,00',
      gramaturaLinear: '200',
      gramaturaM2: '140',
      tipo: 'liso',
      transparencia: 'nenhuma',
      elasticidade: 'baixa',
      acabamento: 'semi_brilho'
    },
    {
      id: '4',
      codigo: 'ANAR',
      nome: 'Anarruga',
      composicao: '100% Algodão',
      largura: '1,40',
      rendimento: '4,50',
      gramaturaLinear: '220',
      gramaturaM2: '160',
      tipo: 'estampado',
      transparencia: 'baixa',
      elasticidade: 'nenhuma',
      acabamento: 'fosco'
    },
    {
      id: '5',
      codigo: 'LIRU',
      nome: 'Linho Puro Rústico',
      composicao: '100% Linho',
      largura: '1,45',
      rendimento: '3,00',
      gramaturaLinear: '350',
      gramaturaM2: '240',
      tipo: 'liso',
      transparencia: 'baixa',
      elasticidade: 'nenhuma',
      acabamento: 'fosco'
    },
    {
      id: '6',
      codigo: 'SAEL',
      nome: 'Sarja Acetinada com Elastano',
      composicao: '97% Algodão / 3% Elastano',
      largura: '1,60',
      rendimento: '2,50',
      gramaturaLinear: '420',
      gramaturaM2: '260',
      tipo: 'liso',
      transparencia: 'nenhuma',
      elasticidade: 'baixa',
      acabamento: 'semi_brilho'
    },
    {
      id: '7',
      codigo: 'VISA',
      nome: 'Viscose Sarjada',
      composicao: '100% Viscose',
      largura: '1,48',
      rendimento: '4,00',
      gramaturaLinear: '240',
      gramaturaM2: '170',
      tipo: 'liso',
      transparencia: 'baixa',
      elasticidade: 'nenhuma',
      acabamento: 'fosco'
    },
    {
      id: '8',
      codigo: 'JEPE',
      nome: 'Jeans Denim Pesado',
      composicao: '98% Algodão / 2% Elastano',
      largura: '1,65',
      rendimento: '1,50',
      gramaturaLinear: '630',
      gramaturaM2: '380',
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
        (item.tipo && item.tipo.toLowerCase().includes(term)) ||
        (item.acabamento && item.acabamento.toLowerCase().includes(term))
      )
    })
  )

  function handleNovoTecido(novo: NovoTecidoData) {
    const sku = generateTecidoSku(novo.nome)
    const novoItem: Tecido = {
      id: String(Date.now()),
      codigo: sku,
      nome: novo.nome,
      composicao: novo.composicao,
      largura: novo.largura,
      rendimento: novo.rendimento,
      gramaturaLinear: novo.gramaturaLinear,
      gramaturaM2: novo.gramaturaM2,
      tipo: novo.tipo,
      transparencia: novo.transparencia,
      elasticidade: novo.elasticidade,
      acabamento: novo.acabamento
    }

    tecidos = [novoItem, ...tecidos]
    selectedTecido = novoItem
    viewMode = 'list'
  }

  function handleSalvarEdicao(atualizado: Tecido) {
    tecidos = tecidos.map((item) => (item.id === atualizado.id ? atualizado : item))
    selectedTecido = atualizado
    viewMode = 'list'
  }

  function handleExcluirTecido(id: string) {
    tecidos = tecidos.filter((item) => item.id !== id)
    selectedTecido = null
    viewMode = 'list'
  }

  function handleRowClick(row: any) {
    selectedTecido = row as Tecido
    viewMode = 'details'
  }

  function formatDisplayLabel(val: string | undefined): string {
    if (!val) return '—'
    const map: Record<string, string> = {
      liso: 'Liso',
      estampado: 'Estampado',
      nenhuma: 'Nenhuma',
      baixa: 'Baixa',
      media: 'Média',
      alta: 'Alta',
      fosco: 'Fosco',
      semi_brilho: 'Semi-brilho',
      brilhante: 'Brilhante'
    }
    return map[val] || val
  }
</script>

{#if viewMode === 'create'}
  <TecidosCadastroPage
    oncancel={() => (viewMode = 'list')}
    onsave={handleNovoTecido}
  />
{:else if viewMode === 'details' && selectedTecido}
  <TecidosDetalhesPage
    tecido={selectedTecido}
    onback={() => (viewMode = 'list')}
    onsave={handleSalvarEdicao}
    ondelete={handleExcluirTecido}
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
              placeholder="Buscar por SKU, nome, composição, tipo..."
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
            onrowclick={handleRowClick}
          >
            {#snippet cell({ row, column, value })}
              {#if column.key === 'codigo'}
                <span class="code">{value}</span>
              {:else if column.key === 'largura'}
                <span>{value ? `${value} m` : '—'}</span>
              {:else if column.key === 'rendimento'}
                <span>{value ? `${value} m/kg` : '—'}</span>
              {:else if column.key === 'gramaturaLinear'}
                <span>{value ? `${value} g/m` : '—'}</span>
              {:else if column.key === 'gramaturaM2'}
                <span>{value ? `${value} g/m²` : '—'}</span>
              {:else if column.key === 'tipo' || column.key === 'acabamento'}
                <span class="muted-tag">{formatDisplayLabel(value)}</span>
              {:else if column.key === 'nome'}
                <span class="fabric-name">{value}</span>
              {:else}
                <span>{value || '—'}</span>
              {/if}
            {/snippet}
          </Table>
        </div>

        <!-- Barra de rodapé informativa -->
        <footer class="footer">
          <span class="footer-note">Clique em uma linha para abrir a tela de detalhes e editar o cadastro</span>
          {#if selectedTecido}
            <span class="footer-selected">
              Último selecionado: <strong>{selectedTecido.codigo} — {selectedTecido.nome}</strong>
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
    width: 100%;
  }

  .page :global(.panel) {
    height: 100%;
    min-height: 0;
    width: 100%;
  }

  .layout {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    width: 100%;
  }

  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-3);
    background: var(--color-bg-sunken);
    border-bottom: var(--border-width) solid var(--color-border);
    width: 100%;
    box-sizing: border-box;
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
    width: 100%;
  }

  .code {
    font-weight: 700;
    color: var(--color-accent);
    letter-spacing: var(--tracking-header);
    font-family: var(--font-mono);
  }

  .fabric-name {
    color: var(--color-fg);
  }

  .muted-tag {
    color: var(--color-fg-muted);
    font-size: var(--text-xs);
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
    width: 100%;
    box-sizing: border-box;
  }

  .footer-selected strong {
    color: var(--color-fg);
  }
</style>
