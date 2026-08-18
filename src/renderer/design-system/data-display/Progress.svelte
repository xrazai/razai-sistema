<script lang="ts">
  type Props = {
    value?: number
    label?: string
  }

  let { value = 0, label = '' }: Props = $props()

  const clamped = $derived(Math.max(0, Math.min(100, value)))
</script>

<div class="progress">
  {#if label}
    <div class="meta">
      <span class="label">{label}</span>
      <span class="pct numeric">{clamped}%</span>
    </div>
  {/if}
  <div class="track" role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
    <div class="fill" style={`width:${clamped}%`}></div>
  </div>
</div>

<style>
  .progress {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .meta {
    display: flex;
    justify-content: space-between;
  }

  .pct {
    font-size: var(--text-xs);
    color: var(--color-fg-muted);
  }

  .track {
    height: 8px;
    border: var(--border-width) solid var(--color-border-strong);
    background: var(--color-bg-sunken);
  }

  .fill {
    height: 100%;
    background: var(--color-accent);
  }
</style>
