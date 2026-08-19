import { describe, expect, it } from 'vitest'
import {
  calendarYesterday,
  currentDateWindow,
  isTodayOrYesterday,
  parseShopeeTimeLabel,
  parseShopeeTimestamp,
  ymdInTimeZone
} from '../../src/main/services/agent/shopeeTime'
import { extractConversationsFromPayload } from '../../src/main/services/agent/shopeeConversationParser'

describe('shopeeTime', () => {
  const now = new Date('2026-08-19T18:00:00-03:00')

  it('calculates today and yesterday in America/Sao_Paulo', () => {
    const window = currentDateWindow(now)
    expect(window.todayYmd).toBe('2026-08-19')
    expect(window.yesterdayYmd).toBe('2026-08-18')
    expect(calendarYesterday('2026-08-19')).toBe('2026-08-18')
  })

  it('accepts clock times as today', () => {
    const parsed = parseShopeeTimeLabel('14:32', now)
    expect(parsed).not.toBeNull()
    expect(ymdInTimeZone(parsed!)).toBe('2026-08-19')
    expect(isTodayOrYesterday(parsed!, now)).toBe(true)
  })

  it('accepts ontem and rejects older calendar dates', () => {
    const yesterday = parseShopeeTimeLabel('ontem', now)
    const older = parseShopeeTimeLabel('10/08', now)
    expect(yesterday).not.toBeNull()
    expect(isTodayOrYesterday(yesterday!, now)).toBe(true)
    expect(older).not.toBeNull()
    expect(isTodayOrYesterday(older!, now)).toBe(false)
  })

  it('parses unix seconds and milliseconds', () => {
    const seconds = parseShopeeTimestamp(1755630000)
    const millis = parseShopeeTimestamp(1755630000000)
    expect(seconds?.toISOString()).toBe(millis?.toISOString())
  })
})

describe('shopeeConversationParser', () => {
  const now = new Date('2026-08-19T18:00:00-03:00')

  it('keeps only conversations from today or yesterday', () => {
    const today = Math.floor(now.getTime() / 1000)
    const yesterday = Math.floor(new Date('2026-08-18T12:00:00-03:00').getTime() / 1000)
    const older = Math.floor(new Date('2026-08-10T12:00:00-03:00').getTime() / 1000)

    const result = extractConversationsFromPayload(
      {
        data: {
          conversations: [
            {
              conversation_id: 'c1',
              to_name: 'Cliente Hoje',
              last_message_time: today,
              last_message: 'Tem linho cru?'
            },
            {
              conversation_id: 'c2',
              to_name: 'Cliente Ontem',
              last_message_time: yesterday,
              last_message: 'Qual o prazo?'
            },
            {
              conversation_id: 'c3',
              to_name: 'Cliente Antigo',
              last_message_time: older,
              last_message: 'Pedido de julho'
            }
          ]
        }
      },
      now
    )

    expect(result.recentes.map((c) => c.clienteNome)).toEqual(['Cliente Hoje', 'Cliente Ontem'])
    expect(result.ignoradas.map((c) => c.clienteNome)).toEqual(['Cliente Antigo'])
  })
})
