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

  if (user) {
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    const role = profile?.role
    canEdit = ['editor', 'admin'].includes(role) ||
      (role === 'poster' && spot.created_by === user.id)
  }

  const period = formatPeriod(spot)

  return (
    <div className="container" style={{ maxWidth: 680, paddingTop: 40, paddingBottom: 60 }}>
      {/* パンくず */}
      <div style={{ fontSize: '0.85rem', color: 'var(--color-ink-soft)' }}>
        <Link href="/">トップ</Link>
        {spot.title && (
          <> › <Link href={`/dishes/${encodeURIComponent(spot.title)}`}>{spot.title}</Link></>
        )}
        {spot.shop_name && <> › {spot.shop_name}</>}
      </div>

      {/* 画像 */}
      <div style={{ position: 'relative', marginTop: 16 }}>
        {spot.image_url && (
          <img src={spot.image_url} alt={spot.title} style={{ width: '100%', borderRadius: 8, aspectRatio: '16/9', objectFit: 'cover' }} />
        )}
        <span className="hanko-stamp">{spot.area}</span>
      </div>

      {/* 一言コメント */}
      {spot.comment && (
        <p style={{ marginTop: 16, fontStyle: 'italic', color: 'var(--color-ink-soft)', fontSize: '1rem' }}>
          "{spot.comment}"
        </p>
      )}

      <h1 style={{ fontSize: '1.8rem', marginTop: 12 }}>{spot.title}</h1>
      {spot.shop_name && <p style={{ color: 'var(--color-ink-soft)', marginTop: 4, fontSize: '1rem' }}>{spot.shop_name}</p>}

      {/* エリア */}
      <p style={{ color: 'var(--color-ink-soft)', fontSize: '0.9rem', marginTop: 4 }}>
        {spot.area}{spot.sub_area ? ` › ${spot.sub_area}` : ''}
      </p>

      {spot.address && (
        <p style={{ color: 'var(--color-ink-soft)', fontSize: '0.85rem' }}>{spot.address}</p>
      )}

      {/* タグ */}
      <div className="tag-badges" style={{ marginTop: 12 }}>
        {(spot.categories || []).map((c) => (
          <span key={c} className="role-badge role-poster">{c}</span>
        ))}
        {(spot.seasons || []).map((s) => (
          <span key={s} className="role-badge role-viewer">{s}</span>
        ))}
        {period && <span className="role-badge role-admin">旬: {period}</span>}
      </div>

      {spot.description && (
        <p style={{ lineHeight: 1.8, marginTop: 20, whiteSpace: 'pre-wrap' }}>{spot.description}</p>
      )}

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
