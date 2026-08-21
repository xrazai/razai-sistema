<script lang="ts">
  import { onMount } from 'svelte'
  import Button from '../../../design-system/controls/Button.svelte'
  import type { ShopeeEtiquetaSourcePreview } from '../../../../shared/shopee-etiquetas'

  type Props = {
    preview: ShopeeEtiquetaSourcePreview | null
    loading: boolean
    error: string
    onclose: () => void
    onretry: () => void
  }

  let { preview, loading, error, onclose, onretry }: Props = $props()
  let closeButton = $state<HTMLButtonElement | null>(null)

  function handleBackdrop(event: MouseEvent) {
    if (event.target === event.currentTarget) onclose()
  }

  onMount(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeButton?.focus()
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onclose()
    }
    document.addEventListener('keydown', handleKeydown)
    return () => {
      document.removeEventListener('keydown', handleKeydown)
      previousFocus?.focus()
    }
  })
</script>

<div class="preview-backdrop" role="presentation" onclick={handleBackdrop}>
  <div class="preview-dialog" role="dialog" aria-modal="true" aria-labelledby="source-preview-title">
    <header class="preview-head">
      <div class="preview-title">
        <strong id="source-preview-title">ORIGEM DA LEITURA OCR</strong>
        {#if preview}<span>{preview.entryName} · PÁGINA {preview.pageNumber}</span>{/if}
      </div>
      <button class="close-control" bind:this={closeButton} type="button" aria-label="Fechar origem da leitura" onclick={onclose}>FECHAR</button>
    </header>

    <div class="preview-stage" aria-live="polite">
      {#if loading}
        <div class="preview-state"><strong>RECONSTRUINDO ETIQUETA</strong><span>O ZPL original está sendo processado localmente.</span></div>
      {:else if error}
        <div class="preview-state error-state"><strong>ORIGEM INDISPONÍVEL</strong><span>{error}</span><Button size="sm" onclick={onretry}>Tentar novamente</Button></div>
      {:else if preview}
        <svg
          class="source-image"
          viewBox={`0 0 ${preview.width} ${preview.height}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`Etiqueta ${preview.entryName}, página ${preview.pageNumber}, com a linha lida pelo OCR destacada em vermelho`}
        >
          <image href={`data:${preview.mimeType};base64,${preview.imageBase64}`} width={preview.width} height={preview.height} />
          <rect
            class="source-highlight"
            x={preview.highlight.x}
            y={preview.highlight.y}
            width={preview.highlight.width}
            height={preview.highlight.height}
          />
        </svg>
      {/if}
    </div>

    <footer class="preview-footer">
      <span class="legend-mark" aria-hidden="true"></span>
      <span>ÁREA ASSOCIADA A ESTA LINHA</span>
      {#if preview}<span class="dimensions">{preview.width} × {preview.height} PX</span>{/if}
    </footer>
  </div>
</div>

<style>
  .preview-backdrop { position: fixed; inset: 0; z-index: 1000; display: grid; place-items: center; padding: 24px; background: rgb(0 0 0 / 72%); box-sizing: border-box; }
  .preview-dialog { display: grid; grid-template-rows: 40px minmax(0, 1fr) 40px; width: min(1200px, 100%); height: min(800px, calc(100vh - 48px)); border: var(--border-width) solid var(--color-border-strong); background: var(--color-bg); color: var(--color-fg); box-sizing: border-box; }
  .preview-head, .preview-footer { display: flex; align-items: center; min-width: 0; height: 40px; padding: 0 var(--space-3); box-sizing: border-box; }
  .preview-head { justify-content: space-between; gap: var(--space-3); box-shadow: inset 0 -1px 0 0 var(--color-border); background: var(--color-bg-elevated); }
  .preview-title { display: flex; align-items: center; gap: var(--space-3); min-width: 0; }
  .preview-title strong, .preview-title span, .preview-footer span, .close-control { font-size: var(--text-xs); line-height: 100%; letter-spacing: var(--tracking-label); }
  .preview-title strong { flex: 0 0 auto; }
  .preview-title span { overflow: hidden; color: var(--color-fg-muted); text-overflow: ellipsis; white-space: nowrap; }
  .close-control { height: 24px; padding: 0 var(--space-2); border: var(--border-width) solid var(--color-border-strong); background: var(--color-bg); color: var(--color-fg); font-family: var(--font-mono); box-sizing: border-box; }
  .close-control:hover, .close-control:focus-visible { border-color: var(--color-accent); }
  .preview-stage { display: grid; min-width: 0; min-height: 0; place-items: center; overflow: auto; padding: var(--space-4); background: var(--color-bg-sunken); box-sizing: border-box; }
  .source-image { display: block; width: 100%; height: 100%; max-width: 100%; max-height: 100%; }
  .source-highlight { fill: var(--color-danger); fill-opacity: .12; stroke: var(--color-danger); stroke-width: 3px; vector-effect: non-scaling-stroke; }
  .preview-state { display: flex; flex-direction: column; align-items: center; gap: var(--space-3); max-width: 520px; padding: var(--space-5); border: var(--border-width) solid var(--color-border); background: var(--color-bg); text-align: center; box-sizing: border-box; }
  .preview-state strong, .preview-state span { font-size: var(--text-xs); line-height: 100%; }
  .preview-state span { color: var(--color-fg-muted); }
  .error-state strong { color: var(--color-danger); }
  .preview-footer { gap: var(--space-2); box-shadow: inset 0 1px 0 0 var(--color-border); color: var(--color-fg-muted); }
  .legend-mark { width: 16px; height: 12px; border: 2px solid var(--color-danger); background: color-mix(in srgb, var(--color-danger) 12%, transparent); box-sizing: border-box; }
  .dimensions { margin-left: auto; }
  @media (max-width: 720px) {
    .preview-backdrop { padding: var(--space-2); }
    .preview-dialog { height: calc(100vh - 16px); }
    .preview-title span, .dimensions { display: none; }
  }
</style>
