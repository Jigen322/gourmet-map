import Link from 'next/link'

function formatPeriod(dish) {
  if (dish.season_date) {
    const d = new Date(dish.season_date)
    return `${d.getMonth() + 1}月${d.getDate()}日`
  }
  if (dish.season_month) {
    return `${dish.season_month}月${dish.season_decade || ''}`
  }
  return null
}

export default function DishCard({ dish, shopCount }) {
  const period = formatPeriod(dish)

  return (
    <Link href={`/dishes/${dish.id}`} className="spot-card" style={{ display: 'block', color: 'inherit' }}>
      {dish.image_url ? (
        <img src={dish.image_url} alt={dish.name} className="spot-card-image" />
      ) : (
        <div className="spot-card-image" />
      )}

      {/* お店件数バッジ */}
      <span className="shop-count-badge">{shopCount ?? 0}店舗</span>

      <div className="spot-card-body">
        {dish.spot_type && (
          <span className="role-badge role-editor" style={{ marginBottom: 6, display: 'inline-block' }}>
            {dish.spot_type}
          </span>
        )}
        <h3>{dish.name}</h3>

        <div className="tag-badges">
          {(dish.categories || []).map((c) => (
            <span key={c} className="role-badge role-poster">{c}</span>
          ))}
          {(dish.seasons || []).map((s) => (
            <span key={s} className="role-badge role-viewer">{s}</span>
          ))}
          {period && <span className="role-badge role-admin">{period}</span>}
        </div>
      </div>
    </Link>
  )
}
