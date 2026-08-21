<script lang="ts">
  import Icon from '../primitives/Icon.svelte'

  type Props = {
    accept?: string
    multiple?: boolean
    disabled?: boolean
    title?: string
    description?: string
    onfiles?: (files: File[]) => void | Promise<void>
  }

  let {
    accept = '.zip,.zpl,.txt',
    multiple = true,
    disabled = false,
    title = 'Arraste arquivos aqui',
    description = 'ou clique para selecionar',
    onfiles
  }: Props = $props()
  let input: HTMLInputElement
  let dragging = $state(false)

  function submit(list: FileList | null) {
    if (disabled || !list?.length) return
    const files = Array.from(list)
    void onfiles?.(multiple ? files : files.slice(0, 1))
    if (input) input.value = ''
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault()
    dragging = false
    submit(event.dataTransfer?.files ?? null)
  }
</script>

<button
  type="button"
  class="drop-zone"
  class:dragging
  {disabled}
  onclick={() => input?.click()}
  ondragenter={(event) => { event.preventDefault(); if (!disabled) dragging = true }}
  ondragover={(event) => event.preventDefault()}
  ondragleave={(event) => { if (event.currentTarget === event.target) dragging = false }}
  ondrop={handleDrop}
>
  <span class="icon-cell"><Icon name="copy" /></span>
  <span class="copy">
    <span class="title">{title}</span>
    <span class="description">{description}</span>
  </span>
  <span class="formats">ZIP · ZPL · TXT</span>
</button>

<input
  bind:this={input}
  class="native-input"
  type="file"
  {accept}
  {multiple}
  onchange={(event) => submit(event.currentTarget.files)}
/>

<style>
  .drop-zone {
    display: grid;
    grid-template-columns: 48px minmax(0, 1fr) auto;
    align-items: center;
    width: 100%;
    min-height: 88px;
    padding: var(--space-3) var(--space-4);
    border: var(--border-width) dashed var(--color-border-strong);
    background: var(--color-bg);
    color: var(--color-fg);
    text-align: left;
    box-sizing: border-box;
    cursor: pointer;
    line-height: 100%;
  }

  .drop-zone:hover:not(:disabled),
  .drop-zone.dragging {
    border-color: var(--color-accent);
    background: var(--color-bg-sunken);
  }

  .drop-zone:focus-visible {
    outline: var(--border-width) solid var(--color-accent);
    outline-offset: -1px;
  }

  .drop-zone:disabled { opacity: .5; cursor: not-allowed; }
  .icon-cell { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border: var(--border-width) solid var(--color-border); box-sizing: border-box; }
  .copy { display: flex; flex-direction: column; gap: var(--space-2); min-width: 0; }
  .title { font-size: var(--text-sm); font-weight: 700; letter-spacing: var(--tracking-label); text-transform: uppercase; line-height: 100%; }
  .description { color: var(--color-fg-muted); font-family: var(--font-sans); font-size: var(--text-sm); line-height: 100%; }
  .formats { color: var(--color-fg-dim); font-size: var(--text-xs); letter-spacing: var(--tracking-header); line-height: 100%; white-space: nowrap; }
  .native-input { display: none; }

  @media (max-width: 640px) {
    .drop-zone { grid-template-columns: 40px minmax(0, 1fr); }
    .formats { grid-column: 2; }
  }
</style>
