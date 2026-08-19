<script lang="ts">
  import Button from '../../../design-system/controls/Button.svelte'
  import Badge from '../../../design-system/data-display/Badge.svelte'
  import Icon from '../../../design-system/primitives/Icon.svelte'

  type Props = {
    code: string
    title: string
    description: string
    badge?: string
    badgeTone?: 'ok' | 'warn' | 'info' | 'neutral'
    actionLabel?: string
    onclick?: () => void
  }

  let {
    code,
    title,
    description,
    badge,
    badgeTone = 'neutral',
    actionLabel = 'Abrir Relatório',
    onclick
  }: Props = $props()
</script>

<div class="card">
  <div class="card-head">
    <div class="code-badge">{code}</div>
    {#if badge}
      <Badge text={badge} tone={badgeTone} />
    {/if}
  </div>

  <div class="card-body">
    <h3 class="card-title">{title}</h3>
    <p class="card-desc">{description}</p>
  </div>

  <div class="card-foot">
    <Button variant="secondary" size="sm" {onclick}>
      <span>{actionLabel}</span>
      <Icon name="chevron" size="sm" />
    </Button>
  </div>
</div>

<style>
  .card {
    display: flex;
    flex-direction: column;
    background: var(--color-bg-elevated);
    border: var(--border-width) solid var(--color-border);
    box-sizing: border-box;
    height: 100%;
  }

  .card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 36px;
    padding: 0 var(--space-3);
    background: var(--color-bg-sunken);
    box-shadow: inset 0 -1px 0 0 var(--color-border);
    box-sizing: border-box;
  }

  .code-badge {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: var(--tracking-label);
    color: var(--color-fg-muted);
    line-height: 100%;
    text-transform: uppercase;
  }

  .card-body {
    display: flex;
    flex-direction: column;
    padding: var(--space-3);
    flex: 1;
    gap: var(--space-2);
    box-sizing: border-box;
  }

  .card-title {
    font-family: var(--font-sans);
    font-size: var(--text-md);
    font-weight: 600;
    color: var(--color-fg);
    line-height: 100%;
    margin: 0;
  }

  .card-desc {
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    color: var(--color-fg-muted);
    line-height: 130%;
    margin: 0;
  }

  .card-foot {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    height: 40px;
    padding: 0 var(--space-3);
    box-shadow: inset 0 1px 0 0 var(--color-border);
    background: var(--color-bg-sunken);
    box-sizing: border-box;
  }
</style>
