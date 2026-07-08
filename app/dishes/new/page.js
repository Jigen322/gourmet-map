'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import CheckboxGroup from '@/components/CheckboxGroup'
import { CATEGORY_OPTIONS, SEASON_OPTIONS, DECADE_OPTIONS, MONTH_OPTIONS, SPOT_TYPE_OPTIONS } from '@/lib/constants'
import { geocodeAddress } from '@/lib/geocode'

export default function NewDishPage() {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState({ name: '', description: '', spot_type: '' })
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
      const path = `dishes/${user.id}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage.from('gourmet-images').upload(path, file)
      if (uploadError) { setError('画像アップロードに失敗しました'); setLoading(false); return }
      const { data: urlData } = supabase.storage.from('gourmet-images').getPublicUrl(path)
      image_url = urlData.publicUrl
    }

    const { data: dish, error: insertError } = await supabase.from('dishes').insert({
      name: form.name,
      description: form.description,
      spot_type: form.spot_type || null,
      categories,
      seasons,
      season_month: seasonMonth ? Number(seasonMonth) : null,
      season_decade: seasonDecade || null,
      season_date: seasonDate || null,
      image_url,
      created_by: user.id,
    }).select().single()

    setLoading(false)
    if (insertError) { setError('登録に失敗しました: ' + insertError.message); return }
    router.push(`/dishes/${dish.id}`)
  }

  return (
    <div className="container" style={{ maxWidth: 600, paddingTop: 40, paddingBottom: 60 }}>
      <h2 style={{ marginBottom: 24 }}>料理を登録する</h2>
      <p className="field-hint">「料理」は複数のお店に共通する料理名です。登録後、各お店をお店として投稿できます。</p>
      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="name">料理名 *</label>
          <input id="name" required value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="例: ホルモン天ぷら" />
        </div>
        <div className="form-field">
          <label>投稿の種類</label>
          <select value={form.spot_type} onChange={(e) => update('spot_type', e.target.value)}>
            <option value="">選択してください</option>
            {SPOT_TYPE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div className="form-field">
          <label>ジャンル(複数選択可)</label>
          <CheckboxGroup options={CATEGORY_OPTIONS} value={categories} onChange={setCategories} />
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
          <label htmlFor="seasonDate">旬の日付(ピンポイント指定)</label>
          <input id="seasonDate" type="date" value={seasonDate} onChange={(e) => setSeasonDate(e.target.value)} />
        </div>
        <div className="form-field">
          <label htmlFor="description">説明文</label>
          <textarea id="description" rows={4} value={form.description} onChange={(e) => update('description', e.target.value)} />
        </div>
        <div className="form-field">
          <label htmlFor="image">代表写真</label>
          <input id="image" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
          {loading ? '登録中…' : '料理を登録する'}
        </button>
      </form>
    </div>
  )
}
