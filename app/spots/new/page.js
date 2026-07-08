'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { geocodeAddress } from '@/lib/geocode'
import { PREFECTURE_OPTIONS } from '@/lib/constants'

export default function NewSpotPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [dishes, setDishes] = useState([])
  const [dishId, setDishId] = useState(searchParams.get('dish_id') || '')
  const [form, setForm] = useState({ shop_name: '', area: '', address: '', description: '' })
  const [file, setFile] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('dishes').select('id, name').order('name').then(({ data }) => setDishes(data || []))
  }, [])

  function update(key, value) { setForm((f) => ({ ...f, [key]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('ログインが必要です'); setLoading(false); return }

    let image_url = null
    if (file) {
      const path = `${user.id}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage.from('gourmet-images').upload(path, file)
      if (uploadError) { setError('画像アップロードに失敗しました'); setLoading(false); return }
      const { data: urlData } = supabase.storage.from('gourmet-images').getPublicUrl(path)
      image_url = urlData.publicUrl
    }

    const geo = await geocodeAddress(form.address)

    // titleは料理名から自動設定
    const selectedDish = dishes.find((d) => d.id === dishId)

    const { error: insertError } = await supabase.from('gourmet_spots').insert({
      title: selectedDish ? selectedDish.name : form.shop_name,
      dish_id: dishId || null,
      shop_name: form.shop_name,
      area: form.area,
      address: form.address,
      description: form.description,
      image_url,
      latitude: geo?.latitude ?? null,
      longitude: geo?.longitude ?? null,
      created_by: user.id,
      // 旬・ジャンル情報は料理マスター側に持つため、ここでは空
      categories: [],
      seasons: [],
    })

    setLoading(false)
    if (insertError) { setError('投稿に失敗しました: ' + insertError.message); return }

    if (dishId) {
      router.push(`/dishes/${dishId}`)
    } else {
      router.push('/')
    }
    router.refresh()
  }

  return (
    <div className="container" style={{ maxWidth: 560, paddingTop: 40, paddingBottom: 60 }}>
      <h2 style={{ marginBottom: 8 }}>お店を投稿する</h2>
      <p className="field-hint">
        まず料理を選んでから、そのお店の情報を入力してください。
        料理がまだ登録されていない場合は先に
        <Link href="/dishes/new" style={{ color: 'var(--color-lantern-deep)', fontWeight: 600 }}> 料理を登録 </Link>
        してください。
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="dish">料理を選ぶ *</label>
          <select
            id="dish"
            required
            value={dishId}
            onChange={(e) => setDishId(e.target.value)}
          >
            <option value="">料理を選択してください</option>
            {dishes.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <p className="field-hint">
            <Link href="/dishes/new" style={{ color: 'var(--color-lantern-deep)' }}>+ 新しい料理を登録する</Link>
          </p>
        </div>

        <div className="form-field">
          <label htmlFor="shop_name">お店の名前 *</label>
          <input id="shop_name" required value={form.shop_name} onChange={(e) => update('shop_name', e.target.value)} placeholder="例: あきちゃん" />
        </div>

        <div className="form-field">
          <label htmlFor="area">地域(都道府県) *</label>
          <select id="area" required value={form.area} onChange={(e) => update('area', e.target.value)}>
            <option value="">選択してください</option>
            {PREFECTURE_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="address">住所(地図表示に使います)</label>
          <input id="address" value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="例: 広島県広島市中区○○町1-2-3" />
        </div>

        <div className="form-field">
          <label htmlFor="description">このお店のこだわり・メモ</label>
          <textarea id="description" rows={3} value={form.description} onChange={(e) => update('description', e.target.value)} />
        </div>

        <div className="form-field">
          <label htmlFor="image">写真</label>
          <input id="image" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>

        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
          {loading ? '投稿中…' : '投稿する'}
        </button>
      </form>
    </div>
  )
}
