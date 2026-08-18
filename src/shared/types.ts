export type AppInfo = {
  name: string
  version: string
}

export type DbHealth = {
  ok: boolean
  schemaVersion: string
}

export type RazaiApi = {
  getAppInfo: () => Promise<AppInfo>
  getDbHealth: () => Promise<DbHealth>
}

declare global {
  interface Window {
    razai: RazaiApi
  }
}
