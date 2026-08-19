export const SHOPEE_TZ = 'America/Sao_Paulo'

export type DateWindow = {
  todayYmd: string
  yesterdayYmd: string
}

export function ymdInTimeZone(date: Date, timeZone = SHOPEE_TZ): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}

export function calendarYesterday(ymd: string): string {
  const [year, month, day] = ymd.split('-').map(Number)
  const utc = new Date(Date.UTC(year, month - 1, day))
  utc.setUTCDate(utc.getUTCDate() - 1)
  return utc.toISOString().slice(0, 10)
}

export function currentDateWindow(now = new Date(), timeZone = SHOPEE_TZ): DateWindow {
  const todayYmd = ymdInTimeZone(now, timeZone)
  return {
    todayYmd,
    yesterdayYmd: calendarYesterday(todayYmd)
  }
}

export function isTodayOrYesterday(date: Date, now = new Date(), timeZone = SHOPEE_TZ): boolean {
  const window = currentDateWindow(now, timeZone)
  const ymd = ymdInTimeZone(date, timeZone)
  return ymd === window.todayYmd || ymd === window.yesterdayYmd
}

export function parseShopeeTimestamp(value: unknown, now = new Date()): Date | null {
  if (value == null) return null

  if (typeof value === 'number' && Number.isFinite(value)) {
    return fromEpoch(value)
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    if (/^\d+(\.\d+)?$/.test(trimmed)) {
      return fromEpoch(Number(trimmed))
    }
    const iso = new Date(trimmed)
    if (!Number.isNaN(iso.getTime()) && /[T-]/.test(trimmed)) {
      return iso
    }
    return parseShopeeTimeLabel(trimmed, now)
  }

  return null
}

function fromEpoch(value: number): Date | null {
  let n = value
  if (n > 1e16) n = Math.floor(n / 1_000_000)
  else if (n > 1e14) n = Math.floor(n / 1_000)
  else if (n < 1e11) n = Math.floor(n * 1_000)
  const date = new Date(n)
  return Number.isNaN(date.getTime()) ? null : date
}

export function parseShopeeTimeLabel(label: string, now = new Date(), timeZone = SHOPEE_TZ): Date | null {
  const text = label.trim().toLowerCase()
  if (!text) return null

  if (/^(agora|agora mesmo|now)$/.test(text)) return now

  const relative = text.match(/^(\d+)\s*(s|seg|segs|segundo|segundos|min|mins|minuto|minutos|h|hr|hrs|hora|horas)$/)
  if (relative) {
    const amount = Number(relative[1])
    const unit = relative[2]
    const ms =
      /^(s|seg|segs|segundo|segundos)$/.test(unit)
        ? amount * 1000
        : /^(min|mins|minuto|minutos)$/.test(unit)
          ? amount * 60_000
          : amount * 3_600_000
    return new Date(now.getTime() - ms)
  }

  if (text === 'hoje') return now
  if (text === 'ontem') {
    const today = ymdInTimeZone(now, timeZone)
    return parseYmdAsNoon(calendarYesterday(today), timeZone)
  }

  const clock = text.match(/^(\d{1,2}):(\d{2})$/)
  if (clock) {
    const hours = Number(clock[1])
    const minutes = Number(clock[2])
    if (hours > 23 || minutes > 59) return null
    return clockOnYmd(ymdInTimeZone(now, timeZone), hours, minutes, timeZone)
  }

  const brDate = text.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?(?:\s+(\d{1,2}):(\d{2}))?$/)
  if (brDate) {
    const day = Number(brDate[1])
    const month = Number(brDate[2])
    const rawYear = brDate[3]
    const year = rawYear
      ? rawYear.length === 2
        ? 2000 + Number(rawYear)
        : Number(rawYear)
      : Number(ymdInTimeZone(now, timeZone).slice(0, 4))
    const hours = brDate[4] != null ? Number(brDate[4]) : 12
    const minutes = brDate[5] != null ? Number(brDate[5]) : 0
    const ymd = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return clockOnYmd(ymd, hours, minutes, timeZone)
  }

  return null
}

function parseYmdAsNoon(ymd: string, timeZone: string): Date {
  return clockOnYmd(ymd, 12, 0, timeZone)
}

function clockOnYmd(ymd: string, hours: number, minutes: number, timeZone: string): Date {
  const isoGuess = new Date(`${ymd}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00-03:00`)
  if (timeZone === SHOPEE_TZ && !Number.isNaN(isoGuess.getTime())) {
    return isoGuess
  }
  return new Date(`${ymd}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`)
}
