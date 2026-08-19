import { describe, it, expect, beforeEach, vi } from 'vitest'

const eventListeners: Record<string, Function[]> = {}

vi.mock('electron', () => ({
  app: {
    isPackaged: false,
    getVersion: () => '0.1.0'
  },
  BrowserWindow: {
    getAllWindows: () => []
  }
}))

vi.mock('electron-updater', () => {
  const autoUpdater = {
    autoDownload: false,
    autoInstallOnAppQuit: false,
    allowPrerelease: false,
    allowDowngrade: false,
    setFeedURL: vi.fn(),
    logger: null as any,
    on: (event: string, callback: Function) => {
      if (!eventListeners[event]) eventListeners[event] = []
      eventListeners[event].push(callback)
      return autoUpdater
    },
    checkForUpdates: vi.fn().mockResolvedValue({
      updateInfo: { version: '0.2.0', releaseDate: '2026-08-20' }
    }),
    quitAndInstall: vi.fn()
  }
  return {
    default: { autoUpdater },
    autoUpdater
  }
})

vi.mock('../../src/main/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}))

import { initAutoUpdater, checkForUpdates, getUpdateStatus, quitAndInstall } from '../../src/main/updater'
import { autoUpdater } from 'electron-updater'

describe('Updater Module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes auto updater with official feed repository', () => {
    initAutoUpdater(false)
    expect(autoUpdater.setFeedURL).toHaveBeenCalledWith({
      provider: 'github',
      owner: 'xrazai',
      repo: 'razai-sistema'
    })
    expect(autoUpdater.autoDownload).toBe(true)
    expect(autoUpdater.autoInstallOnAppQuit).toBe(true)
  })

  it('handles simulated update check in development environment', async () => {
    const result = await checkForUpdates()
    expect(result.ok).toBe(true)
    expect(result.status).toBe('not-available')
    expect(result.version).toBe('0.1.0')
  })

  it('returns current update status', () => {
    const status = getUpdateStatus()
    expect(status).toHaveProperty('status')
    expect(status.currentVersion).toBe('0.1.0')
  })

  it('dispatches quitAndInstall to electron-updater', async () => {
    await quitAndInstall()
    expect(autoUpdater.quitAndInstall).toHaveBeenCalledWith(false, true)
  })

  it('handles event listeners correctly when triggered', () => {
    initAutoUpdater(false)
    if (eventListeners['checking-for-update']?.[0]) {
      eventListeners['checking-for-update'][0]()
      expect(getUpdateStatus().status).toBe('checking')
    }

    if (eventListeners['update-available']?.[0]) {
      eventListeners['update-available'][0]({
        version: '0.2.0',
        releaseDate: '2026-08-20'
      })
      const status = getUpdateStatus()
      expect(status.status).toBe('available')
      expect(status.version).toBe('0.2.0')
    }

    if (eventListeners['download-progress']?.[0]) {
      eventListeners['download-progress'][0]({
        percent: 45.2,
        bytesPerSecond: 102400,
        transferred: 452000,
        total: 1000000
      })
      const status = getUpdateStatus()
      expect(status.status).toBe('downloading')
      expect(status.progress?.percent).toBe(45)
    }

    if (eventListeners['update-downloaded']?.[0]) {
      eventListeners['update-downloaded'][0]({
        version: '0.2.0'
      })
      expect(getUpdateStatus().status).toBe('downloaded')
    }

    if (eventListeners['error']?.[0]) {
      eventListeners['error'][0](new Error('Network offline'))
      const status = getUpdateStatus()
      expect(status.status).toBe('error')
      expect(status.error).toContain('Network offline')
    }
  })
})
