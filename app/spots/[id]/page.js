import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { deleteSpot } from '@/app/spots/actions'

function formatPeriod(spot) {
  if (spot.season_date) {
    const d = new Date(spot.season_date)
    return `${d.getMonth() + 1}月${d.getDate()}日`
  }
  if (spot.season_month) {
    return `${spot.season_month}月${spot.season_decade || ''}`
  }
  return null
}

export default async function SpotDetailPage({ params }) {
  const supabase = createClient()

  const { data: spot } = await supabase
    .from('gourmet_spots')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!spot) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  let canEdit = false
  let canDeleteAny = false

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role
    canDeleteAny = role === 'editor' || role === 'admin'
    canEdit = canDeleteAny || (role === 'poster' && spot.created_by === user.id)
  }

  const period = formatPeriod(spot)

  return (
    <div className="container" style={{ maxWidth: 680, paddingTop: 40, paddingBottom: 60 }}>
      <Link href="/" style={{ color: 'var(--color-ink-soft)', fontSize: '0.9rem' }}>← 一覧に戻る</Link>

      <div style={{ position: 'relative', marginTop: 16 }}>
        {spot.image_url && (
          <img src={spot.image_url} alt={spot.title} style={{ width: '100%', borderRadius: 8, aspectRatio: '16/9', objectFit: 'cover' }} />
        )}
        <span className="hanko-stamp">{spot.area}</span>
      </div>

      {spot.spot_type && (
        <span className="role-badge role-editor" style={{ marginTop: 16, display: 'inline-block' }}>
          {spot.spot_type}
        </span>
      )}

      <h1 style={{ fontSize: '1.8rem', marginTop: 12 }}>{spot.title}</h1>
      {spot.shop_name && <p style={{ color: 'var(--color-ink-soft)', marginTop: 4 }}>{spot.shop_name}</p>}
      {spot.address && <p style={{ color: 'var(--color-ink-soft)', fontSize: '0.9rem' }}>{spot.address}</p>}

      <div className="tag-badges">
        {(spot.categories || []).map((c) => (
          <span key={c} className="role-badge role-poster">{c}</span>
        ))}
        {(spot.seasons || []).map((s) => (
          <span key={s} className="role-badge role-viewer">{s}</span>
        ))}
        {period && <span className="role-badge role-admin">旬: {period}</span>}
      </div>

      <p style={{ lineHeight: 1.8, marginTop: 20, whiteSpace: 'pre-wrap' }}>{spot.description}</p>

      {canEdit && (
        <div style={{ marginTop: 32, display: 'flex', gap: 12 }}>
          <Link href={`/spots/${spot.id}/edit`} className="btn btn-primary">編集する</Link>
          <form action={deleteSpot.bind(null, spot.id)}>
            <button type="submit" className="btn btn-danger">削除する</button>
          </form>
        </div>
      )}
    </div>
  )
}
