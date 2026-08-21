<script lang="ts">
  import Button from '../../../design-system/controls/Button.svelte'
  import Checkbox from '../../../design-system/controls/Checkbox.svelte'
  import Input from '../../../design-system/controls/Input.svelte'
  import Badge from '../../../design-system/data-display/Badge.svelte'
  import EtiquetaSourcePreviewDialog from './EtiquetaSourcePreviewDialog.svelte'
  import type { ShopeeEtiquetaCorrecaoInput, ShopeeEtiquetaItem, ShopeeEtiquetaSourcePreview } from '../../../../shared/shopee-etiquetas'

  type Props = { item: ShopeeEtiquetaItem; onsave: (input: ShopeeEtiquetaCorrecaoInput) => Promise<void> }
  let { item, onsave }: Props = $props()
  let initializedId = $state('')
  let orderId = $state('')
  let productRaw = $state('')
  let variationRaw = $state('')
  let fabricName = $state('')
  let colorName = $state('')
  let cutMeters = $state('')
  let widthMeters = $state('')
  let quantity = $state('1')
  let sku = $state('')
  let rememberFabric = $state(true)
  let rememberColor = $state(true)
  let rememberSku = $state(true)
  let rememberExact = $state(true)
  let saving = $state(false)
  let previewOpen = $state(false)
  let previewLoading = $state(false)
  let previewError = $state('')
  let preview = $state<ShopeeEtiquetaSourcePreview | null>(null)

  $effect(() => {
    if (initializedId === item.id) return
    initializedId = item.id
    orderId = item.orderId ?? ''
    productRaw = item.productRaw
    variationRaw = item.variationRaw
    fabricName = item.fabricName
    colorName = item.colorName
    cutMeters = item.cutMm ? String(item.cutMm / 1000).replace('.', ',') : ''
    widthMeters = item.widthMm ? String(item.widthMm / 1000).replace('.', ',') : ''
    quantity = String(item.quantity || 1)
    sku = item.sku
  })

  function toMillimeters(value: string): number | null {
    const meters = Number.parseFloat(value.replace(',', '.'))
    return Number.isFinite(meters) && meters > 0 ? Math.round(meters * 1000) : null
  }

  async function save() {
    const cutMm = toMillimeters(cutMeters)
    if (!cutMm) return
    saving = true
    try {
      await onsave({ itemId: item.id, orderId, productRaw, variationRaw, fabricName, colorName, cutMm,
        widthMm: toMillimeters(widthMeters), quantity: Number.parseInt(quantity, 10) || 0,
        sku, rememberFabric, rememberColor, rememberSku, rememberExact })
    } finally { saving = false }
  }

  function unavailableMessage(): string {
    if (item.sourcePreviewUnavailableReason === 'text_source') return 'Origem textual: esta etiqueta não possui imagem raster.'
    if (item.sourcePreviewUnavailableReason === 'file_expired') return 'O arquivo original expirou ou não está disponível.'
    return 'Reimporte o lote para visualizar a origem desta linha.'
  }

  async function loadPreview() {
    if (!item.sourcePreviewAvailable || previewLoading) return
    previewOpen = true
    previewLoading = true
    previewError = ''
    try {
      preview = await window.razai.shopee.etiquetas.getItemSourcePreview(item.id)
    } catch (error: any) {
      preview = null
      previewError = error?.message || 'Não foi possível reconstruir a etiqueta original.'
    } finally {
      previewLoading = false
    }
  }
</script>

<div class="review-item">
  <div class="review-head">
    <span>LINHA {item.rowOrder + 1} · {item.sku || 'SKU NÃO IDENTIFICADO'}</span>
    <div class="review-head-actions">
      <span title={item.sourcePreviewAvailable ? 'Mostrar etiqueta original e área lida pelo OCR' : unavailableMessage()}>
        <Button variant="secondary" size="sm" onclick={loadPreview} disabled={!item.sourcePreviewAvailable}>Ver origem</Button>
      </span>
      <span title={item.reviewReason ?? 'Confirme os dados extraídos antes de continuar.'}>
        <Badge text="REVISÃO NECESSÁRIA" tone="warn" />
      </span>
    </div>
  </div>
  <div class="fields">
    <label><span>Pedido</span><Input bind:value={orderId} /></label>
    <label class="wide"><span>Produto original</span><Input bind:value={productRaw} /></label>
    <label class="wide"><span>Variação original</span><Input bind:value={variationRaw} /></label>
    <label><span>Tecido normalizado</span><Input bind:value={fabricName} /></label>
    <label><span>Cor normalizada</span><Input bind:value={colorName} /></label>
    <label><span>Corte</span><Input bind:value={cutMeters} suffix="m" /></label>
    <label><span>Largura</span><Input bind:value={widthMeters} suffix="m" /></label>
    <label><span>Quantidade</span><Input bind:value={quantity} type="number" /></label>
    <label><span>SKU</span><Input bind:value={sku} /></label>
  </div>
  {#if item.reviewReason}<p class="review-reason">{item.reviewReason}</p>{/if}
  <div class="review-actions">
    <Checkbox bind:checked={rememberExact} label="Memorizar correção" />
    <Checkbox bind:checked={rememberFabric} label="Memorizar tecido" />
    <Checkbox bind:checked={rememberColor} label="Memorizar cor" />
    <Checkbox bind:checked={rememberSku} label="Memorizar SKU" />
    <Button variant="primary" size="sm" onclick={save} disabled={saving}>{saving ? 'Salvando...' : 'Salvar correção'}</Button>
  </div>
</div>

{#if previewOpen}
  <EtiquetaSourcePreviewDialog
    {preview}
    loading={previewLoading}
    error={previewError}
    onclose={() => { previewOpen = false }}
    onretry={loadPreview}
  />
{/if}

<style>
  .review-item { border: var(--border-width) solid var(--color-border); background: var(--color-bg); }
  .review-head { display: flex; align-items: center; justify-content: space-between; height: 40px; padding: 0 var(--space-3); box-shadow: inset 0 -1px 0 0 var(--color-border); font-size: var(--text-xs); letter-spacing: var(--tracking-label); line-height: 100%; box-sizing: border-box; }
  .review-head-actions { display: flex; align-items: center; gap: var(--space-2); flex: 0 0 auto; }
  .review-head-actions > span { display: inline-flex; line-height: 100%; }
  .fields { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--space-3); padding: var(--space-3); }
  label { display: flex; flex-direction: column; gap: var(--space-1); min-width: 0; }
  label > span { color: var(--color-fg-muted); font-size: var(--text-xs); letter-spacing: var(--tracking-label); line-height: 100%; text-transform: uppercase; }
  .wide { grid-column: span 2; }
  .review-reason { min-height: 32px; margin: 0; padding: var(--space-2) var(--space-3); box-shadow: inset 0 1px 0 0 var(--color-border); color: var(--color-warning); font-size: var(--text-xs); line-height: 100%; box-sizing: border-box; }
  .review-actions { display: flex; align-items: center; gap: var(--space-3); min-height: 48px; padding: var(--space-2) var(--space-3); box-shadow: inset 0 1px 0 0 var(--color-border); box-sizing: border-box; }
  .review-actions :global(button) { margin-left: auto; }
  @media (max-width: 900px) { .fields { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 640px) { .review-head > span:first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } }
</style>
