<script lang="ts">
  import Icon from '../../../design-system/primitives/Icon.svelte'
  import type { TecidoRecord } from '../../../../shared/types'

  type Props = {
    tecido: TecidoRecord
    selected?: boolean
    onclick?: () => void
  }

  let { tecido, selected = false, onclick }: Props = $props()

  let specs = $derived.by(() => {
    const parts: string[] = []
    if (tecido.largura) parts.push(`${Number(tecido.largura).toFixed(2).replace('.', ',')} m`)
    if (tecido.gramaturaM2) parts.push(`${Math.round(Number(tecido.gramaturaM2))} g/m²`)
    else if (tecido.rendimento) parts.push(`${Number(tecido.rendimento).toFixed(2).replace('.', ',')} m/kg`)
    return parts.join(' • ')
  })
</script>

<button
  type="button"
  class="tecido-tile"
  class:selected
  {onclick}
  aria-pressed={selected}
>
  <div class="tile-head">
    <span class="sku-tag">{tecido.codigo}</span>
    {#if selected}
      <span class="selected-badge">
        <Icon name="check" size="sm" />
        <span>SELECIONADO</span>
      </span>
    {:else}
      <span class="indicator">SELECIONAR</span>
    {/if}
  </div>

  <div class="tile-body">
    <span class="tecido-name" title={tecido.nome}>{tecido.nome}</span>
    <span class="tecido-comp" title={tecido.composicao}>{tecido.composicao}</span>
  </div>

  {#if specs}
    <div class="tile-foot">
      <span class="tecido-specs">{specs}</span>
    </div>
  {/if}
</button>

<style>
  .tecido-tile {
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

  .tecido-tile:hover {
    background: var(--color-bg-elevated);
    box-shadow: inset 0 0 0 1px var(--color-border-strong);
  }

  .tecido-tile.selected {
    background: var(--color-bg-elevated);
    box-shadow: inset 0 0 0 2px var(--color-accent);
  }

  .tile-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    height: 20px;
    line-height: 100%;
  }

  .sku-tag {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    font-weight: 700;
    color: var(--color-accent);
    letter-spacing: var(--tracking-header);
    line-height: 100%;
  }

  .selected-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    color: var(--color-accent);
    letter-spacing: var(--tracking-label);
    line-height: 100%;
  }

  .indicator {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--color-fg-dim);
    letter-spacing: var(--tracking-label);
    line-height: 100%;
  }

  .tile-body {
    display: flex;
    flex-direction: column;
    gap: 3px;
    line-height: 100%;
    min-width: 0;
  }

  .tecido-name {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-fg);
    line-height: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tecido-comp {
    font-size: 11px;
    color: var(--color-fg-muted);
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

  .tecido-specs {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--color-fg-dim);
    line-height: 100%;
  }
</style>
