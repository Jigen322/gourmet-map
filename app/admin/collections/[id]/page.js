import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { addDishToCollection, removeDishFromCollection } from '../actions'

export default async function AdminCollectionDishesPage({ params }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const { data: collection } = await supabase.from('collections').select('*').eq('id', params.id).single()
  if (!collection) redirect('/admin/collections')

  // このコレクションに登録済みの料理
  const { data: linked } = await supabase
    .from('collection_dishes')
    .select('dish_id, display_order, dishes(id, name, image_url)')
    .eq('collection_id', params.id)
    .order('display_order', { ascending: true })

  const linkedIds = new Set((linked || []).map((l) => l.dish_id))

  // 未登録の料理
  const { data: allDishes } = await supabase.from('dishes').select('id, name').order('name')
  const unlinked = (allDishes || []).filter((d) => !linkedIds.has(d.id))

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
      <Link href="/admin/collections" style={{ color: 'var(--color-ink-soft)', fontSize: '0.85rem' }}>← コレクション一覧</Link>
      <h2 style={{ marginTop: 12, marginBottom: 24 }}>「{collection.name}」の料理を管理</h2>

      <h3 style={{ marginBottom: 12 }}>登録済みの料理</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 40 }}>
        {(linked || []).map((l) => (
          <div key={l.dish_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'white', border: '1px solid var(--color-paper-dim)', borderRadius: 6 }}>
            <span>{l.dishes?.name}</span>
            <form action={removeDishFromCollection.bind(null, params.id, l.dish_id)}>
              <button type="submit" className="btn btn-danger" style={{ padding: '4px 12px', fontSize: '0.82rem' }}>外す</button>
            </form>
          </div>
        ))}
        {(!linked || linked.length === 0) && (
          <p style={{ color: 'var(--color-ink-soft)' }}>まだ料理が登録されていません</p>
        )}
      </div>

      <h3 style={{ marginBottom: 12 }}>料理を追加する</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {unlinked.map((dish) => (
          <div key={dish.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'white', border: '1px solid var(--color-paper-dim)', borderRadius: 6 }}>
            <span>{dish.name}</span>
            <form action={addDishToCollection.bind(null, params.id, dish.id)}>
              <button type="submit" className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '0.82rem' }}>追加</button>
            </form>
          </div>
        ))}
        {unlinked.length === 0 && (
          <p style={{ color: 'var(--color-ink-soft)' }}>追加できる料理がありません</p>
        )}
      </div>
    </div>
  )
}
