<script lang="ts">
  import Icon from '../primitives/Icon.svelte'
  import Stack from '../layout/Stack.svelte'

  type Props = {
    title?: string
    description?: string
  }

  let {
    title = 'Sem dados',
    description = 'Nada para exibir neste compartimento.'
  }: Props = $props()
</script>

<div class="empty">
  <Stack gap="2">
    <Icon name="empty" />
    <div class="title">{title}</div>
    <div class="desc">{description}</div>
  </Stack>
</div>

<style>
  .empty {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 120px;
    padding: var(--space-5);
    border: var(--border-width) dashed var(--color-border-strong);
    text-align: center;
  }

  .title {
    font-size: var(--text-sm);
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
  }

  .desc {
    font-size: var(--text-xs);
    color: var(--color-fg-muted);
  }
</style>
