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
    justify-content: center;
    gap: var(--space-1);
    min-height: 48px;
    box-sizing: border-box;
    line-height: 100%;
  }

  .label {
    height: 16px;
    font-size: var(--text-xs);
    line-height: 100%;
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }

  .value {
    height: 24px;
    display: flex;
    align-items: baseline;
    font-size: var(--text-xl);
    color: var(--color-fg);
    line-height: 100%;
  }

  .unit {
    margin-left: var(--space-1);
    font-size: var(--text-sm);
    color: var(--color-fg-dim);
  }
</style>
