import { app, BrowserWindow } from 'electron'
import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { openDatabase, closeDatabase } from './database/db'
import { registerIpcHandlers } from './ipc/handlers'

// Define identificador único e exclusivo no Windows para isolamento na barra de tarefas, notificações e processos
if (process.platform === 'win32') {
  app.setAppUserModelId('com.razai.sistema')
}

if (process.env.WSL_DISTRO_NAME) {
  app.disableHardwareAcceleration()
}

function getPreloadPath(): string {
  const mjs = join(__dirname, '../preload/index.mjs')
  const js = join(__dirname, '../preload/index.js')
  return existsSync(mjs) ? mjs : js
}

function createWindow(): void {
  const win = new BrowserWindow({
    title: 'Razai Sistema',
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#0e0e0e',
    show: false,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  win.once('ready-to-show', () => win.show())
  win.show()

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  openDatabase()
  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    closeDatabase()
    app.quit()
  }
})

app.on('before-quit', () => {
  closeDatabase()
})
