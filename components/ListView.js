'use client'

import { useMemo, useState } from 'react'
import SpotCard from '@/components/SpotCard'
import { PREFECTURE_OPTIONS, CATEGORY_OPTIONS } from '@/lib/constants'

export default function ListView({ spots }) {
  const [area, setArea] = useState('')
  const [category, setCategory] = useState('')

  // 実際に投稿がある都道府県だけを選択肢に出す(候補が多すぎないように)
  const usedAreas = useMemo(
    () => PREFECTURE_OPTIONS.filter((p) => spots.some((s) => s.area === p)),
    [spots]
  )

  const filtered = useMemo(() => {
    return spots.filter((s) => {
      if (area && s.area !== area) return false
      if (category && !(s.categories || []).includes(category)) return false
      return true
    })
  }, [spots, area, category])

  return (
    <div>
      <div className="filter-bar">
        <select value={area} onChange={(e) => setArea(e.target.value)}>
          <option value="">都道府県で絞る</option>
          {usedAreas.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">ジャンルで絞る</option>
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {(area || category) && (
          <button
            type="button"
            className="btn btn-ghost"
            style={{ color: 'var(--color-ink)', borderColor: 'var(--color-paper-dim)' }}
            onClick={() => { setArea(''); setCategory('') }}
          >
            絞り込み解除
          </button>
        )}
      </div>

      {filtered.length > 0 ? (
        <div className="spots-grid">
          {filtered.map((spot) => (
            <SpotCard key={spot.id} spot={spot} />
          ))}
        </div>
      ) : (
        <div className="empty-state">該当する投稿が見つかりません</div>
      )}
    </div>
  )
}
