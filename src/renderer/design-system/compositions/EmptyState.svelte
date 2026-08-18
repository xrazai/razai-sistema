<script lang="ts">
  import type { Snippet } from 'svelte'
  import Icon from '../primitives/Icon.svelte'
  import Stack from '../layout/Stack.svelte'
  import Button from '../controls/Button.svelte'

  type Tone = 'neutral' | 'danger' | 'warn' | 'ok'

  type Props = {
    title?: string
    description?: string
    icon?: string
    tone?: Tone
    actionLabel?: string
    actionIcon?: string
    onaction?: () => void
    actions?: Snippet
    children?: Snippet
  }

  let {
    title = 'Sem dados',
    description = 'Nada para exibir neste compartimento.',
    icon = 'empty',
    tone = 'neutral',
    actionLabel,
    actionIcon,
    onaction,
    actions,
    children
  }: Props = $props()
</script>

<div class="empty" data-tone={tone}>
  <Stack gap="2">
    <div class="icon-wrap">
      <Icon name={icon} />
    </div>
    <div class="title">{title}</div>
    <div class="desc">{description}</div>

    {#if children}
      <div class="extra-content">
        {@render children()}
      </div>
    {/if}

    {#if actions}
      <div class="actions">
        {@render actions()}
      </div>
    {:else if actionLabel && onaction}
      <div class="actions">
        <Button variant="secondary" size="sm" onclick={onaction}>
          {#if actionIcon}
            <Icon name={actionIcon} size="sm" />
          {/if}
          <span>{actionLabel}</span>
        </Button>
      </div>
    {/if}
  </Stack>
</div>

<style>
  .empty {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 140px;
    padding: var(--space-5) var(--space-4);
    border: var(--border-width) dashed var(--color-border-strong);
    background: var(--color-bg);
    text-align: center;
    box-sizing: border-box;
    width: 100%;
  }

  .empty[data-tone='danger'] {
    border-color: var(--color-danger);
    background: var(--color-bg-sunken);
  }

  .empty[data-tone='danger'] .title {
    color: var(--color-danger);
  }

  .empty[data-tone='danger'] .icon-wrap :global(.icon) {
    color: var(--color-danger);
  }

  .empty[data-tone='warn'] {
    border-color: var(--color-warn);
  }

  .empty[data-tone='warn'] .title {
    color: var(--color-warn);
  }

  .empty[data-tone='warn'] .icon-wrap :global(.icon) {
    color: var(--color-warn);
  }

  .icon-wrap {
    display: flex;
    justify-content: center;
    margin-bottom: var(--space-1);
  }

  .title {
    font-size: var(--text-sm);
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
    font-weight: 600;
    color: var(--color-fg);
  }

  .desc {
    font-size: var(--text-xs);
    color: var(--color-fg-muted);
    font-family: var(--font-mono);
    max-width: 440px;
    line-height: var(--leading-normal);
  }

  .extra-content {
    margin-top: var(--space-2);
  }

  .actions {
    margin-top: var(--space-2);
    display: flex;
    justify-content: center;
    gap: var(--space-2);
  }
</style>
