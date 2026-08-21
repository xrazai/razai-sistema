export type Route =
  | 'dashboard'
  | 'vendas'
  | 'pedidos'
  | 'relatorios'
  | 'shopee'
  | 'tecidos'
  | 'cores'
  | 'vinculos'
  | 'settings'
  | 'design-system'

export interface RouterState {
  path: string
  route: Route
  subRoute: string
  param: string | null
}

const VALID_ROUTES: Route[] = [
  'dashboard',
  'vendas',
  'pedidos',
  'relatorios',
  'shopee',
  'tecidos',
  'cores',
  'vinculos',
  'settings',
  'design-system'
]

function parseHash(hash: string): RouterState {
  const clean = hash.replace(/^#\/?/, '').trim()

  if (!clean) {
    return {
      path: 'dashboard',
      route: 'dashboard',
      subRoute: '',
      param: null
    }
  }

  const parts = clean.split('/').filter(Boolean)
  const root = parts[0] as Route
  const route: Route = VALID_ROUTES.includes(root) ? root : 'dashboard'
  const subRoute = parts.slice(1).join('/')
  const param = parts.length > 1 ? parts[1] : null

  return {
    path: clean,
    route,
    subRoute,
    param
  }
}

class Router {
  #state = $state<RouterState>({
    path: 'dashboard',
    route: 'dashboard',
    subRoute: '',
    param: null
  })

  constructor() {
    if (typeof window !== 'undefined') {
      this.#state = parseHash(window.location.hash)

      window.addEventListener('hashchange', () => {
        this.#state = parseHash(window.location.hash)
      })

      // Se a URL não tiver rota específica ou for a raiz, tenta carregar o módulo padrão salvo nas configurações
      if (!window.location.hash || window.location.hash === '#' || window.location.hash === '#/') {
        if (window.razai?.settings) {
          window.razai.settings.get('default_route').then((savedRoute) => {
            if (savedRoute && VALID_ROUTES.includes(savedRoute as Route)) {
              this.navigate(savedRoute)
            }
          }).catch(() => {})
        }
      }
    }
  }

  get path(): string {
    return this.#state.path
  }

  get route(): Route {
    return this.#state.route
  }

  get subRoute(): string {
    return this.#state.subRoute
  }

  get param(): string | null {
    return this.#state.param
  }

  navigate(to: string): void {
    if (typeof window !== 'undefined') {
      const target = to.startsWith('#') ? to : `#${to.replace(/^\//, '')}`
      if (window.location.hash !== target) {
        window.location.hash = target
      } else {
        this.#state = parseHash(target)
      }
    }
  }

  back(fallback = 'dashboard'): void {
    if (typeof window !== 'undefined') {
      if (window.history.length > 1) {
        window.history.back()
      } else {
        this.navigate(fallback)
      }
    }
  }
}

export const router = new Router()
