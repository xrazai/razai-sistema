<script lang="ts">
  import type { Snippet } from 'svelte'

  type Props = {
    ratio?: string
    left?: Snippet
    right?: Snippet
  }

  let { ratio = '1fr 1fr', left, right }: Props = $props()
</script>

<div class="split" style={`grid-template-columns:${ratio}`}>
  <div class="pane">
    {@render left?.()}
  </div>
  <div class="pane">
    {@render right?.()}
  </div>
</div>

<style>
  .split {
    display: grid;
    min-height: 0;
    border: var(--border-width) solid var(--color-border);
  }

  .pane {
    min-width: 0;
    min-height: 0;
    border-right: var(--border-width) solid var(--color-border);
  }

  .pane:last-child {
    border-right: none;
  }
</style>
