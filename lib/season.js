// 「今日」が、その投稿の旬に当たるかどうかを判定するための関数

export function currentSeasonName(date = new Date()) {
  const m = date.getMonth() + 1
  if (m >= 3 && m <= 5) return '春'
  if (m >= 6 && m <= 8) return '夏'
  if (m >= 9 && m <= 11) return '秋'
  return '冬'
}

export function decadeOfDay(day) {
  if (day <= 10) return '上旬'
  if (day <= 20) return '中旬'
  return '下旬'
}

export function isInSeasonNow(spot, date = new Date()) {
  const month = date.getMonth() + 1
  const day = date.getDate()
  const decade = decadeOfDay(day)
  const season = currentSeasonName(date)

  if ((spot.seasons || []).includes('通年')) return true
  if ((spot.seasons || []).includes(season)) return true

  if (spot.season_month === month) {
    if (!spot.season_decade || spot.season_decade === decade) return true
  }

  if (spot.season_date) {
    const d = new Date(spot.season_date)
    if (d.getMonth() + 1 === month && d.getDate() === day) return true
  }

  return false
}
