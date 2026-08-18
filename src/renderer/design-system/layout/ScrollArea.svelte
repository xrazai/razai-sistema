<script lang="ts">
  import type { Snippet } from 'svelte'

  type Props = {
    children?: Snippet
  }

  let { children }: Props = $props()
</script>

<div class="scroll">
  {@render children?.()}
</div>

<style>
  .scroll {
    overflow: auto;
    min-height: 0;
    min-width: 0;
    height: 100%;
  }
</style>
