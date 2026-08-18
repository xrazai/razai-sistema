<script lang="ts">
  import type { Snippet } from 'svelte'

  type Props = {
    gap?: '0' | '1' | '2' | '3' | '4'
    direction?: 'vertical' | 'horizontal'
    children?: Snippet
  }

  let { gap = '3', direction = 'vertical', children }: Props = $props()
</script>

<div class="stack" data-gap={gap} data-dir={direction}>
  {@render children?.()}
</div>

<style>
  .stack {
    display: flex;
    min-width: 0;
  }

  .stack[data-dir='vertical'] {
    flex-direction: column;
  }

  .stack[data-dir='horizontal'] {
    flex-direction: row;
    align-items: center;
  }

  .stack[data-gap='0'] {
    gap: 0;
  }
  .stack[data-gap='1'] {
    gap: var(--space-1);
  }
  .stack[data-gap='2'] {
    gap: var(--space-2);
  }
  .stack[data-gap='3'] {
    gap: var(--space-3);
  }
  .stack[data-gap='4'] {
    gap: var(--space-4);
  }
</style>
