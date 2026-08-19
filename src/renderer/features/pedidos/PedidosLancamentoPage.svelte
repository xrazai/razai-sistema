<script lang="ts">
  import { onMount } from 'svelte'
  import Icon from '../../design-system/primitives/Icon.svelte'
  import Button from '../../design-system/controls/Button.svelte'
  import Badge from '../../design-system/data-display/Badge.svelte'
  import Input from '../../design-system/controls/Input.svelte'
  import Label from '../../design-system/primitives/Label.svelte'
  import { normalizeUnaccent } from '../../../shared/sku'
  import type { TecidoRecord, VinculoRecord, ItemLancamentoInput, CreatePedidoInput } from '../../../shared/types'

  type Props = {
    oncancel: () => void
    onsave: (pedido: CreatePedidoInput, sharePdf?: boolean) => void | Promise<void>
  }

  let { oncancel, onsave }: Props = $props()

  let tecidos = $state<TecidoRecord[]>([])
  let vinculosDoTecido = $state<VinculoRecord[]>([])
  let selectedTecidoId = $state<string | null>(null)
  let selectedCorId = $state<string | null>(null)
  let selectedVinculo = $state<VinculoRecord | null>(null)

  let tecidoSearch = $state('')
  let corSearch = $state('')

  let precoInput = $state('45,00')
  let quantidadeInput = $state('1,00')
  let clienteNome = $state('')
  let observacoes = $state('')

  let itensLancados = $state<ItemLancamentoInput[]>([])
  let erroMsg = $state<string | null>(null)
  let isSaving = $state(false)
  let isLoading = $state(true)

  function parsePtBrNumber(val: string): number {
    if (!val || !val.trim()) return 0
    const clean = val.replace(/\s+/g, '').replace(',', '.')
    const num = parseFloat(clean)
    return isNaN(num) || num < 0 ? 0 : num
  }

  const formatCurrency = (val: number) =>
    `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  async function loadTecidos() {
    isLoading = true
    try {
      if (typeof window !== 'undefined' && window.razai?.tecidos) {
        tecidos = await window.razai.tecidos.list()
        if (tecidos.length > 0 && !selectedTecidoId) {
          selectedTecidoId = String(tecidos[0].id)
        }
      }
    } catch (err: any) {
      console.error('Erro ao carregar tecidos:', err)
      erroMsg = err?.message || 'Falha ao carregar tecidos.'
    } finally {
      isLoading = false
    }
  }

  async function loadVinculosDoTecido(tId: string) {
    if (!tId) {
      vinculosDoTecido = []
      selectedCorId = null
      selectedVinculo = null
      return
    }
    try {
      if (typeof window !== 'undefined' && window.razai?.vinculos) {
        const list = await window.razai.vinculos.listByTecido(tId)
        vinculosDoTecido = list
        if (list.length > 0) {
          selectedCorId = String(list[0].corId)
          selectedVinculo = list[0]
        } else {
          selectedCorId = null
          selectedVinculo = null
        }
      }
    } catch (err: any) {
      console.error('Erro ao buscar vínculos do tecido:', err)
    }
  }

  onMount(() => {
    loadTecidos()
  })

  $effect(() => {
    const tId = selectedTecidoId
    if (tId) {
      loadVinculosDoTecido(tId)
    }
  })

  let selectedTecido = $derived(tecidos.find((t) => String(t.id) === String(selectedTecidoId)) || null)

  let filteredTecidos = $derived.by(() => {
    const term = normalizeUnaccent(tecidoSearch.trim())
    if (!term) return tecidos
    return tecidos.filter((t) => {
      const c = normalizeUnaccent(t.codigo)
      const n = normalizeUnaccent(t.nome)
      return c.includes(term) || n.includes(term)
    })
  })

  let filteredVinculos = $derived.by(() => {
    const term = normalizeUnaccent(corSearch.trim())
    if (!term) return vinculosDoTecido
    return vinculosDoTecido.filter((v) => {
      const c = normalizeUnaccent(v.corCodigo)
      const n = normalizeUnaccent(v.corNome)
      const s = normalizeUnaccent(v.sku)
      return c.includes(term) || n.includes(term) || s.includes(term)
    })
  })

  function handleSelectTecido(id: string) {
    selectedTecidoId = String(id)
  }

  function handleSelectVinculo(v: VinculoRecord) {
    selectedCorId = String(v.corId)
    selectedVinculo = v
  }

  function handleAdicionarItem() {
    erroMsg = null
    if (!selectedTecido) {
      erroMsg = 'Selecione um tecido na Coluna 1.'
      return
    }
    if (!selectedVinculo) {
      erroMsg = 'Selecione uma cor vinculada na Coluna 2.'
      return
    }

    const qtd = parsePtBrNumber(quantidadeInput)
    const preco = parsePtBrNumber(precoInput)

    if (qtd <= 0) {
      erroMsg = 'A quantidade deve ser maior que zero.'
      return
    }
    if (preco <= 0) {
      erroMsg = 'Informe um preço unitário válido.'
      return
    }

    const subtotal = Math.round(qtd * preco * 100) / 100

    const novoItem: ItemLancamentoInput = {
      tecidoId: String(selectedTecido.id),
      corId: String(selectedVinculo.corId),
      vinculoId: String(selectedVinculo.id),
      sku: selectedVinculo.sku,
      tecidoNome: selectedTecido.nome,
      tecidoCodigo: selectedTecido.codigo,
      corNome: selectedVinculo.corNome,
      corCodigo: selectedVinculo.corCodigo,
      corHex: selectedVinculo.corHex,
      precoUnitario: preco,
      quantidade: qtd,
      subtotal
    }

    itensLancados = [...itensLancados, novoItem]
  }

  function handleRemoverItem(index: number) {
    itensLancados = itensLancados.filter((_, i) => i !== index)
  }

  let totalMetragem = $derived(
    itensLancados.reduce((acc, item) => acc + item.quantidade, 0)
  )

  let valorTotalPedido = $derived(
    itensLancados.reduce((acc, item) => acc + item.subtotal, 0)
  )

  async function handleFinalizar(sharePdf = false) {
    if (itensLancados.length === 0) {
      erroMsg = 'Adicione ao menos 1 item na Coluna 3 antes de finalizar.'
      return
    }

    erroMsg = null
    isSaving = true
    const cleanItens = itensLancados.map((i) => ({
      tecidoId: String(i.tecidoId),
      corId: String(i.corId),
      vinculoId: i.vinculoId ? String(i.vinculoId) : undefined,
      sku: String(i.sku),
      tecidoNome: String(i.tecidoNome),
      tecidoCodigo: String(i.tecidoCodigo),
      corNome: String(i.corNome),
      corCodigo: String(i.corCodigo),
      corHex: i.corHex ? String(i.corHex) : undefined,
      precoUnitario: Number(i.precoUnitario),
      quantidade: Number(i.quantidade),
      subtotal: Number(i.subtotal)
    }))

    try {
      await onsave(
        {
          clienteNome: clienteNome.trim() || undefined,
          observacoes: observacoes.trim() || undefined,
          itens: cleanItens
        },
        sharePdf
      )
    } catch (err: any) {
      console.error('Erro ao salvar pedido:', err)
      erroMsg = err?.message || 'Falha ao gravar o pedido.'
    } finally {
      isSaving = false
    }
  }
</script>

<div class="lancamento-page">
  <div class="tri-layout">
    <!-- COLUNA 1: ESCOLHER UM TECIDO -->
    <section class="col-panel col-tecidos">
      <header class="col-head">
        <span class="col-num">01</span>
        <span class="col-title">Tecido Base</span>
        <span class="col-count">{filteredTecidos.length}</span>
      </header>

      <div class="col-search">
        <Icon name="search" size="sm" />
        <input
          type="text"
          class="col-search-input"
          bind:value={tecidoSearch}
          placeholder="Buscar tecido..."
        />
        {#if tecidoSearch}
          <button class="clear-btn" onclick={() => (tecidoSearch = '')}>✕</button>
        {/if}
      </div>

      <div class="col-body-scroll">
        {#if filteredTecidos.length === 0}
          <div class="col-empty">Nenhum tecido encontrado.</div>
        {:else}
          <div class="tiles-list">
            {#each filteredTecidos as t (t.id)}
              <button
                type="button"
                class="tile-btn"
                class:active={String(t.id) === String(selectedTecidoId)}
                onclick={() => handleSelectTecido(t.id)}
              >
                <div class="tile-top">
                  <span class="sku-tag">{t.codigo}</span>
                  <span class="tile-title">{t.nome}</span>
                </div>
                <div class="tile-sub">{t.composicao} • {t.largura}m</div>
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </section>

    <!-- COLUNA 2: ESCOLHER UMA COR (VINCULADA) -->
    <section class="col-panel col-cores">
      <header class="col-head">
        <span class="col-num">02</span>
        <span class="col-title">Cores Vinculadas</span>
        <span class="col-count">{filteredVinculos.length}</span>
      </header>

      <div class="col-search">
        <Icon name="search" size="sm" />
        <input
          type="text"
          class="col-search-input"
          bind:value={corSearch}
          placeholder="Buscar cor da cartela..."
          disabled={!selectedTecidoId}
        />
        {#if corSearch}
          <button class="clear-btn" onclick={() => (corSearch = '')}>✕</button>
        {/if}
      </div>

      <div class="col-body-scroll">
        {#if !selectedTecidoId}
          <div class="col-empty">Selecione um tecido na Coluna 1.</div>
        {:else if vinculosDoTecido.length === 0}
          <div class="col-empty">
            <span>Este tecido ainda não possui cores vinculadas no módulo de Vínculos.</span>
          </div>
        {:else if filteredVinculos.length === 0}
          <div class="col-empty">Nenhuma cor encontrada para "{corSearch}".</div>
        {:else}
          <div class="tiles-list">
            {#each filteredVinculos as v (v.id)}
              <button
                type="button"
                class="tile-btn cor-btn"
                class:active={String(v.corId) === String(selectedCorId)}
                onclick={() => handleSelectVinculo(v)}
              >
                <div class="cor-row-main">
                  <span class="swatch-box" style="background-color: {v.corHex || '#000000'};"></span>
                  <div class="cor-info">
                    <span class="tile-title">{v.corNome}</span>
                    <span class="cor-sub-sku">{v.sku}</span>
                  </div>
                </div>
                <span class="cor-sku-tag">{v.corCodigo}</span>
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </section>

    <!-- COLUNA 3: INPUTS + LANÇAMENTOS + TOTAIS FIXOS -->
    <section class="col-panel col-carrinho">
      <header class="col-head">
        <span class="col-num">03</span>
        <span class="col-title">Lançamento de Pedido</span>
        <span class="col-count">{itensLancados.length} {itensLancados.length === 1 ? 'item' : 'itens'}</span>
      </header>

      <!-- FORMULÁRIO DE LANÇAMENTO TOPO -->
      <div class="inputs-toolbar">
        <div class="inputs-row">
          <div class="input-field">
            <Label text="Preço Unitário (R$) *" for="input-preco-pedido" />
            <Input id="input-preco-pedido" bind:value={precoInput} placeholder="45,00" />
          </div>
          <div class="input-field">
            <Label text="Quantidade *" for="input-qtd-pedido" />
            <Input id="input-qtd-pedido" bind:value={quantidadeInput} placeholder="1,00" />
          </div>
        </div>

        <div class="add-btn-wrap">
          <Button
            variant="primary"
            onclick={handleAdicionarItem}
            disabled={!selectedTecidoId || !selectedCorId}
          >
            <Icon name="plus" size="sm" />
            <span>+ Registrar Item</span>
          </Button>
        </div>

        {#if erroMsg}
          <div class="error-banner">
            <Badge text={erroMsg} tone="danger" />
          </div>
        {/if}
      </div>

      <!-- LISTA SCROLÁVEL DOS LANÇAMENTOS -->
      <div class="carrinho-scroll">
        {#if itensLancados.length === 0}
          <div class="carrinho-empty">
            <Icon name="orders" size="md" />
            <span class="empty-title">Nenhum item lançado</span>
            <span class="empty-sub">Selecione tecido e cor, insira preço e quantidade e clique em '+ Registrar Item'.</span>
          </div>
        {:else}
          <div class="itens-list">
            {#each itensLancados as item, i}
              <div class="carrinho-item">
                <div class="item-left">
                  <div class="item-head">
                    <span class="swatch-sm" style="background-color: {item.corHex || '#000000'};"></span>
                    <span class="item-sku">{item.sku}</span>
                  </div>
                  <div class="item-desc">{item.tecidoNome} — {item.corNome}</div>
                  <div class="item-math">
                    {item.quantidade.toFixed(2).replace('.', ',')} × {formatCurrency(item.precoUnitario)}
                  </div>
                </div>

                <div class="item-right">
                  <span class="item-subtotal">{formatCurrency(item.subtotal)}</span>
                  <button
                    type="button"
                    class="remove-btn"
                    onclick={() => handleRemoverItem(i)}
                    title="Remover item"
                  >
                    ✕
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- RODAPÉ FIXO COM DADOS E TOTAIS -->
      <footer class="col-footer-fixed">
        <div class="footer-meta-row">
          <div class="meta-field">
            <Label text="Cliente / Solicitante *" for="cliente-pedido" />
            <Input id="cliente-pedido" bind:value={clienteNome} placeholder="Nome do cliente (WhatsApp / Balcão)" />
          </div>
          <div class="meta-field">
            <Label text="Observações do Pedido" for="obs-pedido" />
            <Input id="obs-pedido" bind:value={observacoes} placeholder="Condições, prazos, entrega..." />
          </div>
        </div>

        <div class="totals-summary-bar">
          <div class="total-metric">
            <span class="metric-label">Lançamentos</span>
            <span class="metric-val">{itensLancados.length}</span>
          </div>
          <div class="total-metric">
            <span class="metric-label">Quantidade Total</span>
            <span class="metric-val">{totalMetragem.toFixed(2).replace('.', ',')}</span>
          </div>
          <div class="total-metric highlight">
            <span class="metric-label">Valor Total</span>
            <span class="metric-val major">{formatCurrency(valorTotalPedido)}</span>
          </div>
        </div>

        <div class="footer-actions">
          <Button variant="ghost" onclick={oncancel} disabled={isSaving}>
            Cancelar
          </Button>

          <div class="right-buttons">
            <Button
              variant="secondary"
              onclick={() => handleFinalizar(true)}
              disabled={itensLancados.length === 0 || isSaving}
            >
              <Icon name="copy" size="sm" />
              <span>{isSaving ? 'Gerando...' : 'Compartilhar (PDF / WhatsApp)'}</span>
            </Button>

            <Button
              variant="primary"
              onclick={() => handleFinalizar(false)}
              disabled={itensLancados.length === 0 || isSaving}
            >
              <span>{isSaving ? 'Salvando...' : 'Finalizar Pedido'}</span>
            </Button>
          </div>
        </div>
      </footer>
    </section>
  </div>
</div>

<style>
  .lancamento-page {
    height: 100%;
    min-height: 0;
    display: grid;
    width: 100%;
    overflow: hidden;
  }

  .tri-layout {
    display: grid;
    grid-template-columns: 320px 320px 1fr;
    height: 100%;
    min-height: 0;
    background: var(--color-bg);
  }

  .col-panel {
    display: grid;
    grid-template-rows: 40px 40px 1fr;
    height: 100%;
    min-height: 0;
    box-shadow: inset -1px 0 0 0 var(--color-border);
    background: var(--color-bg);
    box-sizing: border-box;
  }

  .col-panel:last-child {
    box-shadow: none;
  }

  .col-carrinho {
    grid-template-rows: 40px auto 1fr auto;
  }

  .col-head {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    height: 40px;
    padding: 0 var(--space-3);
    background: var(--color-bg-elevated);
    box-shadow: inset 0 -1px 0 0 var(--color-border);
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-header);
    text-transform: uppercase;
    color: var(--color-fg);
    font-family: var(--font-mono);
    line-height: 100%;
    box-sizing: border-box;
  }

  .col-num {
    color: var(--color-accent);
    font-weight: 700;
  }

  .col-title {
    flex: 1;
    font-weight: 600;
  }

  .col-count {
    font-size: 10px;
    color: var(--color-fg-dim);
  }

  .col-search {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    height: 40px;
    padding: 0 var(--space-3);
    background: var(--color-bg);
    box-shadow: inset 0 -1px 0 0 var(--color-border);
    box-sizing: border-box;
  }

  .col-search-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: var(--color-fg);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    line-height: 100%;
  }

  .clear-btn {
    background: transparent;
    border: none;
    color: var(--color-fg-muted);
    cursor: pointer;
    font-size: 11px;
    padding: 2px 4px;
  }

  .col-body-scroll {
    overflow-y: auto;
    padding: var(--space-2);
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .col-empty {
    padding: var(--space-4);
    text-align: center;
    font-size: var(--text-xs);
    color: var(--color-fg-dim);
    font-family: var(--font-mono);
  }

  .tiles-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .tile-btn {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: var(--space-2) var(--space-3);
    background: var(--color-bg-elevated);
    border: var(--border-width) solid var(--color-border);
    text-align: left;
    cursor: pointer;
    font-family: inherit;
    transition: all var(--motion-fast);
    box-sizing: border-box;
  }

  .tile-btn:hover {
    border-color: var(--color-accent);
    background: var(--color-bg-sunken);
  }

  .tile-btn.active {
    border-color: var(--color-accent);
    background: var(--color-accent-dim, rgba(255, 255, 255, 0.08));
    box-shadow: inset 2px 0 0 0 var(--color-accent);
  }

  .tile-top {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .sku-tag {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    color: var(--color-accent);
  }

  .tile-title {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-fg);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tile-sub {
    font-size: 10px;
    color: var(--color-fg-muted);
    font-family: var(--font-mono);
  }

  .cor-btn {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .cor-row-main {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-width: 0;
  }

  .swatch-box {
    width: 20px;
    height: 20px;
    border: 1px solid var(--color-border-strong);
    flex-shrink: 0;
  }

  .cor-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .cor-sub-sku {
    font-size: 9px;
    font-family: var(--font-mono);
    color: var(--color-fg-dim);
  }

  .cor-sku-tag {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--color-fg-muted);
    font-weight: 600;
  }

  .inputs-toolbar {
    padding: var(--space-3);
    background: var(--color-bg-elevated);
    box-shadow: inset 0 -1px 0 0 var(--color-border);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .inputs-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-3);
  }

  .input-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .add-btn-wrap {
    display: flex;
    justify-content: flex-end;
  }

  .error-banner {
    margin-top: var(--space-1);
  }

  .carrinho-scroll {
    overflow-y: auto;
    padding: var(--space-3);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    min-height: 0;
    flex: 1;
  }

  .carrinho-empty {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    color: var(--color-fg-dim);
    text-align: center;
    padding: var(--space-4);
  }

  .empty-title {
    font-size: var(--text-xs);
    font-weight: 700;
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }

  .empty-sub {
    font-size: 10px;
    font-family: var(--font-mono);
    max-width: 320px;
  }

  .itens-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .carrinho-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-2) var(--space-3);
    background: var(--color-bg-elevated);
    border: var(--border-width) solid var(--color-border);
    box-sizing: border-box;
  }

  .item-left {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .item-head {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .swatch-sm {
    width: 12px;
    height: 12px;
    border: 1px solid var(--color-border-strong);
    display: inline-block;
  }

  .item-sku {
    font-family: var(--font-mono);
    font-weight: 700;
    font-size: 11px;
    color: var(--color-accent);
  }

  .item-desc {
    font-size: var(--text-xs);
    color: var(--color-fg);
  }

  .item-math {
    font-size: 10px;
    font-family: var(--font-mono);
    color: var(--color-fg-dim);
  }

  .item-right {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .item-subtotal {
    font-family: var(--font-mono);
    font-weight: 700;
    font-size: var(--text-xs);
    color: var(--color-fg);
  }

  .remove-btn {
    background: transparent;
    border: none;
    color: var(--color-danger);
    cursor: pointer;
    font-size: 12px;
    padding: 2px 4px;
    opacity: 0.7;
    transition: opacity var(--motion-fast);
  }

  .remove-btn:hover {
    opacity: 1;
  }

  .col-footer-fixed {
    background: var(--color-bg-elevated);
    box-shadow: inset 0 1px 0 0 var(--color-border);
    padding: var(--space-3);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .footer-meta-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-3);
  }

  .meta-field {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .totals-summary-bar {
    display: grid;
    grid-template-columns: 1fr 1fr 1.5fr;
    background: var(--color-bg-sunken);
    border: var(--border-width) solid var(--color-border);
    padding: var(--space-2) var(--space-3);
    box-sizing: border-box;
  }

  .total-metric {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .total-metric.highlight {
    text-align: right;
  }

  .metric-label {
    font-size: 9px;
    font-family: var(--font-mono);
    text-transform: uppercase;
    color: var(--color-fg-dim);
  }

  .metric-val {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    font-weight: 700;
    color: var(--color-fg);
  }

  .metric-val.major {
    font-size: var(--text-sm);
    color: var(--color-fg);
  }

  .footer-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-3);
  }

  .right-buttons {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
</style>
