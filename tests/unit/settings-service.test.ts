import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SettingsService } from '../../src/main/services/settings.service'

type MockMetaRow = {
  key: string
  value: string
}

let mockMeta: MockMetaRow[] = []

function resetMockDb() {
  mockMeta = [
    { key: 'schema_version', value: '3' },
    { key: 'default_route', value: 'tecidos' },
    { key: 'dense_grid', value: 'true' }
  ]
}

vi.mock('../../src/main/database/db', () => ({
  getDb: () => ({
    prepare: (sql: string) => {
      const normalizedSql = sql.trim().toUpperCase()

      if (normalizedSql.startsWith('SELECT VALUE FROM APP_META WHERE KEY = ?')) {
        return {
          get: (key: string) => {
            return mockMeta.find((r) => r.key === key)
          }
        }
      }

      if (normalizedSql.startsWith('SELECT KEY, VALUE FROM APP_META')) {
        return {
          all: () => {
            return [...mockMeta]
          }
        }
      }

      if (normalizedSql.startsWith('INSERT INTO APP_META')) {
        return {
          run: (key: string, value: string) => {
            const idx = mockMeta.findIndex((r) => r.key === key)
            if (idx >= 0) {
              mockMeta[idx].value = value
            } else {
              mockMeta.push({ key, value })
            }
            return { changes: 1 }
          }
        }
      }

      if (normalizedSql.startsWith('DELETE FROM APP_META')) {
        return {
          run: (key: string) => {
            const initialLen = mockMeta.length
            mockMeta = mockMeta.filter((r) => r.key !== key)
            return { changes: initialLen - mockMeta.length }
          }
        }
      }

      return {
        get: () => undefined,
        all: () => [],
        run: () => ({ changes: 0 })
      }
    }
  })
}))

describe('SettingsService (SQLite app_meta persistence)', () => {
  beforeEach(() => {
    resetMockDb()
  })

  it('should get an existing setting value by key', () => {
    const val = SettingsService.get('default_route')
    expect(val).toBe('tecidos')
  })

  it('should return null for non-existing setting key', () => {
    const val = SettingsService.get('non_existing_key')
    expect(val).toBeNull()
  })

  it('should return null for invalid key inputs', () => {
    expect(SettingsService.get('')).toBeNull()
    expect(SettingsService.get(null as any)).toBeNull()
  })

  it('should set and persist a new setting', () => {
    const ok = SettingsService.set('table_density', 'compact')
    expect(ok).toBe(true)

    const saved = SettingsService.get('table_density')
    expect(saved).toBe('compact')
  })

  it('should update an existing setting value', () => {
    const ok = SettingsService.set('default_route', 'cores')
    expect(ok).toBe(true)

    const updated = SettingsService.get('default_route')
    expect(updated).toBe('cores')
  })

  it('should get all settings as a key-value record', () => {
    const all = SettingsService.getAll()
    expect(all).toEqual({
      schema_version: '3',
      default_route: 'tecidos',
      dense_grid: 'true'
    })
  })

  it('should delete a setting by key', () => {
    const deleted = SettingsService.delete('dense_grid')
    expect(deleted).toBe(true)

    const check = SettingsService.get('dense_grid')
    expect(check).toBeNull()
  })
})
