<script lang="ts">
  type Props = {
    text?: string
    for?: string
  }

  let { text = '', for: htmlFor }: Props = $props()
</script>

<label class="label field" for={htmlFor}>{text}</label>

<style>
  .field {
    display: flex;
    align-items: center;
    height: 16px;
    margin: 0 0 var(--space-1);
    font-size: var(--text-xs);
    line-height: 100%;
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
    color: var(--color-fg-muted);
    box-sizing: border-box;
  }
</style>
