'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { isInSeasonNow } from '@/lib/season'

const MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

const SEASON_MONTHS = {
  '春': [2, 3, 4],   // 3〜5月(0始まり)
  '夏': [5, 6, 7],
  '秋': [8, 9, 10],
  '冬': [11, 0, 1],
}

// 投稿ごとに「旬の範囲」を月単位(0〜11)の配列で返す
function getSeasonMonths(spot) {
  const active = new Set()

  if ((spot.seasons || []).includes('通年')) {
    for (let i = 0; i < 12; i++) active.add(i)
    return active
  }

  for (const s of (spot.seasons || [])) {
    for (const m of (SEASON_MONTHS[s] || [])) active.add(m)
  }

  if (spot.season_month != null) {
    active.add(spot.season_month - 1) // DBは1始まり
  }

  if (spot.season_date) {
    const d = new Date(spot.season_date)
    active.add(d.getMonth())
  }

  return active
}

function SeasonBar({ spot }) {
  const activeMonths = getSeasonMonths(spot)

  return (
    <div className="season-bar-row">
      {/* 左側: 投稿情報 */}
      <Link href={`/spots/${spot.id}`} className="season-bar-label">
        {spot.image_url && (
          <img src={spot.image_url} alt={spot.title} className="season-bar-thumb" />
        )}
        <div className="season-bar-info">
          <span className="season-bar-title">{spot.title}</span>
          <span className="season-bar-area">{spot.area}</span>
        </div>
      </Link>

      {/* 右側: 月ごとのバー */}
      <div className="season-bar-months">
        {Array.from({ length: 12 }, (_, i) => (
          <div
            key={i}
            className={`season-bar-cell ${activeMonths.has(i) ? 'active' : ''}`}
            title={activeMonths.has(i) ? `${i + 1}月が旬` : undefined}
          />
        ))}
      </div>
    </div>
  )
}

export default function CalendarView({ spots }) {
  const today = new Date()
  const currentMonth = today.getMonth()

  const inSeasonNow = useMemo(() => spots.filter((s) => isInSeasonNow(s, today)), [spots]) // eslint-disable-line

  // 旬情報が少しでもある投稿だけ表示(通年含む)
  const spotsWithSeason = useMemo(() =>
    spots.filter((s) =>
      (s.seasons && s.seasons.length > 0) ||
      s.season_month != null ||
      s.season_date != null
    ), [spots])

  return (
    <div>
      {/* 今が旬 */}
      <h3 style={{ marginBottom: 4 }}>🍴 今が旬の投稿</h3>
      <p className="field-hint">{today.getMonth() + 1}月{today.getDate()}日時点で旬の投稿です</p>

      {inSeasonNow.length > 0 ? (
        <div className="spots-grid" style={{ marginBottom: 48 }}>
          {inSeasonNow.map((spot) => (
            <Link key={spot.id} href={`/spots/${spot.id}`} className="spot-card" style={{ display: 'block', color: 'inherit' }}>
              {spot.image_url && <img src={spot.image_url} alt={spot.title} className="spot-card-image" />}
              <span className="hanko-stamp">{spot.area}</span>
              <div className="spot-card-body">
                <h3>{spot.title}</h3>
                {spot.shop_name && <p className="spot-card-shop">{spot.shop_name}</p>}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-state" style={{ padding: '20px 0 32px' }}>今が旬の投稿はまだありません</div>
      )}

      {/* 年間旬カレンダー */}
      <h3 style={{ marginBottom: 16 }}>📅 年間 旬カレンダー</h3>

      {spotsWithSeason.length === 0 ? (
        <div className="empty-state">旬の情報が登録された投稿がまだありません</div>
      ) : (
        <div className="season-calendar">
          {/* ヘッダー行(月ラベル) */}
          <div className="season-bar-row season-header-row">
            <div className="season-bar-label season-header-label" />
            <div className="season-bar-months">
              {MONTHS.map((m, i) => (
                <div key={i} className={`season-month-label ${i === currentMonth ? 'current' : ''}`}>
                  {m}
                </div>
              ))}
            </div>
          </div>

          {/* 現在月の縦線(今日の位置を示す) */}
          <div className="season-rows-wrapper">
            {/* 今月の位置にハイライト */}
            <div
              className="current-month-line"
              style={{ left: `calc(${(currentMonth / 12) * 100}% + ${(1 / 12) * 50}%)` }}
            />
            {spotsWithSeason.map((spot) => (
              <SeasonBar key={spot.id} spot={spot} />
            ))}
          </div>
        </div>
      )}

      <p className="field-hint" style={{ marginTop: 12 }}>
        ※ 旬の情報(季節・月・日付)が登録されている投稿のみ表示されます。青いバーが旬の時期です。現在の月は橙色でハイライトされています。
      </p>
    </div>
  )
}
