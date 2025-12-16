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

/**
 * 実行環境依存を避けるため、Intl(timeZone)を使わず JST(UTC+9) の日付パーツを計算する。
 * - ブラウザ/Node/Vercel で一貫して動く
 */
function toTokyoYmdParts(date = new Date()): { year: number; month: number; day: number } {
  // date を JST(=UTC+9) に寄せた「UTCパーツ」を読む
  const JST_OFFSET_MS = 9 * 60 * 60 * 1000
  const jst = new Date(date.getTime() + JST_OFFSET_MS)
  const year = jst.getUTCFullYear()
  const month = jst.getUTCMonth() + 1
  const day = jst.getUTCDate()
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


