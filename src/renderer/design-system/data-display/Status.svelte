<script lang="ts">
  type Tone = 'neutral' | 'ok' | 'warn' | 'danger' | 'info'

  type Props = {
    label?: string
    tone?: Tone
  }

  let { label = 'IDLE', tone = 'neutral' }: Props = $props()
</script>

<span class="status" data-tone={tone}>
  <span class="dot" aria-hidden="true"></span>
  <span class="text">{label}</span>
</span>

<style>
  .status {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    height: 20px;
    padding: var(--space-1) 0;
    font-size: var(--text-xs);
    line-height: 100%;
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
    color: var(--color-fg-muted);
    box-sizing: border-box;
  }

  .dot {
    width: 6px;
    height: 6px;
    background: var(--color-fg-dim);
    border: var(--border-width) solid var(--color-border-strong);
  }

  .status[data-tone='ok'] .dot {
    background: var(--color-ok);
  }
  .status[data-tone='warn'] .dot {
    background: var(--color-warn);
  }
  .status[data-tone='danger'] .dot {
    background: var(--color-danger);
  }
  .status[data-tone='info'] .dot {
    background: var(--color-info);
  }
</style>
