<script lang="ts">
  import Badge from '../../design-system/data-display/Badge.svelte'
  import Icon from '../../design-system/primitives/Icon.svelte'
  import Panel from '../../design-system/layout/Panel.svelte'
  import Etiquetas from './components/Etiquetas.svelte'
  import { router } from '../../shell/router.svelte'
</script>

{#if router.subRoute === 'etiquetas'}
  <Etiquetas />
{:else}
  <div class="shopee-page">
    <div class="module-toolbar">
      <div class="toolbar-title">
        <Icon name="cart" />
        <span>SHOPEE / OPERAÇÃO DE MARKETPLACE</span>
      </div>
      <Badge text="MÓDULO" tone="info" />
    </div>

    <div class="module-content">
      <header class="module-intro">
        <div>
          <h1>Shopee</h1>
          <p>Central de operações para os fluxos da loja Shopee.</p>
        </div>
        <span class="module-code">MOD / SHP</span>
      </header>

      <Panel title="Submódulos">
        <div class="submodule-list">
          <button
            type="button"
            class="submodule-row"
            onclick={() => router.navigate('shopee/etiquetas')}
          >
            <span class="row-icon"><Icon name="tag" /></span>
            <span class="row-copy">
              <span class="row-name">Etiquetas</span>
              <span class="row-description">Organização e preparação das etiquetas de envio.</span>
            </span>
            <span class="row-action">
              <span>Abrir</span>
              <Icon name="chevron" size="sm" />
            </span>
          </button>
        </div>
      </Panel>

      <div class="module-note">
        <span class="note-label">ESCOPO ATUAL</span>
        <span>O módulo começa pela estrutura de Etiquetas e pode receber novos submódulos conforme o fluxo operacional for definido.</span>
      </div>
    </div>
  </div>
{/if}

<style>
  .shopee-page,
  .module-content {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .shopee-page {
    height: 100%;
    background: var(--color-bg);
  }

  .module-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    height: 40px;
    min-height: 40px;
    padding: 0 var(--space-4);
    box-shadow: inset 0 -1px 0 0 var(--color-border);
    background: var(--color-bg-elevated);
    box-sizing: border-box;
  }

  .toolbar-title {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    min-width: 0;
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-header);
    color: var(--color-fg);
    line-height: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .module-content {
    gap: var(--space-5);
    flex: 1;
    overflow-y: auto;
    padding: var(--space-6);
    box-sizing: border-box;
  }

  .module-intro {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--space-4);
    min-height: 64px;
    padding-bottom: var(--space-4);
    border-bottom: var(--border-width) solid var(--color-border);
    box-sizing: border-box;
  }

  h1 {
    font-size: 28px;
    line-height: 100%;
    letter-spacing: var(--tracking-tight);
  }

  .module-intro p {
    max-width: 58ch;
    margin-top: var(--space-2);
    color: var(--color-fg-muted);
    font-family: var(--font-sans);
    font-size: var(--text-md);
    line-height: 100%;
  }

  .module-code,
  .note-label {
    color: var(--color-fg-dim);
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-header);
    line-height: 100%;
    text-transform: uppercase;
  }

  .submodule-list {
    display: flex;
    flex-direction: column;
  }

  .submodule-row {
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--space-3);
    min-height: 72px;
    padding: var(--space-3) var(--space-4);
    border: none;
    border-bottom: var(--border-width) solid var(--color-border);
    background: var(--color-bg);
    color: var(--color-fg);
    text-align: left;
    line-height: 100%;
    box-sizing: border-box;
  }

  .submodule-row:last-child {
    border-bottom: none;
  }

  .submodule-row:hover {
    background: var(--color-bg-sunken);
  }

  .submodule-row:focus-visible {
    outline: var(--border-width) solid var(--color-accent);
    outline-offset: -1px;
  }

  .row-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: var(--border-width) solid var(--color-border-strong);
    color: var(--color-info);
    box-sizing: border-box;
  }

  .row-copy {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    min-width: 0;
  }

  .row-name {
    font-size: var(--text-md);
    letter-spacing: var(--tracking-tight);
    line-height: 100%;
    text-transform: uppercase;
  }

  .row-description {
    color: var(--color-fg-muted);
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    line-height: 100%;
  }

  .row-action {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--color-fg-muted);
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-label);
    line-height: 100%;
    text-transform: uppercase;
  }

  .module-note {
    display: flex;
    align-items: flex-start;
    gap: var(--space-4);
    padding-top: var(--space-4);
    border-top: var(--border-width) solid var(--color-border);
    color: var(--color-fg-muted);
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    line-height: 100%;
  }

  .note-label {
    flex: 0 0 auto;
  }

  @media (max-width: 720px) {
    .module-content {
      padding: var(--space-4);
    }

    .module-intro {
      align-items: flex-start;
      flex-direction: column;
    }

    .module-note {
      flex-direction: column;
      gap: var(--space-2);
    }

    .submodule-row {
      grid-template-columns: 40px minmax(0, 1fr);
    }

    .row-action {
      grid-column: 2;
    }
  }
</style>
