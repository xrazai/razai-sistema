<script lang="ts">
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
    <span class="tecido-name" title={tecido.nome}>{tecido.nome}</span>
    <span class="sku-tag">{tecido.codigo}</span>
  </div>

  <div class="tile-foot">
    <span class="tecido-specs">{tecido.composicao}{specs ? ` • ${specs}` : ''}</span>
  </div>
</button>

<style>
  .tecido-tile {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 80px;
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
    min-height: 24px;
    line-height: 100%;
  }

  .tecido-name {
    font-size: var(--text-xs);
    font-weight: 700;
    color: var(--color-fg);
    line-height: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
  }

  .sku-tag {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    font-weight: 700;
    color: var(--color-accent);
    letter-spacing: var(--tracking-header);
    line-height: 100%;
    flex-shrink: 0;
  }

  .tile-foot {
    display: flex;
    align-items: center;
    height: 18px;
    line-height: 100%;
  }

  .tecido-specs {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-fg-muted);
    line-height: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
