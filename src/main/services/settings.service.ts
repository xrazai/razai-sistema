import { getDb } from '../database/db'

export class SettingsService {
  static get(key: string): string | null {
    if (!key || typeof key !== 'string') return null
    const db = getDb()
    const row = db.prepare('SELECT value FROM app_meta WHERE key = ?').get(key) as { value: string } | undefined
    return row ? row.value : null
  }

  static set(key: string, value: string): boolean {
    if (!key || typeof key !== 'string') return false
    const db = getDb()
    db.prepare(`
      INSERT INTO app_meta (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(key, String(value ?? ''))
    return true
  }

  static getAll(): Record<string, string> {
    const db = getDb()
    const rows = db.prepare('SELECT key, value FROM app_meta').all() as { key: string; value: string }[]
    const result: Record<string, string> = {}
    for (const row of rows) {
      result[row.key] = row.value
    }
    return result
  }

  static delete(key: string): boolean {
    if (!key || typeof key !== 'string') return false
    const db = getDb()
    const info = db.prepare('DELETE FROM app_meta WHERE key = ?').run(key)
    return info.changes > 0
  }
}
