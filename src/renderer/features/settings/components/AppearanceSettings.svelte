<script lang="ts">
  import { onMount } from 'svelte'
  import Inspector from '../../../design-system/compositions/Inspector.svelte'
  import Stack from '../../../design-system/layout/Stack.svelte'
  import Label from '../../../design-system/primitives/Label.svelte'
  import Select from '../../../design-system/controls/Select.svelte'
  import Toggle from '../../../design-system/controls/Toggle.svelte'
  import Badge from '../../../design-system/data-display/Badge.svelte'

  let defaultRoute = $state('dashboard')
  let denseGrid = $state(true)
  let autoFocusSearch = $state(true)
  let saveStatus = $state<string | null>(null)
  let saveTimeout: ReturnType<typeof setTimeout> | null = null

  const routeOptions = [
    { value: 'dashboard', label: 'Início (Padrão)' },
    { value: 'tecidos', label: 'Tecidos (Catálogo)' },
    { value: 'cores', label: 'Cores (Paleta)' },
    { value: 'vinculos', label: 'Vínculos' },
    { value: 'settings', label: 'Settings (Configurações)' },
    { value: 'design-system', label: 'Design System (Living Catalog)' }
  ]

  async function loadSettings() {
    if (typeof window !== 'undefined' && window.razai?.settings) {
      try {
        const all = await window.razai.settings.getAll()
        if (all.default_route) defaultRoute = all.default_route
        if (all.dense_grid !== undefined) denseGrid = all.dense_grid === 'true'
        if (all.auto_focus_search !== undefined) autoFocusSearch = all.auto_focus_search === 'true'
      } catch (err) {
        console.error('Erro ao carregar preferências:', err)
      }
    }
  }

  async function updateSetting(key: string, value: string) {
    if (typeof window !== 'undefined' && window.razai?.settings) {
      try {
        await window.razai.settings.set(key, value)
        saveStatus = 'Salvo no SQLite'
        if (saveTimeout) clearTimeout(saveTimeout)
        saveTimeout = setTimeout(() => {
          saveStatus = null
        }, 2000)
      } catch (err) {
        console.error('Erro ao salvar preferência:', err)
      }
    }
  }

  onMount(() => {
    loadSettings()
  })
</script>

<Inspector title="Aparência e Preferências de UI">
  <Stack gap="3">
    <div class="field-item">
      <div class="field-header">
        <Label text="Módulo Inicial Padrão" for="default-route-select" />
        {#if saveStatus}
          <Badge text={saveStatus} tone="ok" />
        {/if}
      </div>
      <Select
        id="default-route-select"
        options={routeOptions}
        bind:value={defaultRoute}
        onchange={() => updateSetting('default_route', defaultRoute)}
      />
      <span class="field-desc">Define qual tela é aberta automaticamente ao iniciar a aplicação.</span>
    </div>

    <div class="field-item">
      <Label text="Densidade Modular (Grid 40px)" />
      <Toggle
        bind:checked={denseGrid}
        label="Grid denso ativo (Ritmo de 40px)"
        onchange={() => updateSetting('dense_grid', String(denseGrid))}
      />
      <span class="field-desc">Mantém o alinhamento de 40px contínuo entre Sidebar, Topbar e Tabelas.</span>
    </div>

    <div class="field-item">
      <Label text="Foco Automático de Busca" />
      <Toggle
        bind:checked={autoFocusSearch}
        label="Focar automaticamente campo de busca"
        onchange={() => updateSetting('auto_focus_search', String(autoFocusSearch))}
      />
      <span class="field-desc">Ativa atalho rápido de busca nas telas de Tecidos e Cores.</span>
    </div>

    <div class="theme-info">
      <span class="caption">Tema: Industrial Brutalist Grid UI · Fundo: #0E0E0E · Linhas: 1px</span>
    </div>
  </Stack>
</Inspector>

<style>
  .field-item {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .field-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .field-desc {
    font-size: var(--text-xs);
    color: var(--color-fg-dim);
    font-family: var(--font-mono);
    line-height: 100%;
    margin-top: 2px;
  }

  .theme-info {
    padding-top: var(--space-2);
    border-top: var(--border-width) solid var(--color-border);
  }

  .caption {
    font-size: var(--text-xs);
    color: var(--color-fg-muted);
    font-family: var(--font-mono);
    line-height: 100%;
  }
</style>
