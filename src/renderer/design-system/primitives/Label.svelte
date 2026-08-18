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
    display: block;
    margin: 0 0 var(--space-1);
  }
</style>
