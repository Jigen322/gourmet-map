'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import CheckboxGroup from '@/components/CheckboxGroup'
import { geocodeAddress } from '@/lib/geocode'
import {
  CATEGORY_OPTIONS, SPOT_TYPE_OPTIONS_AS_CATEGORY,
  SEASON_OPTIONS, DECADE_OPTIONS, MONTH_OPTIONS, PREFECTURE_OPTIONS
} from '@/lib/constants'

export default function NewSpotPage() {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState({
    title: '',        // 料理名
    comment: '',      // 一言コメント
    shop_name: '',
    area: '',
    sub_area: '',
    address: '',
    description: '',
  })
  const [categories, setCategories] = useState([])
  const [seasons, setSeasons] = useState([])
  const [seasonMonth, setSeasonMonth] = useState('')
  const [seasonDecade, setSeasonDecade] = useState('')
  const [seasonDate, setSeasonDate] = useState('')
  const [file, setFile] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

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

    const { error: insertError } = await supabase.from('gourmet_spots').insert({
      title: form.title,
      comment: form.comment || null,
      shop_name: form.shop_name,
      area: form.area,
      sub_area: form.sub_area || null,
      address: form.address,
      description: form.description,
      categories,
      seasons,
      season_month: seasonMonth ? Number(seasonMonth) : null,
      season_decade: seasonDecade || null,
      season_date: seasonDate || null,
      image_url,
      latitude: geo?.latitude ?? null,
      longitude: geo?.longitude ?? null,
      created_by: user.id,
    })

    setLoading(false)
    if (insertError) { setError('投稿に失敗しました: ' + insertError.message); return }
    router.push('/')
    router.refresh()
  }

  return (
    <div className="container" style={{ maxWidth: 600, paddingTop: 40, paddingBottom: 60 }}>
      <h2 style={{ marginBottom: 24 }}>お店・料理を投稿する</h2>
      <form onSubmit={handleSubmit}>

        <div className="form-field">
          <label htmlFor="comment">一言コメント(おすすめポイントなど)</label>
          <input
            id="comment"
            value={form.comment}
            onChange={(e) => update('comment', e.target.value)}
            placeholder="例: ここでしか食べられない絶品の一品！"
          />
        </div>

        <div className="form-field">
          <label htmlFor="title">料理名 *(同じ料理はまとめて表示されます)</label>
          <input
            id="title"
            required
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="例: ホルモン天ぷら"
          />
        </div>

        <div className="form-field">
          <label>ジャンル(複数選択可)</label>
          <CheckboxGroup
            options={CATEGORY_OPTIONS}
            value={categories}
            onChange={setCategories}
          />
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--color-paper-dim)' }}>
            <p className="field-hint" style={{ marginBottom: 6 }}>種別</p>
            <CheckboxGroup
              options={SPOT_TYPE_OPTIONS_AS_CATEGORY}
              value={categories}
              onChange={setCategories}
            />
          </div>
        </div>

        <div className="form-field">
          <label>旬の季節(複数選択可)</label>
          <CheckboxGroup options={SEASON_OPTIONS} value={seasons} onChange={setSeasons} />
        </div>

        <div className="form-field">
          <label>旬の時期(月+上旬/中旬/下旬)</label>
          <div className="period-row">
            <select value={seasonMonth} onChange={(e) => setSeasonMonth(e.target.value)}>
              <option value="">月を選択</option>
              {MONTH_OPTIONS.map((m) => <option key={m} value={m}>{m}月</option>)}
            </select>
            <select value={seasonDecade} onChange={(e) => setSeasonDecade(e.target.value)}>
              <option value="">時期を選択</option>
              {DECADE_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="seasonDate">旬の日付(ピンポイントで指定したい場合)</label>
          <input id="seasonDate" type="date" value={seasonDate} onChange={(e) => setSeasonDate(e.target.value)} />
        </div>

        <div className="form-field">
          <label htmlFor="shop_name">お店の名前</label>
          <input id="shop_name" value={form.shop_name} onChange={(e) => update('shop_name', e.target.value)} placeholder="例: あきちゃん" />
        </div>

        <div className="form-field">
          <label htmlFor="area">地域(都道府県) *</label>
          <select id="area" required value={form.area} onChange={(e) => update('area', e.target.value)}>
            <option value="">選択してください</option>
            {PREFECTURE_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="sub_area">市区町村・地域(任意)</label>
          <input
            id="sub_area"
            value={form.sub_area}
            onChange={(e) => update('sub_area', e.target.value)}
            placeholder="例: 広島市中区、下北沢周辺"
          />
        </div>

        <div className="form-field">
          <label htmlFor="address">住所(地図表示に使います)</label>
          <input id="address" value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="例: 広島県広島市中区○○町1-2-3" />
        </div>

        <div className="form-field">
          <label htmlFor="description">詳しい説明・メモ</label>
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
