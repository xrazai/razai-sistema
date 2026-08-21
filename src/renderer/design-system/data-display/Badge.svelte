<script lang="ts">
  type Props = {
    text: string
    tone?: 'neutral' | 'ok' | 'warn' | 'danger' | 'info'
  }

  let { text, tone = 'neutral' }: Props = $props()
</script>

<span class="badge" data-tone={tone} title={text} aria-label={text}>
  <span class="badge-text">{text}</span>
</span>

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    min-width: 0;
    max-width: 100%;
    height: 20px;
    padding: var(--space-1) var(--space-2);
    border: var(--border-width) solid var(--color-border-strong);
    font-size: var(--text-xs);
    line-height: 100%;
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
    color: var(--color-fg-muted);
    background: var(--color-bg-elevated);
    box-sizing: border-box;
  }

  .badge-text {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .badge[data-tone='ok'] {
    color: var(--color-ok);
    border-color: var(--color-ok);
  }
  .badge[data-tone='warn'] {
    color: var(--color-warn);
    border-color: var(--color-warn);
  }
  .badge[data-tone='danger'] {
    color: var(--color-danger);
    border-color: var(--color-danger);
  }
  .badge[data-tone='info'] {
    color: var(--color-info);
    border-color: var(--color-info);
  }
</style>
