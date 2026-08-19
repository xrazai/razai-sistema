<script lang="ts">
  import Icon from '../../design-system/primitives/Icon.svelte'
  import Button from '../../design-system/controls/Button.svelte'
  import Badge from '../../design-system/data-display/Badge.svelte'
  import Input from '../../design-system/controls/Input.svelte'
  import Label from '../../design-system/primitives/Label.svelte'
  import Select from '../../design-system/controls/Select.svelte'
  import type { PedidoRecord, ItemLancamentoInput, UpdatePedidoInput, PedidoStatus } from '../../../shared/types'

  type Props = {
    pedido: PedidoRecord
    onback: () => void
    onsave: (id: string, input: UpdatePedidoInput) => void | Promise<void>
    ondelete: (id: string) => void | Promise<void>
    onaprovar: (id: string) => void | Promise<void>
    onshare: (id: string) => void | Promise<void>
  }

  let { pedido, onback, onsave, ondelete, onaprovar, onshare }: Props = $props()

  let currentPedidoId = $state<string | null>(null)
  let clienteNome = $state('')
  let observacoes = $state('')
  let status = $state<PedidoStatus>('pendente')
  let itens = $state<ItemLancamentoInput[]>([])

  $effect(() => {
    if (pedido.id !== currentPedidoId) {
      currentPedidoId = pedido.id
      clienteNome = pedido.clienteNome || ''
      observacoes = pedido.observacoes || ''
      status = pedido.status || 'pendente'
      itens = (pedido.itens || []).map((i) => ({
        tecidoId: i.tecidoId,
        corId: i.corId,
        vinculoId: i.vinculoId,
        sku: i.sku,
        tecidoNome: i.tecidoNome,
        tecidoCodigo: i.tecidoCodigo,
        corNome: i.corNome,
        corCodigo: i.corCodigo,
        corHex: i.corHex,
        precoUnitario: i.precoUnitario,
        quantidade: i.quantidade,
        subtotal: i.subtotal
      }))
    }
  })

  let isSaving = $state(false)
  let erroMsg = $state<string | null>(null)
  let successMsg = $state<string | null>(null)
  let showDeleteConfirm = $state(false)

  const statusOptions = [
    { value: 'pendente', label: 'Pendente (Aberto)' },
    { value: 'aprovado', label: 'Aprovado (Venda Gerada)' },
    { value: 'cancelado', label: 'Cancelado' }
  ]

  const formatCurrency = (val: number) =>
    `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  function handleUpdateItemQty(index: number, newQtyStr: string) {
    const clean = newQtyStr.replace(',', '.')
    const num = parseFloat(clean)
    if (!isNaN(num) && num > 0) {
      itens[index].quantidade = num
      itens[index].subtotal = Math.round(num * itens[index].precoUnitario * 100) / 100
      itens = [...itens]
    }
  }

  function handleUpdateItemPrice(index: number, newPriceStr: string) {
    const clean = newPriceStr.replace(',', '.')
    const num = parseFloat(clean)
    if (!isNaN(num) && num >= 0) {
      itens[index].precoUnitario = num
      itens[index].subtotal = Math.round(itens[index].quantidade * num * 100) / 100
      itens = [...itens]
    }
  }

  function handleRemoverItem(index: number) {
    if (itens.length <= 1) {
      alert('O pedido deve conter ao menos 1 item.')
      return
    }
    itens = itens.filter((_, i) => i !== index)
  }

  let totalMetragem = $derived(
    itens.reduce((acc, i) => acc + i.quantidade, 0)
  )

  let valorTotalPedido = $derived(
    itens.reduce((acc, i) => acc + i.subtotal, 0)
  )

  async function handleSave() {
    erroMsg = null
    successMsg = null
    isSaving = true
    const cleanItens = itens.map((i) => ({
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
      await onsave(pedido.id, {
        clienteNome: clienteNome.trim() || undefined,
        observacoes: observacoes.trim() || undefined,
        status,
        itens: cleanItens
      })
      successMsg = 'Alterações salvas com sucesso!'
      setTimeout(() => {
        successMsg = null
      }, 3000)
    } catch (err: any) {
      console.error('Erro ao atualizar pedido:', err)
      erroMsg = err?.message || 'Falha ao atualizar pedido.'
    } finally {
      isSaving = false
    }
  }

  async function handleAprovarPedido() {
    if (!confirm(`Deseja aprovar o pedido #PED-${String(pedido.numero).padStart(4, '0')} e gerar a venda automaticamente?`)) {
      return
    }
    isSaving = true
    try {
      await onaprovar(pedido.id)
      status = 'aprovado'
      successMsg = 'Pedido aprovado com sucesso! Venda correspondente gerada.'
    } catch (err: any) {
      console.error('Erro ao aprovar pedido:', err)
      erroMsg = err?.message || 'Falha ao aprovar pedido.'
    } finally {
      isSaving = false
    }
  }

  async function handleShare() {
    isSaving = true
    try {
      await onshare(pedido.id)
    } catch (err: any) {
      console.error('Erro ao compartilhar pedido:', err)
      erroMsg = err?.message || 'Falha ao gerar e compartilhar PDF.'
    } finally {
      isSaving = false
    }
  }

  async function handleDelete() {
    isSaving = true
    try {
      await ondelete(pedido.id)
    } catch (err: any) {
      console.error('Erro ao excluir pedido:', err)
      erroMsg = err?.message || 'Falha ao excluir pedido.'
      isSaving = false
    }
  }
</script>

<div class="detalhes-page">
  <div class="detalhes-scroll">
    <div class="detalhes-container">
      <!-- CABEÇALHO DO PEDIDO -->
      <header class="detalhes-header">
        <div class="header-left">
          <span class="num-badge">#PED-{String(pedido.numero).padStart(4, '0')}</span>
          <h2 class="header-title">Gestão e Detalhes do Pedido</h2>
        </div>

        <div class="header-right">
          <Badge
            text={status.toUpperCase()}
            tone={status === 'aprovado' ? 'ok' : status === 'cancelado' ? 'danger' : 'warn'}
          />
        </div>
      </header>

      {#if erroMsg}
        <div class="msg-banner">
          <Badge text={erroMsg} tone="danger" />
        </div>
      {/if}

      {#if successMsg}
        <div class="msg-banner">
          <Badge text={successMsg} tone="ok" />
        </div>
      {/if}

      <!-- SEÇÃO 01: DADOS GERAIS -->
      <div class="section-card">
        <header class="card-head">
          <span>01. Identificação e Cliente</span>
        </header>
        <div class="card-body">
          <div class="grid-2">
            <div class="field">
              <Label text="Cliente / Solicitante" for="det-cliente" />
              <Input id="det-cliente" bind:value={clienteNome} placeholder="Nome do cliente" />
            </div>

            <div class="field">
              <Label text="Status do Pedido" for="det-status" />
              <Select id="det-status" bind:value={status} options={statusOptions} />
            </div>
          </div>

          <div class="field" style="margin-top: var(--space-2);">
            <Label text="Observações do Pedido" for="det-obs" />
            <Input id="det-obs" bind:value={observacoes} placeholder="Condições, prazos de entrega..." />
          </div>
        </div>
      </div>

      <!-- SEÇÃO 02: ITENS LANÇADOS -->
      <div class="section-card">
        <header class="card-head">
          <span>02. Itens do Pedido ({itens.length})</span>
        </header>

        <div class="card-table-wrap">
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 35px; text-align: center;">#</th>
                <th style="width: 150px;">SKU</th>
                <th>Tecido & Cor</th>
                <th style="width: 110px; text-align: right;">Quantidade (m)</th>
                <th style="width: 120px; text-align: right;">Preço Unit. (R$)</th>
                <th style="width: 120px; text-align: right;">Subtotal</th>
                <th style="width: 60px; text-align: center;">Remover</th>
              </tr>
            </thead>
            <tbody>
              {#each itens as item, idx}
                <tr>
                  <td style="text-align: center;">{idx + 1}</td>
                  <td class="mono-sku">{item.sku}</td>
                  <td>
                    <div class="item-inline">
                      <span class="swatch-inline" style="background-color: {item.corHex || '#000000'};"></span>
                      <span>{item.tecidoNome} — {item.corNome}</span>
                    </div>
                  </td>
                  <td style="text-align: right;">
                    <input
                      type="text"
                      class="mini-input"
                      value={item.quantidade}
                      onchange={(e) => handleUpdateItemQty(idx, (e.target as HTMLInputElement).value)}
                    />
                  </td>
                  <td style="text-align: right;">
                    <input
                      type="text"
                      class="mini-input"
                      value={item.precoUnitario}
                      onchange={(e) => handleUpdateItemPrice(idx, (e.target as HTMLInputElement).value)}
                    />
                  </td>
                  <td style="text-align: right; font-weight: 700;">{formatCurrency(item.subtotal)}</td>
                  <td style="text-align: center;">
                    <button
                      type="button"
                      class="del-row-btn"
                      onclick={() => handleRemoverItem(idx)}
                      title="Excluir item"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <div class="totals-bar">
          <div class="tot-item">
            <span>Total de Lançamentos:</span>
            <strong>{itens.length} itens</strong>
          </div>
          <div class="tot-item">
            <span>Metragem Total:</span>
            <strong>{totalMetragem.toFixed(2).replace('.', ',')} m</strong>
          </div>
          <div class="tot-item major">
            <span>Valor Total Geral:</span>
            <strong class="price-major">{formatCurrency(valorTotalPedido)}</strong>
          </div>
        </div>
      </div>

      <!-- BARRA DE AÇÕES DO RODAPÉ -->
      <footer class="detalhes-footer">
        <div class="footer-left">
          <Button variant="danger" onclick={() => (showDeleteConfirm = true)} disabled={isSaving}>
            <span>Excluir Pedido</span>
          </Button>
        </div>

        <div class="footer-right">
          <Button variant="ghost" onclick={onback} disabled={isSaving}>
            <Icon name="arrow-left" size="sm" />
            <span>Voltar</span>
          </Button>

          <Button variant="secondary" onclick={handleShare} disabled={isSaving}>
            <Icon name="copy" size="sm" />
            <span>Compartilhar (PDF)</span>
          </Button>

          {#if status === 'pendente'}
            <Button variant="secondary" onclick={handleAprovarPedido} disabled={isSaving}>
              <Icon name="check" size="sm" />
              <span>Aprovar & Gerar Venda</span>
            </Button>
          {/if}

          <Button variant="primary" onclick={handleSave} disabled={isSaving}>
            <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
          </Button>
        </div>
      </footer>
    </div>
  </div>
</div>

{#if showDeleteConfirm}
  <div
    class="modal-backdrop"
    role="presentation"
    onclick={() => (showDeleteConfirm = false)}
    onkeydown={(e) => { if (e.key === 'Escape') showDeleteConfirm = false }}
  >
    <div
      class="modal-dialog"
      role="alertdialog"
      tabindex="-1"
      aria-modal="true"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => { if (e.key === 'Escape') showDeleteConfirm = false }}
    >
      <header class="modal-header">
        <span class="modal-title">Confirmar Exclusão do Pedido</span>
        <button type="button" class="modal-close" onclick={() => (showDeleteConfirm = false)}>✕</button>
      </header>

      <div class="modal-body">
        <p>
          Deseja realmente excluir permanentemente o pedido <strong>#PED-{String(pedido.numero).padStart(4, '0')}</strong>?
          Esta ação não pode ser desfeita.
        </p>
      </div>

      <footer class="modal-footer">
        <Button variant="ghost" onclick={() => (showDeleteConfirm = false)}>Cancelar</Button>
        <Button variant="danger" onclick={handleDelete}>Confirmar Exclusão</Button>
      </footer>
    </div>
  </div>
{/if}

<style>
  .detalhes-page {
    height: 100%;
    min-height: 0;
    display: grid;
  }

  .detalhes-scroll {
    overflow-y: auto;
    padding: var(--space-4);
    display: flex;
    justify-content: center;
  }

  .detalhes-container {
    max-width: 880px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .detalhes-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-3) var(--space-4);
    background: var(--color-bg-elevated);
    border: var(--border-width) solid var(--color-border);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .num-badge {
    font-family: var(--font-mono);
    font-size: var(--text-md);
    font-weight: 700;
    color: var(--color-accent);
  }

  .header-title {
    font-size: var(--text-sm);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: var(--tracking-tight);
    color: var(--color-fg);
  }

  .msg-banner {
    display: flex;
  }

  .section-card {
    background: var(--color-bg-elevated);
    border: var(--border-width) solid var(--color-border);
  }

  .card-head {
    height: 40px;
    display: flex;
    align-items: center;
    padding: 0 var(--space-3);
    background: var(--color-bg-sunken);
    box-shadow: inset 0 -1px 0 0 var(--color-border);
    font-size: var(--text-xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: var(--tracking-header);
    color: var(--color-fg);
    font-family: var(--font-mono);
  }

  .card-body {
    padding: var(--space-3);
  }

  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-3);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .card-table-wrap {
    overflow-x: auto;
  }

  .items-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--text-xs);
  }

  .items-table th,
  .items-table td {
    height: 40px;
    padding: 0 var(--space-3);
    border: none;
    box-shadow: inset 0 -1px 0 0 var(--color-border), inset -1px 0 0 0 var(--color-border);
    vertical-align: middle;
  }

  .items-table th:last-child,
  .items-table td:last-child {
    box-shadow: inset 0 -1px 0 0 var(--color-border);
  }

  .items-table th {
    background: var(--color-bg-sunken);
    color: var(--color-fg-muted);
    font-family: var(--font-mono);
    text-transform: uppercase;
    font-size: 10px;
    letter-spacing: var(--tracking-label);
  }

  .mono-sku {
    font-family: var(--font-mono);
    font-weight: 700;
    color: var(--color-accent);
  }

  .item-inline {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .swatch-inline {
    width: 14px;
    height: 14px;
    border: 1px solid var(--color-border-strong);
    display: inline-block;
  }

  .mini-input {
    width: 80px;
    background: var(--color-bg);
    border: var(--border-width) solid var(--color-border);
    color: var(--color-fg);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    padding: 4px 6px;
    text-align: right;
  }

  .mini-input:focus {
    border-color: var(--color-accent);
    outline: none;
  }

  .del-row-btn {
    background: transparent;
    border: none;
    color: var(--color-danger);
    cursor: pointer;
    font-size: 12px;
    padding: 4px;
    opacity: 0.7;
    transition: opacity var(--motion-fast);
  }

  .del-row-btn:hover {
    opacity: 1;
  }

  .totals-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-3) var(--space-4);
    background: var(--color-bg-sunken);
    box-shadow: inset 0 1px 0 0 var(--color-border);
    font-size: var(--text-xs);
  }

  .tot-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-family: var(--font-mono);
  }

  .tot-item strong {
    color: var(--color-fg);
  }

  .price-major {
    font-size: var(--text-sm);
    color: var(--color-accent);
  }

  .detalhes-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-3) 0;
    gap: var(--space-3);
  }

  .footer-right {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999;
  }

  .modal-dialog {
    background: var(--color-bg-elevated);
    border: var(--border-width) solid var(--color-border);
    max-width: 480px;
    width: 100%;
    box-sizing: border-box;
  }

  .modal-header {
    height: 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 var(--space-3);
    background: var(--color-bg-sunken);
    box-shadow: inset 0 -1px 0 0 var(--color-border);
    font-size: var(--text-xs);
    font-weight: 700;
    text-transform: uppercase;
  }

  .modal-close {
    background: transparent;
    border: none;
    color: var(--color-fg-muted);
    cursor: pointer;
  }

  .modal-body {
    padding: var(--space-4);
    font-size: var(--text-xs);
    color: var(--color-fg-muted);
    line-height: 1.4;
  }

  .modal-body strong {
    color: var(--color-fg);
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
    padding: var(--space-3);
    background: var(--color-bg-sunken);
    box-shadow: inset 0 1px 0 0 var(--color-border);
  }
</style>
