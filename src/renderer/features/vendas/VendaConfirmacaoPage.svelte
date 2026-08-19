<script lang="ts">
  import Icon from '../../design-system/primitives/Icon.svelte'
  import Button from '../../design-system/controls/Button.svelte'
  import Badge from '../../design-system/data-display/Badge.svelte'
  import type { VendaRecord } from '../../../shared/types'

  type Props = {
    venda: VendaRecord
    onback: () => void
    onreprint: () => void | Promise<void>
  }

  let { venda, onback, onreprint }: Props = $props()

  let isReprinting = $state(false)
  let reprintStatus = $state<string | null>(null)

  const formatCurrency = (val: number) =>
    `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  async function handleReprint() {
    isReprinting = true
    reprintStatus = null
    try {
      await onreprint()
      reprintStatus = 'Cupom reenviado à impressora térmica!'
      setTimeout(() => {
        reprintStatus = null
      }, 3000)
    } catch (err: any) {
      console.error('Erro ao reimprimir cupom:', err)
      reprintStatus = err?.message || 'Falha ao reimprimir cupom.'
    } finally {
      isReprinting = false
    }
  }
</script>

<div class="confirmacao-page">
  <div class="confirmacao-container">
    <div class="success-banner">
      <div class="success-icon">
        <Icon name="check" />
      </div>
      <div class="success-title">Venda #{String(venda.numero).padStart(4, '0')} Finalizada com Sucesso!</div>
      <div class="success-desc">
        A venda foi gravada no SQLite e o comando de impressão térmica ESC/POS 80mm foi enviado ao spooler.
      </div>
      {#if reprintStatus}
        <div class="reprint-badge">
          <Badge text={reprintStatus} tone="ok" />
        </div>
      {/if}
    </div>

    <!-- CUPOM VISUAL EM ESTILO INDUSTRIAL BRUTALIST -->
    <div class="receipt-card">
      <div class="receipt-head">
        <div class="receipt-brand">RAZAI SISTEMA</div>
        <div class="receipt-subtitle">Comprovante de Venda • 80mm</div>
        <div class="receipt-divider">================================================</div>
      </div>

      <div class="receipt-meta">
        <div class="receipt-row">
          <span>VENDA:</span>
          <strong>#VEN-{String(venda.numero).padStart(4, '0')}</strong>
        </div>
        <div class="receipt-row">
          <span>DATA/HORA:</span>
          <span>{new Date(venda.createdAt).toLocaleString('pt-BR')}</span>
        </div>
        {#if venda.clienteNome}
          <div class="receipt-row">
            <span>CLIENTE:</span>
            <span>{venda.clienteNome}</span>
          </div>
        {/if}
        {#if venda.formaPagamento}
          <div class="receipt-row">
            <span>PAGAMENTO:</span>
            <span>{venda.formaPagamento}</span>
          </div>
        {/if}
      </div>

      <div class="receipt-divider">------------------------------------------------</div>

      <div class="receipt-items-head">
        <span>ITEM / SKU</span>
        <span>QTD × UNIT = TOTAL</span>
      </div>
      <div class="receipt-divider">------------------------------------------------</div>

      <div class="receipt-items-list">
        {#each venda.itens || [] as item}
          <div class="receipt-item">
            <div class="item-title">{item.tecidoNome} ({item.corNome})</div>
            <div class="item-details">
              <span class="mono-sku">{item.sku}</span>
              <span class="item-math">
                {item.quantidade.toFixed(2).replace('.', ',')} × {formatCurrency(item.precoUnitario)} = <strong>{formatCurrency(item.subtotal)}</strong>
              </span>
            </div>
          </div>
        {/each}
      </div>

      <div class="receipt-divider">------------------------------------------------</div>

      <div class="receipt-totals">
        <div class="receipt-row">
          <span>TOTAL DE ITENS:</span>
          <span>{venda.itensCount} itens</span>
        </div>
        <div class="receipt-row">
          <span>QUANTIDADE TOTAL:</span>
          <span>{venda.quantidadeTotal.toFixed(2).replace('.', ',')}</span>
        </div>
        <div class="receipt-divider">================================================</div>
        <div class="receipt-total-major">
          <span>TOTAL GERAL:</span>
          <span class="major-val">{formatCurrency(venda.valorTotal)}</span>
        </div>
      </div>

      <div class="receipt-divider">================================================</div>
      <div class="receipt-footer">
        <div>OBRIGADO PELA PREFERÊNCIA!</div>
        <div class="footer-tag">RAZAI INDUSTRIAL BRUTALIST</div>
      </div>
    </div>

    <!-- BOTÕES DE AÇÃO -->
    <div class="actions-bar">
      <Button variant="ghost" onclick={onback}>
        <Icon name="arrow-left" size="sm" />
        <span>Voltar para Vendas</span>
      </Button>

      <Button variant="secondary" onclick={handleReprint} disabled={isReprinting}>
        <Icon name="settings" size="sm" />
        <span>{isReprinting ? 'Reimprimindo...' : 'Reimprimir Cupom Térmico (80mm)'}</span>
      </Button>
    </div>
  </div>
</div>

<style>
  .confirmacao-page {
    height: 100%;
    min-height: 0;
    overflow-y: auto;
    background: var(--color-bg);
    padding: var(--space-4);
    display: flex;
    justify-content: center;
    box-sizing: border-box;
  }

  .confirmacao-container {
    max-width: 540px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    align-items: center;
  }

  .success-banner {
    width: 100%;
    background: var(--color-bg-elevated);
    border: var(--border-width) solid var(--color-border);
    padding: var(--space-4);
    text-align: center;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
  }

  .success-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: var(--color-accent);
    color: var(--color-accent-fg);
  }

  .success-title {
    font-size: var(--text-md);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: var(--tracking-tight);
    color: var(--color-fg);
  }

  .success-desc {
    font-size: var(--text-xs);
    color: var(--color-fg-muted);
    font-family: var(--font-mono);
    max-width: 440px;
  }

  .reprint-badge {
    margin-top: var(--space-1);
  }

  .receipt-card {
    width: 100%;
    background: var(--color-bg-sunken);
    border: var(--border-width) solid var(--color-border-strong);
    padding: var(--space-4);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--color-fg);
    box-sizing: border-box;
  }

  .receipt-head {
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .receipt-brand {
    font-size: var(--text-sm);
    font-weight: 700;
    letter-spacing: var(--tracking-wider);
  }

  .receipt-subtitle {
    color: var(--color-fg-muted);
    font-size: 10px;
  }

  .receipt-divider {
    color: var(--color-border-strong);
    overflow: hidden;
    white-space: nowrap;
    user-select: none;
    margin: 4px 0;
  }

  .receipt-meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .receipt-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .receipt-items-head {
    display: flex;
    justify-content: space-between;
    font-weight: 600;
    color: var(--color-fg-dim);
  }

  .receipt-items-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .receipt-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .item-title {
    font-weight: 600;
  }

  .item-details {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: var(--color-fg-muted);
    font-size: 10px;
  }

  .mono-sku {
    color: var(--color-fg-dim);
  }

  .item-math strong {
    color: var(--color-fg);
    font-size: 11px;
  }

  .receipt-totals {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .receipt-total-major {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: var(--text-sm);
    font-weight: 800;
    color: var(--color-fg);
    padding: 2px 0;
  }

  .major-val {
    font-size: var(--text-md);
  }

  .receipt-footer {
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-top: 4px;
    color: var(--color-fg-muted);
    font-size: 10px;
  }

  .footer-tag {
    font-size: 9px;
    letter-spacing: 1px;
    color: var(--color-fg-dim);
  }

  .actions-bar {
    width: 100%;
    display: flex;
    justify-content: space-between;
    gap: var(--space-3);
    margin-top: var(--space-2);
  }
</style>
