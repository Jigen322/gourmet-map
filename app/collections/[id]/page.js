import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import DishCard from '@/components/DishCard'
import { isInSeasonNow } from '@/lib/season'

export default async function CollectionDetailPage({ params }) {
  const supabase = createClient()

  const { data: collection } = await supabase
    .from('collections')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!collection) notFound()

  let dishes = []

  if (collection.collection_type === 'manual') {
    // 手動型: collection_dishesから料理を取得
    const { data } = await supabase
      .from('collection_dishes')
      .select('dish_id, display_order, dishes(*)')
      .eq('collection_id', collection.id)
      .order('display_order', { ascending: true })
    dishes = (data || []).map((d) => d.dishes).filter(Boolean)
  } else {
    // 自動型: フィルター条件で料理を取得
    let query = supabase.from('dishes').select('*')

    if (collection.filter_area) {
      // dishes自体はareaを持たないのでspots経由で絞る
      const { data: spotIds } = await supabase
        .from('gourmet_spots')
        .select('dish_id')
        .eq('area', collection.filter_area)
        .not('dish_id', 'is', null)
      const ids = [...new Set((spotIds || []).map((s) => s.dish_id))]
      if (ids.length === 0) {
        dishes = []
        goto_render = true
      } else {
        query = query.in('id', ids)
      }
    }

    if (collection.filter_categories && collection.filter_categories.length > 0) {
      query = query.overlaps('categories', collection.filter_categories)
    }
    if (collection.filter_seasons && collection.filter_seasons.length > 0) {
      query = query.overlaps('seasons', collection.filter_seasons)
    }
    if (collection.filter_spot_type) {
      query = query.eq('spot_type', collection.filter_spot_type)
    }

    const { data } = await query.order('created_at', { ascending: false })
    dishes = data || []

    // 今が旬フィルター
    if (collection.filter_in_season_now) {
      const now = new Date()
      dishes = dishes.filter((d) => isInSeasonNow(d, now))
    }
  }

  // 各料理のお店件数を取得
  const dishIds = dishes.map((d) => d.id)
  let shopCountMap = {}
  if (dishIds.length > 0) {
    const { data: counts } = await supabase
      .from('gourmet_spots')
      .select('dish_id')
      .in('dish_id', dishIds)
    ;(counts || []).forEach(({ dish_id }) => {
      shopCountMap[dish_id] = (shopCountMap[dish_id] || 0) + 1
    })
  }

  return (
    <div className="container" style={{ paddingBottom: 60 }}>
      {/* ヘッダー */}
      <div
        className="collection-hero"
        style={collection.image_url ? { backgroundImage: `url('${collection.image_url}')` } : {}}
      >
        <div className="collection-hero-inner">
          <Link href="/" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>← トップに戻る</Link>
          <h1 style={{ fontSize: '2rem', margin: '12px 0 8px' }}>{collection.name}</h1>
          {collection.description && (
            <p style={{ color: 'rgba(255,255,255,0.85)', margin: 0 }}>{collection.description}</p>
          )}
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', marginTop: 8 }}>
            {dishes.length}種類の料理
          </p>
        </div>
      </div>

      {dishes.length > 0 ? (
        <div className="spots-grid" style={{ paddingTop: 32 }}>
          {dishes.map((dish) => (
            <DishCard key={dish.id} dish={dish} shopCount={shopCountMap[dish.id] ?? 0} />
          ))}
        </div>
      ) : (
        <div className="empty-state">このコレクションにはまだ料理がありません</div>
      )}
    </div>
  )
}
