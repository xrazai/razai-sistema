<script lang="ts">
  import type { Snippet } from 'svelte'

  type Props = {
    tone?: 'default' | 'elevated' | 'sunken'
    children?: Snippet
  }

  let { tone = 'default', children }: Props = $props()
</script>

<div class="surface" data-tone={tone}>
  {@render children?.()}
</div>

<style>
  .surface {
    background: var(--color-bg);
    border: var(--border-width) solid var(--color-border);
    box-sizing: border-box;
    line-height: 100%;
  }

  .surface[data-tone='elevated'] {
    background: var(--color-bg-elevated);
  }

  .surface[data-tone='sunken'] {
    background: var(--color-bg-sunken);
  }
</style>
