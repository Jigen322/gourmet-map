import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import SpotCard from '@/components/SpotCard'

export default async function DishByNamePage({ params }) {
  const dishName = decodeURIComponent(params.name)
  const supabase = createClient()

  const { data: spots } = await supabase
    .from('gourmet_spots')
    .select('*')
    .eq('title', dishName)
    .order('created_at', { ascending: false })

  if (!spots || spots.length === 0) notFound()

  // 代表情報(最初の1件から取得)
  const representative = spots[0]
  const areas = [...new Set(spots.map((s) => s.area).filter(Boolean))]
  const allCategories = [...new Set(spots.flatMap((s) => s.categories || []))]
  const allSeasons = [...new Set(spots.flatMap((s) => s.seasons || []))]

  return (
    <div className="container" style={{ paddingBottom: 60 }}>
      {/* パンくず */}
      <div style={{ paddingTop: 24, fontSize: '0.85rem', color: 'var(--color-ink-soft)' }}>
        <Link href="/">トップ</Link> › <span>{dishName}</span>
      </div>

      {/* 料理ヘッダー */}
      <div style={{ display: 'flex', gap: 24, marginTop: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {representative.image_url && (
          <img
            src={representative.image_url}
            alt={dishName}
            style={{ width: 180, height: 180, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
          />
        )}
        <div style={{ flex: 1, minWidth: 200 }}>
          <h1 style={{ fontSize: '1.8rem', margin: '0 0 8px' }}>{dishName}</h1>
          {representative.comment && (
            <p style={{ color: 'var(--color-ink-soft)', fontStyle: 'italic', margin: '0 0 12px' }}>
              "{representative.comment}"
            </p>
          )}
          <div className="tag-badges">
            {allCategories.map((c) => (
              <span key={c} className="role-badge role-poster">{c}</span>
            ))}
            {allSeasons.map((s) => (
              <span key={s} className="role-badge role-viewer">{s}</span>
            ))}
          </div>
          {areas.length > 0 && (
            <p style={{ marginTop: 10, fontSize: '0.85rem', color: 'var(--color-ink-soft)' }}>
              エリア: {areas.join(' / ')}
            </p>
          )}
        </div>
      </div>

      {/* お店一覧 */}
      <h2 style={{ marginTop: 40, marginBottom: 16, fontSize: '1.2rem' }}>
        この料理が食べられるお店 ({spots.length}件)
      </h2>
      <div className="spots-grid">
        {spots.map((spot) => (
          <SpotCard key={spot.id} spot={spot} />
        ))}
      </div>
    </div>
  )
}
