import { app, BrowserWindow } from 'electron'
import electronUpdaterPkg from 'electron-updater'
import type { ProgressInfo, UpdateInfo as ElectronUpdateInfo } from 'electron-updater'
import { logger } from './logger'
import type { UpdateInfo, UpdaterCheckResult, UpdateStatus } from '../shared/types'

// Suporta CJS getter export e ESM interop
const autoUpdater =
  (electronUpdaterPkg as any)?.autoUpdater ||
  (electronUpdaterPkg as any)?.default?.autoUpdater ||
  electronUpdaterPkg

let currentStatus: UpdateStatus = 'idle'
let currentVersion: string = app.isPackaged ? app.getVersion() : '0.1.0'
let updateDetails: UpdateInfo = {
  status: 'idle',
  currentVersion
}

function broadcastStatus(info: UpdateInfo): void {
  updateDetails = { ...info, currentVersion }
  const windows = BrowserWindow.getAllWindows()
  for (const win of windows) {
    if (!win.isDestroyed()) {
      win.webContents.send('updater:status-changed', updateDetails)
    }
  }
}

let isInitialized = false

export function initAutoUpdater(checkOnStartup = false): void {
  if (isInitialized) return
  isInitialized = true

  // Configura feed GitHub oficial
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.allowPrerelease = false
  autoUpdater.allowDowngrade = false

  try {
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: 'xrazai',
      repo: 'razai-sistema'
    })
  } catch (err) {
    logger.warn('Não foi possível configurar o feedURL do autoUpdater:', err)
  }

  // Redireciona logs do electron-updater para o logger do Razai Sistema
  autoUpdater.logger = {
    info: (msg: any) => logger.info(`[autoUpdater] ${msg}`),
    warn: (msg: any) => logger.warn(`[autoUpdater] ${msg}`),
    error: (msg: any) => logger.error(`[autoUpdater] ${msg}`),
    debug: (msg: any) => logger.info(`[autoUpdater:debug] ${msg}`)
  }

  autoUpdater.on('checking-for-update', () => {
    currentStatus = 'checking'
    logger.info('Verificando existência de novas atualizações...')
    broadcastStatus({
      status: 'checking',
      currentVersion
    })
  })

  autoUpdater.on('update-available', (info: ElectronUpdateInfo) => {
    currentStatus = 'available'
    logger.info(`Nova versão encontrada: v${info.version}`)
    broadcastStatus({
      status: 'available',
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: typeof info.releaseNotes === 'string' ? info.releaseNotes : undefined,
      currentVersion
    })
  })

  autoUpdater.on('update-not-available', (info: ElectronUpdateInfo) => {
    currentStatus = 'not-available'
    logger.info(`Aplicação está na versão mais recente (v${info.version || currentVersion}).`)
    broadcastStatus({
      status: 'not-available',
      version: info.version,
      currentVersion
    })
  })

  autoUpdater.on('download-progress', (progress: ProgressInfo) => {
    currentStatus = 'downloading'
    broadcastStatus({
      status: 'downloading',
      progress: {
        percent: Math.round(progress.percent),
        bytesPerSecond: Math.round(progress.bytesPerSecond),
        transferred: progress.transferred,
        total: progress.total
      },
      currentVersion
    })
  })

  autoUpdater.on('update-downloaded', (info: ElectronUpdateInfo) => {
    currentStatus = 'downloaded'
    logger.info(`Atualização v${info.version} baixada e pronta para instalação.`)
    broadcastStatus({
      status: 'downloaded',
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: typeof info.releaseNotes === 'string' ? info.releaseNotes : undefined,
      currentVersion
    })
  })

  autoUpdater.on('error', (err: Error) => {
    currentStatus = 'error'
    const errorMsg = err?.message || 'Falha desconhecida na verificação de atualização'
    logger.error('Erro no mecanismo de auto-update:', err)
    broadcastStatus({
      status: 'error',
      error: errorMsg,
      currentVersion
    })
  })

  if (checkOnStartup && app.isPackaged) {
    // Aguarda alguns segundos após a inicialização para não interferir na renderização inicial
    setTimeout(() => {
      checkForUpdates().catch((err) => {
        logger.warn('Checagem automática de updates na inicialização falhou (silenciada):', err)
      })
    }, 5000)
  }
}

export async function checkForUpdates(): Promise<UpdaterCheckResult> {
  currentVersion = app.isPackaged ? app.getVersion() : '0.1.0'

  if (!app.isPackaged && process.env.NODE_ENV !== 'production') {
    logger.info('AutoUpdater: Modo de desenvolvimento detectado. Checagem simulada.')
    currentStatus = 'not-available'
    const result: UpdaterCheckResult = {
      ok: true,
      status: 'not-available',
      version: currentVersion
    }
    broadcastStatus({
      status: 'not-available',
      version: currentVersion,
      currentVersion
    })
    return result
  }

  try {
    currentStatus = 'checking'
    broadcastStatus({ status: 'checking', currentVersion })
    const result = await autoUpdater.checkForUpdates()
    const version = result?.updateInfo?.version
    return {
      ok: true,
      status: currentStatus,
      version
    }
  } catch (err: any) {
    currentStatus = 'error'
    const message = err?.message || 'Falha ao buscar atualizações no GitHub'
    logger.error('Falha ao verificar atualizações:', err)
    broadcastStatus({
      status: 'error',
      error: message,
      currentVersion
    })
    return {
      ok: false,
      status: 'error',
      error: message,
      version: currentVersion
    }
  }
}

export async function quitAndInstall(): Promise<void> {
  logger.info('Solicitada instalação da atualização baixada e reinício da aplicação.')
  autoUpdater.quitAndInstall(false, true)
}

export function getUpdateStatus(): UpdateInfo {
  return {
    ...updateDetails,
    status: currentStatus,
    currentVersion: app.isPackaged ? app.getVersion() : '0.1.0'
  }
}
