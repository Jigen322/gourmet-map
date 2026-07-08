import { createClient } from '@/lib/supabase/server'
import CollectionCard from '@/components/CollectionCard'
import ViewSwitcher from '@/components/ViewSwitcher'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = createClient()

  // コレクション一覧(表示順)
  const { data: collections } = await supabase
    .from('collections')
    .select('*')
    .order('display_order', { ascending: true })

  // 各コレクションの料理件数を取得
  const collectionIds = (collections || []).map((c) => c.id)
  let dishCountMap = {}

  if (collectionIds.length > 0) {
    // 手動型: collection_dishes から件数
    const { data: manualCounts } = await supabase
      .from('collection_dishes')
      .select('collection_id')
      .in('collection_id', collectionIds)

    ;(manualCounts || []).forEach(({ collection_id }) => {
      dishCountMap[collection_id] = (dishCountMap[collection_id] || 0) + 1
    })
  }

  // 全投稿(地図・カレンダー用)
  const { data: spots } = await supabase
    .from('gourmet_spots')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="container">
      <div style={{ padding: '40px 0 0' }}>
        <h1 style={{ fontSize: '1.8rem' }}>みんなのご当地グルメ手帖</h1>
        <p style={{ color: 'var(--color-ink-soft)', marginTop: 8 }}>
          全国各地のご当地グルメを、旅のスタンプのように集めています。
        </p>
      </div>

      {/* コレクション一覧 */}
      {collections && collections.length > 0 && (
        <section style={{ paddingTop: 32 }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: 16 }}>特集・まとめ</h2>
          <div className="collection-grid">
            {collections.map((col) => (
              <CollectionCard
                key={col.id}
                collection={col}
                dishCount={dishCountMap[col.id] ?? 0}
              />
            ))}
          </div>
        </section>
      )}

      {/* 一覧/地図/カレンダー */}
      <ViewSwitcher spots={spots || []} />
    </div>
  )
}
