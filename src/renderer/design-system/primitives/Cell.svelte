<script lang="ts">
  import type { Snippet } from 'svelte'

  type Props = {
    pad?: boolean
    border?: boolean
    children?: Snippet
  }

  let { pad = true, border = true, children }: Props = $props()
</script>

<div class="cell" class:pad class:border>
  {@render children?.()}
</div>

<style>
  .cell {
    min-width: 0;
    background: var(--color-bg);
  }

  .pad {
    padding: var(--cell-pad);
  }

  .border {
    border: var(--border-width) solid var(--color-border);
  }
</style>
