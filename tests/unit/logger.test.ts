import { describe, it, expect } from 'vitest'
import { formatLogEntry } from '../../src/main/logger'

describe('Logger — Format Log Entries', () => {
  it('should format info log with timestamp and level', () => {
    const entry = formatLogEntry('INFO', 'Sistema iniciado com sucesso')
    expect(entry).toContain('[INFO]')
    expect(entry).toContain('Sistema iniciado com sucesso')
    expect(entry.endsWith('\n')).toBe(true)
  })

  it('should format error log with error message and stack', () => {
    const error = new Error('Falha de conexão')
    const entry = formatLogEntry('ERROR', 'Erro ao acessar banco', error)
    expect(entry).toContain('[ERROR]')
    expect(entry).toContain('Erro ao acessar banco')
    expect(entry).toContain('Falha de conexão')
  })

  it('should format object metadata as JSON', () => {
    const entry = formatLogEntry('WARN', 'Impressora ocupada', { port: 'COM3', retries: 3 })
    expect(entry).toContain('[WARN]')
    expect(entry).toContain('{"port":"COM3","retries":3}')
  })
})
