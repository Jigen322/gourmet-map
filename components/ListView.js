'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { PREFECTURE_OPTIONS, CATEGORY_OPTIONS, SPOT_TYPE_OPTIONS_AS_CATEGORY } from '@/lib/constants'

// 同じtitle(料理名)のspotsをまとめたカード
function DishGroupCard({ title, spots }) {
  const representative = spots[0]
  const areas = [...new Set(spots.map((s) => s.area).filter(Boolean))]
  const allCategories = [...new Set(spots.flatMap((s) => s.categories || []))]

  return (
    <Link
      href={`/dishes/${encodeURIComponent(title)}`}
      className="spot-card"
      style={{ display: 'block', color: 'inherit' }}
    >
      {representative.image_url ? (
        <img src={representative.image_url} alt={title} className="spot-card-image" />
      ) : (
        <div className="spot-card-image" />
      )}

      {/* はんこスタンプ: 複数エリアは「全国」と表示 */}
      <span className="hanko-stamp">
        {areas.length === 1 ? areas[0].replace('県','').replace('府','').replace('都','').replace('道','') : '全国'}
      </span>

      {/* お店件数バッジ */}
      <span className="shop-count-badge">{spots.length}店舗</span>

      <div className="spot-card-body">
        <h3>{title}</h3>
        {representative.comment && (
          <p style={{ fontSize: '0.82rem', color: 'var(--color-ink-soft)', margin: '4px 0 6px', fontStyle: 'italic' }}>
            "{representative.comment}"
          </p>
        )}
        <div className="tag-badges">
          {allCategories.slice(0, 4).map((c) => (
            <span key={c} className="role-badge role-poster">{c}</span>
          ))}
        </div>
      </div>
    </Link>
  )
}

export default function ListView({ spots }) {
  const [area, setArea] = useState('')
  const [category, setCategory] = useState('')

  const usedAreas = useMemo(
    () => PREFECTURE_OPTIONS.filter((p) => spots.some((s) => s.area === p)),
    [spots]
  )

  const allCategories = useMemo(
    () => [...CATEGORY_OPTIONS, ...SPOT_TYPE_OPTIONS_AS_CATEGORY],
    []
  )

  // まず絞り込み
  const filtered = useMemo(() => {
    return spots.filter((s) => {
      if (area && s.area !== area) return false
      if (category && !(s.categories || []).includes(category)) return false
      return true
    })
  }, [spots, area, category])

  // 同じ料理名でグループ化
  const groups = useMemo(() => {
    const map = {}
    filtered.forEach((s) => {
      const key = s.title || '(料理名なし)'
      map[key] = map[key] || []
      map[key].push(s)
    })
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0], 'ja'))
  }, [filtered])

  return (
    <div>
      <div className="filter-bar">
        <select value={area} onChange={(e) => setArea(e.target.value)}>
          <option value="">都道府県で絞る</option>
          {usedAreas.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">ジャンルで絞る</option>
          {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {(area || category) && (
          <button
            type="button"
            className="btn btn-ghost"
            style={{ color: 'var(--color-ink)', borderColor: 'var(--color-paper-dim)' }}
            onClick={() => { setArea(''); setCategory('') }}
          >
            解除
          </button>
        )}
      </div>

      {groups.length > 0 ? (
        <div className="spots-grid">
          {groups.map(([title, groupSpots]) => (
            <DishGroupCard key={title} title={title} spots={groupSpots} />
          ))}
        </div>
      ) : (
        <div className="empty-state">該当する投稿が見つかりません</div>
      )}
    </div>
  )
}
