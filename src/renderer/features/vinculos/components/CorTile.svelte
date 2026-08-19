<script lang="ts">
  import type { CorRecord } from '../../../../shared/types'

  type Props = {
    cor: CorRecord
    selected?: boolean
    disabled?: boolean
    alreadyLinked?: boolean
    onclick?: () => void
  }

  let { cor, selected = false, disabled = false, alreadyLinked = false, onclick }: Props = $props()
</script>

<button
  type="button"
  class="cor-tile"
  class:selected
  class:disabled
  class:already-linked={alreadyLinked}
  disabled={disabled || alreadyLinked}
  {onclick}
  aria-pressed={selected}
>
  <div class="tile-head">
    <div class="swatch-group">
      <span class="swatch" style="background-color: {cor.hex};"></span>
      <span class="sku-tag">{cor.codigo}</span>
    </div>

    {#if alreadyLinked}
      <span class="linked-badge">JÁ VINCULADO</span>
    {/if}
  </div>

  <div class="tile-body">
    <span class="cor-name" title={cor.nome}>{cor.nome}</span>
  </div>

  <div class="tile-foot">
    <span class="cor-hex">{cor.hex}</span>
  </div>
</button>

<style>
  .cor-tile {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 96px;
    padding: var(--space-2) var(--space-3);
    background: var(--color-bg);
    box-shadow: inset 0 0 0 1px var(--color-border);
    border: none;
    text-align: left;
    cursor: pointer;
    box-sizing: border-box;
    line-height: 100%;
    transition: background var(--motion-fast), box-shadow var(--motion-fast);
    outline: none;
    user-select: none;
  }

  .cor-tile:hover:not(:disabled) {
    background: var(--color-bg-elevated);
    box-shadow: inset 0 0 0 1px var(--color-border-strong);
  }

  .cor-tile.selected {
    background: var(--color-bg-elevated);
    box-shadow: inset 0 0 0 2px var(--color-accent);
  }

  .cor-tile:disabled {
    cursor: not-allowed;
    background: var(--color-bg-sunken);
    opacity: 0.55;
    box-shadow: inset 0 0 0 1px var(--color-border-subtle);
  }

  .tile-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    height: 20px;
    line-height: 100%;
  }

  .swatch-group {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    line-height: 100%;
  }

  .swatch {
    width: 14px;
    height: 14px;
    border-radius: var(--radius-sm);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2), 0 0 0 1px var(--color-border);
    flex-shrink: 0;
  }

  .sku-tag {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    font-weight: 700;
    color: var(--color-fg-dim);
    letter-spacing: var(--tracking-header);
    line-height: 100%;
  }

  .cor-tile.selected .sku-tag {
    color: var(--color-accent);
  }

  .linked-badge {
    font-family: var(--font-mono);
    font-size: 9px;
    font-weight: 600;
    color: var(--color-fg-dim);
    letter-spacing: var(--tracking-label);
    background: var(--color-bg-sunken);
    padding: 2px 4px;
    box-shadow: inset 0 0 0 1px var(--color-border);
    line-height: 100%;
  }

  .tile-body {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-width: 0;
    line-height: 100%;
    flex: 1;
  }

  .cor-name {
    font-size: var(--text-xs);
    font-weight: 700;
    color: var(--color-fg);
    line-height: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tile-foot {
    display: flex;
    align-items: center;
    height: 16px;
    line-height: 100%;
  }

  .cor-hex {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-fg-muted);
    line-height: 100%;
    letter-spacing: var(--tracking-tight);
  }
</style>
