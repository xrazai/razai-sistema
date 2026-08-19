import { app, Menu, MenuItemConstructorOptions } from 'electron'

export function setupAppMenu(): void {
  const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production'
  const isMac = process.platform === 'darwin'

  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' as const, label: 'Sobre Razai Sistema' },
              { type: 'separator' as const },
              { role: 'services' as const, label: 'Serviços' },
              { type: 'separator' as const },
              { role: 'hide' as const, label: 'Ocultar Razai Sistema' },
              { role: 'hideOthers' as const, label: 'Ocultar Outros' },
              { role: 'unhide' as const, label: 'Mostrar Tudo' },
              { type: 'separator' as const },
              { role: 'quit' as const, label: 'Encerrar Razai Sistema' }
            ]
          }
        ]
      : []),
    {
      label: 'Arquivo',
      submenu: [
        { role: 'reload', label: 'Recarregar' },
        { role: 'forceReload', label: 'Forçar Recarregamento' },
        { type: 'separator' },
        isMac
          ? { role: 'close', label: 'Fechar Janela' }
          : { role: 'quit', label: 'Sair' }
      ]
    },
    {
      label: 'Editar',
      submenu: [
        { role: 'undo', label: 'Desfazer' },
        { role: 'redo', label: 'Refazer' },
        { type: 'separator' },
        { role: 'cut', label: 'Recortar' },
        { role: 'copy', label: 'Copiar' },
        { role: 'paste', label: 'Colar' },
        { role: 'selectAll', label: 'Selecionar Tudo' }
      ]
    },
    {
      label: 'Visualização',
      submenu: [
        { role: 'resetZoom', label: 'Tamanho Original' },
        { role: 'zoomIn', label: 'Aumentar Zoom' },
        { role: 'zoomOut', label: 'Diminuir Zoom' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Alternar Tela Cheia' },
        ...(isDev
          ? [
              { type: 'separator' as const },
              { role: 'toggleDevTools' as const, label: 'Ferramentas de Desenvolvedor' }
            ]
          : [])
      ]
    },
    {
      label: 'Janela',
      submenu: [
        { role: 'minimize', label: 'Minimizar' },
        ...(isMac
          ? [
              { type: 'separator' as const },
              { role: 'front' as const, label: 'Trazer Todas para Frente' }
            ]
          : [{ role: 'close' as const, label: 'Fechar' }])
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}
