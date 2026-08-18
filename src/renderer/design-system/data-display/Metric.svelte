<script lang="ts">
  type Props = {
    label: string
    value: string
    unit?: string
  }

  let { label, value, unit = '' }: Props = $props()
</script>

<div class="metric">
  <div class="label">{label}</div>
  <div class="value numeric">
    {value}{#if unit}<span class="unit">{unit}</span>{/if}
  </div>
</div>

<style>
  .metric {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    min-width: 0;
  }

  .value {
    font-size: var(--text-xl);
    color: var(--color-fg);
    line-height: var(--leading-tight);
  }

  .unit {
    margin-left: var(--space-1);
    font-size: var(--text-sm);
    color: var(--color-fg-dim);
  }
</style>
