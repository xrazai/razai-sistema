<script lang="ts">
  import type { Snippet } from 'svelte'

  type Props = {
    cols?: 2 | 3 | 4 | 6 | 12
    bare?: boolean
    children?: Snippet
  }

  let { cols = 2, bare = false, children }: Props = $props()
</script>

<div class={`grid-system grid-cols-${cols}`} class:bare>
  {@render children?.()}
</div>

<style>
  .bare {
    border: none;
  }
</style>
