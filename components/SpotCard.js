import Link from 'next/link'

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

export default function SpotCard({ spot }) {
  const period = formatPeriod(spot)

  return (
    <Link href={`/spots/${spot.id}`} className="spot-card" style={{ display: 'block', color: 'inherit' }}>
      {spot.image_url ? (
        <img src={spot.image_url} alt={spot.title} className="spot-card-image" />
      ) : (
        <div className="spot-card-image" />
      )}
      <span className="hanko-stamp">{spot.area}</span>
      <div className="spot-card-body">
        {spot.spot_type && (
          <span className="role-badge role-editor" style={{ marginBottom: 6, display: 'inline-block' }}>
            {spot.spot_type}
          </span>
        )}
        <h3>{spot.title}</h3>
        {spot.shop_name && <p className="spot-card-shop">{spot.shop_name}</p>}

        <div className="tag-badges">
          {(spot.categories || []).map((c) => (
            <span key={c} className="role-badge role-poster">{c}</span>
          ))}
          {(spot.seasons || []).map((s) => (
            <span key={s} className="role-badge role-viewer">{s}</span>
          ))}
          {period && <span className="role-badge role-admin">{period}</span>}
        </div>
      </div>
    </Link>
  )
}
