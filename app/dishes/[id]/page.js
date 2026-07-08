import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import SpotCard from '@/components/SpotCard'

export default async function DishDetailPage({ params }) {
  const supabase = createClient()

  const { data: dish } = await supabase
    .from('dishes')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!dish) notFound()

  // この料理に紐づくお店一覧
  const { data: spots } = await supabase
    .from('gourmet_spots')
    .select('*')
    .eq('dish_id', dish.id)
    .order('created_at', { ascending: false })

  const { data: { user } } = await supabase.auth.getUser()
  let canEdit = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    canEdit = ['editor', 'admin'].includes(profile?.role) ||
      (profile?.role === 'poster' && dish.created_by === user.id)
  }

  return (
    <div className="container" style={{ paddingBottom: 60 }}>
      {/* パンくずリスト */}
      <div style={{ paddingTop: 24, fontSize: '0.85rem', color: 'var(--color-ink-soft)' }}>
        <Link href="/">トップ</Link> &rsaquo; <span>{dish.name}</span>
      </div>

      {/* 料理情報 */}
      <div style={{ display: 'flex', gap: 24, marginTop: 20, flexWrap: 'wrap' }}>
        {dish.image_url && (
          <img
            src={dish.image_url}
            alt={dish.name}
            style={{ width: 200, height: 200, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
          />
        )}
        <div style={{ flex: 1, minWidth: 200 }}>
          {dish.spot_type && (
            <span className="role-badge role-editor" style={{ marginBottom: 8, display: 'inline-block' }}>
              {dish.spot_type}
            </span>
          )}
          <h1 style={{ fontSize: '1.8rem', margin: '4px 0 8px' }}>{dish.name}</h1>
          <div className="tag-badges">
            {(dish.categories || []).map((c) => (
              <span key={c} className="role-badge role-poster">{c}</span>
            ))}
            {(dish.seasons || []).map((s) => (
              <span key={s} className="role-badge role-viewer">{s}</span>
            ))}
          </div>
          {dish.description && (
            <p style={{ marginTop: 12, lineHeight: 1.8, color: 'var(--color-ink)' }}>{dish.description}</p>
          )}
          {canEdit && (
            <Link href={`/dishes/${dish.id}/edit`} className="btn btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>
              料理情報を編集
            </Link>
          )}
        </div>
      </div>

      {/* お店一覧 */}
      <h2 style={{ marginTop: 40, marginBottom: 16, fontSize: '1.2rem' }}>
        この料理が食べられるお店 ({spots?.length ?? 0}件)
      </h2>

      {spots && spots.length > 0 ? (
        <div className="spots-grid">
          {spots.map((spot) => (
            <SpotCard key={spot.id} spot={spot} />
          ))}
        </div>
      ) : (
        <div className="empty-state">まだお店が登録されていません</div>
      )}
    </div>
  )
}
