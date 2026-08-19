<script lang="ts">
  type Props = {
    name: string
    size?: 'sm' | 'md'
  }

  let { name, size = 'md' }: Props = $props()
</script>

<span class="icon" class:sm={size === 'sm'} aria-hidden="true">
  {#if name === 'grid'}
    <svg viewBox="0 0 14 14">
      <rect x="0.5" y="0.5" width="13" height="13" />
      <path d="M4.5 0.5 V13.5 M9.5 0.5 V13.5 M0.5 4.5 H13.5 M0.5 9.5 H13.5" />
    </svg>
  {:else if name === 'dash'}
    <svg viewBox="0 0 14 14">
      <rect x="0.5" y="0.5" width="13" height="13" />
      <rect class="fill" x="4.5" y="4.5" width="5" height="5" />
    </svg>
  {:else if name === 'settings'}
    <svg viewBox="0 0 14 14">
      <path d="M0.5 3.5 H13.5 M0.5 7.5 H13.5 M0.5 11.5 H13.5" />
      <rect class="fill" x="8" y="2" width="3" height="3" />
      <rect class="fill" x="3" y="6" width="3" height="3" />
      <rect class="fill" x="8" y="10" width="3" height="3" />
    </svg>
  {:else if name === 'system'}
    <svg viewBox="0 0 14 14">
      <path d="M7 0.5 L13.5 7 L7 13.5 L0.5 7 Z" />
      <rect class="fill" x="5.5" y="5.5" width="3" height="3" />
    </svg>
  {:else if name === 'chevron'}
    <svg viewBox="0 0 14 14">
      <path d="M5 2.5 L10 7 L5 11.5" />
    </svg>
  {:else if name === 'chevron-left'}
    <svg viewBox="0 0 14 14">
      <path d="M9 2.5 L4 7 L9 11.5" />
    </svg>
  {:else if name === 'arrow-left'}
    <svg viewBox="0 0 14 14">
      <path d="M11.5 7 H2.5 M6 3.5 L2.5 7 L6 10.5" />
    </svg>
  {:else if name === 'check'}
    <svg viewBox="0 0 14 14">
      <path d="M2.5 7.5 L5.5 10.5 L11.5 3.5" />
    </svg>
  {:else if name === 'empty'}
    <svg viewBox="0 0 14 14">
      <rect x="2.5" y="2.5" width="9" height="9" stroke-dasharray="2 2" />
    </svg>
  {:else if name === 'fabric'}
    <svg viewBox="0 0 14 14">
      <rect x="0.5" y="0.5" width="13" height="13" />
      <path d="M0.5 4.5 H13.5 M0.5 9.5 H13.5 M4.5 0.5 V13.5 M9.5 0.5 V13.5" />
    </svg>
  {:else if name === 'palette'}
    <svg viewBox="0 0 14 14">
      <rect x="0.5" y="0.5" width="5.5" height="5.5" />
      <rect class="fill" x="8" y="0.5" width="5.5" height="5.5" />
      <rect class="fill" x="0.5" y="8" width="5.5" height="5.5" />
      <rect x="8" y="8" width="5.5" height="5.5" />
    </svg>
  {:else if name === 'link'}
    <svg viewBox="0 0 14 14">
      <rect x="0.5" y="4.5" width="4.5" height="5" />
      <rect x="9" y="4.5" width="4.5" height="5" />
      <path d="M5 7 H9" />
    </svg>
  {:else if name === 'plus'}
    <svg viewBox="0 0 14 14">
      <path d="M7 1.5 V12.5 M1.5 7 H12.5" />
    </svg>
  {:else if name === 'copy'}
    <svg viewBox="0 0 14 14">
      <rect x="4.5" y="4.5" width="8" height="8" />
      <path d="M9.5 4.5 V1.5 H1.5 V9.5 H4.5" />
    </svg>
  {:else if name === 'search'}
    <svg viewBox="0 0 14 14">
      <circle cx="5.5" cy="5.5" r="3.5" />
      <path d="M8.5 8.5 L12.5 12.5" />
    </svg>
  {:else}
    <svg viewBox="0 0 14 14">
      <rect class="fill" x="6" y="6" width="2" height="2" />
    </svg>
  {/if}
</span>

<style>
  .icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    color: var(--color-fg-muted);
    vertical-align: middle;
    box-sizing: border-box;
    line-height: 100%;
  }

  .sm {
    width: 12px;
    height: 12px;
  }

  svg {
    display: block;
    width: 100%;
    height: 100%;
    fill: none;
    stroke: currentColor;
    stroke-width: 1;
    shape-rendering: crispEdges;
    box-sizing: border-box;
  }

  svg .fill {
    fill: currentColor;
    stroke: none;
  }
</style>
