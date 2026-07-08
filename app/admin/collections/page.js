import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createCollection, deleteCollection } from './actions'
import { PREFECTURE_OPTIONS, CATEGORY_OPTIONS, SEASON_OPTIONS, SPOT_TYPE_OPTIONS } from '@/lib/constants'

export default async function AdminCollectionsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const { data: collections } = await supabase
    .from('collections')
    .select('*')
    .order('display_order', { ascending: true })

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2>コレクション管理</h2>
        <Link href="/admin" className="btn btn-ghost" style={{ color: 'var(--color-ink)', borderColor: 'var(--color-paper-dim)' }}>← ユーザー管理へ</Link>
      </div>

      {/* 既存コレクション一覧 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 48 }}>
        {(collections || []).map((col) => (
          <div key={col.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'white', border: '1px solid var(--color-paper-dim)', borderRadius: 6 }}>
            <div>
              <strong>{col.name}</strong>
              <span className="role-badge role-viewer" style={{ marginLeft: 8 }}>
                {col.collection_type === 'auto' ? '自動型' : '手動型'}
              </span>
              {col.description && <p style={{ fontSize: '0.82rem', color: 'var(--color-ink-soft)', margin: '2px 0 0' }}>{col.description}</p>}
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              {col.collection_type === 'manual' && (
                <Link href={`/admin/collections/${col.id}`} className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>料理を管理</Link>
              )}
              <form action={deleteCollection.bind(null, col.id)}>
                <button type="submit" className="btn btn-danger" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>削除</button>
              </form>
            </div>
          </div>
        ))}
        {(!collections || collections.length === 0) && (
          <p style={{ color: 'var(--color-ink-soft)' }}>コレクションがまだありません</p>
        )}
      </div>

      {/* 新規作成フォーム */}
      <h3 style={{ marginBottom: 16 }}>新しいコレクションを作成</h3>
      <form action={createCollection} style={{ background: 'white', border: '1px solid var(--color-paper-dim)', borderRadius: 8, padding: 24 }}>
        <div className="form-field">
          <label htmlFor="name">コレクション名 *</label>
          <input id="name" name="name" required placeholder="例: 広島グルメ" />
        </div>
        <div className="form-field">
          <label htmlFor="description">説明文</label>
          <input id="description" name="description" placeholder="例: 広島のご当地グルメを集めました" />
        </div>
        <div className="form-field">
          <label htmlFor="display_order">表示順(小さいほど上に表示)</label>
          <input id="display_order" name="display_order" type="number" defaultValue="0" style={{ width: 100 }} />
        </div>
        <div className="form-field">
          <label htmlFor="collection_type">種類 *</label>
          <select id="collection_type" name="collection_type">
            <option value="manual">手動型(料理を自分で選ぶ)</option>
            <option value="auto">自動型(条件で自動収集)</option>
          </select>
        </div>

        <details style={{ marginTop: 8, marginBottom: 16 }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-ink-soft)' }}>
            自動型の絞り込み条件(自動型を選んだ場合に設定)
          </summary>
          <div style={{ paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="form-field">
              <label>都道府県で絞る</label>
              <select name="filter_area">
                <option value="">指定なし</option>
                {PREFECTURE_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>ジャンルで絞る(カンマ区切りで複数可 例: 海鮮,肉)</label>
              <input name="filter_categories" placeholder="例: 海鮮,魚" />
            </div>
            <div className="form-field">
              <label>季節で絞る(カンマ区切りで複数可 例: 春,夏)</label>
              <input name="filter_seasons" placeholder="例: 春,夏" />
            </div>
            <div className="form-field">
              <label>投稿の種類で絞る</label>
              <select name="filter_spot_type">
                <option value="">指定なし</option>
                {SPOT_TYPE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem' }}>
              <input type="checkbox" name="filter_in_season_now" />
              今が旬の料理だけ表示する
            </label>
          </div>
        </details>

        <button type="submit" className="btn btn-primary">作成する</button>
      </form>
    </div>
  )
}
