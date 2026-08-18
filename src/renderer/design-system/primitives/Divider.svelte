<script lang="ts">
  type Props = {
    orientation?: 'horizontal' | 'vertical'
  }

  let { orientation = 'horizontal' }: Props = $props()
</script>

<div class="divider" class:vertical={orientation === 'vertical'} role="separator"></div>

<style>
  .divider {
    background: var(--color-border);
    flex: none;
  }

  .divider:not(.vertical) {
    width: 100%;
    height: var(--border-width);
  }

  .vertical {
    width: var(--border-width);
    height: 100%;
    align-self: stretch;
  }
</style>
