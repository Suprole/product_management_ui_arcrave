export type MonthRange = {
  /** YYYY-MM-DD */
  from: string
  /** YYYY-MM-DD */
  to: string
  /** e.g. "2025-12" */
  ym: string
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function toTokyoYmdParts(date = new Date()): { year: number; month: number; day: number } {
  const fmt = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = fmt.formatToParts(date)
  const year = Number(parts.find((p) => p.type === 'year')?.value)
  const month = Number(parts.find((p) => p.type === 'month')?.value)
  const day = Number(parts.find((p) => p.type === 'day')?.value)
  return { year, month, day }
}

function lastDayOfMonthUtc(year: number, month1to12: number) {
  // month1to12: 1..12
  return new Date(Date.UTC(year, month1to12, 0)).getUTCDate()
}

export function getCurrentMonthToDateTokyo(date = new Date()): MonthRange {
  const { year, month, day } = toTokyoYmdParts(date)
  return {
    ym: `${year}-${pad2(month)}`,
    from: `${year}-${pad2(month)}-01`,
    to: `${year}-${pad2(month)}-${pad2(day)}`,
  }
}

export function getPreviousMonthTokyo(date = new Date()): MonthRange {
  const { year, month } = toTokyoYmdParts(date)
  const prevYear = month === 1 ? year - 1 : year
  const prevMonth = month === 1 ? 12 : month - 1
  const lastDay = lastDayOfMonthUtc(prevYear, prevMonth)
  return {
    ym: `${prevYear}-${pad2(prevMonth)}`,
    from: `${prevYear}-${pad2(prevMonth)}-01`,
    to: `${prevYear}-${pad2(prevMonth)}-${pad2(lastDay)}`,
  }
}


