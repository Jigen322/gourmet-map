'use client'

import { useMemo, useState } from 'react'
import SpotCard from '@/components/SpotCard'
import { isInSeasonNow } from '@/lib/season'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

function getMonthCells(year, month) {
  const firstDay = new Date(year, month, 1)
  const lastDate = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDay.getDay(); i++) cells.push(null)
  for (let d = 1; d <= lastDate; d++) cells.push(d)
  return cells
}

function MiniMonth({ year, month, today, dayMap }) {
  const cells = getMonthCells(year, month)
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth()

  return (
    <div className="mini-month">
      <h4 className="mini-month-title">{month + 1}月</h4>
      <div className="mini-month-grid">
        {WEEKDAYS.map((w) => (
          <span key={w} className="mini-weekday">{w}</span>
        ))}
        {cells.map((d, i) => {
          const matches = d ? dayMap[d] : null
          const isToday = d && isCurrentMonth && d === today.getDate()
          return (
            <span
              key={i}
              className={`mini-day ${isToday ? 'today' : ''} ${matches ? 'has-spot' : ''}`}
              title={matches ? matches.map((s) => s.title).join('、') : undefined}
            >
              {d || ''}
              {matches && <span className="mini-dot" />}
            </span>
          )
        })}
      </div>
    </div>
  )
}

export default function CalendarView({ spots }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())

  const inSeasonNow = useMemo(() => spots.filter((s) => isInSeasonNow(s, today)), [spots]) // eslint-disable-line

  // 月日(年をまたいで毎年繰り返すものとして)ごとに投稿をまとめる
  const dayMapByMonth = useMemo(() => {
    const map = {}
    spots.forEach((s) => {
      if (!s.season_date) return
      const d = new Date(s.season_date)
      const m = d.getMonth()
      const day = d.getDate()
      map[m] = map[m] || {}
      map[m][day] = map[m][day] || []
      map[m][day].push(s)
    })
    return map
  }, [spots])

  return (
    <div>
      <h3 style={{ marginBottom: 4 }}>🍴 今が旬の投稿</h3>
      <p className="field-hint">{today.getMonth() + 1}月{today.getDate()}日時点で旬の投稿です</p>

      {inSeasonNow.length > 0 ? (
        <div className="spots-grid" style={{ marginBottom: 48 }}>
          {inSeasonNow.map((spot) => (
            <SpotCard key={spot.id} spot={spot} />
          ))}
        </div>
      ) : (
        <div className="empty-state" style={{ padding: '20px 0 48px' }}>今が旬の投稿はまだありません</div>
      )}

      <div className="calendar-header">
        <button type="button" className="btn btn-ghost cal-nav" onClick={() => setYear(year - 1)}>← {year - 1}年</button>
        <h3>{year}年 まるごとカレンダー</h3>
        <button type="button" className="btn btn-ghost cal-nav" onClick={() => setYear(year + 1)}>{year + 1}年 →</button>
      </div>

      <div className="year-grid">
        {Array.from({ length: 12 }, (_, i) => i).map((month) => (
          <MiniMonth
            key={month}
            year={year}
            month={month}
            today={today}
            dayMap={dayMapByMonth[month] || {}}
          />
        ))}
      </div>

      <p className="field-hint" style={{ marginTop: 12 }}>
        ※ 点(●)が付いている日は、「旬の日付」をピンポイント指定した投稿があります(マウスを乗せるとタイトルが見られます)。月単位・季節単位で指定した投稿は上の「今が旬の投稿」に表示されます。
      </p>
    </div>
  )
}
