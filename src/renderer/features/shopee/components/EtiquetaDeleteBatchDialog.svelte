<script lang="ts">
  import { onMount } from 'svelte'
  import Button from '../../../design-system/controls/Button.svelte'
  import type { ShopeeEtiquetaLoteDetalhe } from '../../../../shared/shopee-etiquetas'

  type Props = {
    batch: ShopeeEtiquetaLoteDetalhe
    deleting: boolean
    error: string
    onconfirm: () => void
    onclose: () => void
  }

  let { batch, deleting, error, onconfirm, onclose }: Props = $props()
  let cancelControl = $state<HTMLSpanElement | null>(null)

  function close() {
    if (!deleting) onclose()
  }

  function handleBackdrop(event: MouseEvent) {
    if (event.target === event.currentTarget) close()
  }

  onMount(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    cancelControl?.querySelector('button')?.focus()
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    document.addEventListener('keydown', handleKeydown)
    return () => {
      document.removeEventListener('keydown', handleKeydown)
      previousFocus?.focus()
    }
  })
</script>

<div class="delete-backdrop" role="presentation" onclick={handleBackdrop}>
  <div class="delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-batch-title" aria-describedby="delete-batch-description">
    <header class="delete-head">
      <strong id="delete-batch-title">EXCLUIR LOTE</strong>
      <span>{batch.id.slice(0, 8).toUpperCase()}</span>
    </header>

    <div class="delete-body">
      <p id="delete-batch-description">As revisões, dados extraídos e arquivos originais deste lote serão removidos permanentemente.</p>
      <p class="preserved-note">Equivalências e configuração da Zebra serão preservadas.</p>
      <dl class="delete-summary">
        <div><dt>ARQUIVOS</dt><dd>{batch.fileCount}</dd></div>
        <div><dt>PÁGINAS</dt><dd>{batch.pageCount}</dd></div>
        <div><dt>REVISÕES</dt><dd>{batch.reviewCount}</dd></div>
      </dl>
      {#if error}<div class="delete-error" role="alert">{error}</div>{/if}
    </div>

    <footer class="delete-actions">
      <span bind:this={cancelControl}><Button variant="ghost" size="sm" onclick={close} disabled={deleting}>Cancelar</Button></span>
      <Button variant="danger" size="sm" onclick={onconfirm} disabled={deleting}>{deleting ? 'Excluindo...' : 'Excluir lote'}</Button>
    </footer>
  </div>
</div>

<style>
  .delete-backdrop { position: fixed; inset: 0; z-index: 1000; display: grid; place-items: center; padding: var(--space-3); background: rgb(0 0 0 / 72%); box-sizing: border-box; }
  .delete-dialog { width: min(520px, 100%); border: var(--border-width) solid var(--color-danger); background: var(--color-bg); color: var(--color-fg); box-sizing: border-box; }
  .delete-head, .delete-actions { display: flex; align-items: center; min-height: 40px; padding: 0 var(--space-3); box-sizing: border-box; }
  .delete-head { justify-content: space-between; gap: var(--space-3); box-shadow: inset 0 -1px 0 0 var(--color-border); background: var(--color-bg-elevated); }
  .delete-head strong, .delete-head span, .delete-summary dt, .delete-summary dd, .delete-error { font-size: var(--text-xs); line-height: 100%; letter-spacing: var(--tracking-label); }
  .delete-head strong { color: var(--color-danger); }
  .delete-head span { color: var(--color-fg-muted); }
  .delete-body { display: flex; flex-direction: column; gap: var(--space-3); padding: var(--space-4); }
  .delete-body p { max-width: 62ch; font-family: var(--font-sans); font-size: var(--text-sm); line-height: 100%; }
  .preserved-note { color: var(--color-fg-muted); }
  .delete-summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); margin: 0; border: var(--border-width) solid var(--color-border); }
  .delete-summary div { display: flex; flex-direction: column; justify-content: center; gap: var(--space-1); min-height: 56px; padding: 0 var(--space-3); box-shadow: inset -1px 0 0 0 var(--color-border); box-sizing: border-box; }
  .delete-summary div:last-child { box-shadow: none; }
  .delete-summary dt { color: var(--color-fg-muted); }
  .delete-summary dd { margin: 0; color: var(--color-fg); font-size: var(--text-lg); }
  .delete-error { min-height: 32px; padding: var(--space-2); border: var(--border-width) solid var(--color-danger); color: var(--color-danger); box-sizing: border-box; }
  .delete-actions { justify-content: flex-end; gap: var(--space-2); box-shadow: inset 0 1px 0 0 var(--color-border); }
  .delete-actions > span { display: inline-flex; line-height: 100%; }
</style>
