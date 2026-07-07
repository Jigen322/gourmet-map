'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import CheckboxGroup from '@/components/CheckboxGroup'
import { geocodeAddress } from '@/lib/geocode'
import { CATEGORY_OPTIONS, SEASON_OPTIONS, DECADE_OPTIONS, MONTH_OPTIONS, SPOT_TYPE_OPTIONS, PREFECTURE_OPTIONS } from '@/lib/constants'

export default function EditSpotPage({ params }) {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState(null)
  const [categories, setCategories] = useState([])
  const [seasons, setSeasons] = useState([])
  const [seasonMonth, setSeasonMonth] = useState('')
  const [seasonDecade, setSeasonDecade] = useState('')
  const [seasonDate, setSeasonDate] = useState('')
  const [file, setFile] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('gourmet_spots').select('*').eq('id', params.id).single()
      setForm(data)
      setCategories(data?.categories || [])
      setSeasons(data?.seasons || [])
      setSeasonMonth(data?.season_month ? String(data.season_month) : '')
      setSeasonDecade(data?.season_decade || '')
      setSeasonDate(data?.season_date || '')
    }
    load()
  }, [params.id])

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    let image_url = form.image_url
    if (file) {
      const { data: { user } } = await supabase.auth.getUser()
      const path = `${user.id}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage.from('gourmet-images').upload(path, file)
      if (uploadError) {
        setError('画像のアップロードに失敗しました: ' + uploadError.message)
        setLoading(false)
        return
      }
      const { data: urlData } = supabase.storage.from('gourmet-images').getPublicUrl(path)
      image_url = urlData.publicUrl
    }

    const geo = await geocodeAddress(form.address)

    const { error: updateError } = await supabase
      .from('gourmet_spots')
      .update({
        title: form.title,
        area: form.area,
        spot_type: form.spot_type || null,
        categories,
        seasons,
        season_month: seasonMonth ? Number(seasonMonth) : null,
        season_decade: seasonDecade || null,
        season_date: seasonDate || null,
        latitude: geo?.latitude ?? form.latitude ?? null,
        longitude: geo?.longitude ?? form.longitude ?? null,
        shop_name: form.shop_name,
        address: form.address,
        description: form.description,
        image_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)

    setLoading(false)
    if (updateError) {
      setError('更新に失敗しました(権限がないかもしれません): ' + updateError.message)
      return
    }
    router.push(`/spots/${params.id}`)
    router.refresh()
  }

  if (!form) return <div className="container" style={{ paddingTop: 40 }}>読み込み中…</div>

  return (
    <div className="container" style={{ maxWidth: 600, paddingTop: 40, paddingBottom: 60 }}>
      <h2 style={{ marginBottom: 24 }}>投稿を編集する</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="title">タイトル *</label>
          <input id="title" required value={form.title || ''} onChange={(e) => update('title', e.target.value)} />
        </div>

        <div className="form-field">
          <label htmlFor="area">地域(都道府県) *</label>
          <select id="area" required value={form.area || ''} onChange={(e) => update('area', e.target.value)}>
            <option value="">選択してください</option>
            {PREFECTURE_OPTIONS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label>投稿の種類</label>
          <select value={form.spot_type || ''} onChange={(e) => update('spot_type', e.target.value)}>
            <option value="">選択してください</option>
            {SPOT_TYPE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label>ジャンル(複数選択可)</label>
          <CheckboxGroup options={CATEGORY_OPTIONS} value={categories} onChange={setCategories} name="categories" />
        </div>

        <div className="form-field">
          <label>旬の季節(複数選択可)</label>
          <CheckboxGroup options={SEASON_OPTIONS} value={seasons} onChange={setSeasons} name="seasons" />
        </div>

        <div className="form-field">
          <label>旬の時期(任意・月+上旬/中旬/下旬)</label>
          <div className="period-row">
            <select value={seasonMonth} onChange={(e) => setSeasonMonth(e.target.value)}>
              <option value="">月を選択</option>
              {MONTH_OPTIONS.map((m) => (
                <option key={m} value={m}>{m}月</option>
              ))}
            </select>
            <select value={seasonDecade} onChange={(e) => setSeasonDecade(e.target.value)}>
              <option value="">時期を選択</option>
              {DECADE_OPTIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="seasonDate">旬の日付(任意・ピンポイントの単日)</label>
          <input id="seasonDate" type="date" value={seasonDate} onChange={(e) => setSeasonDate(e.target.value)} />
        </div>

        <div className="form-field">
          <label htmlFor="shop_name">お店の名前</label>
          <input id="shop_name" value={form.shop_name || ''} onChange={(e) => update('shop_name', e.target.value)} />
        </div>
        <div className="form-field">
          <label htmlFor="address">住所</label>
          <input id="address" value={form.address || ''} onChange={(e) => update('address', e.target.value)} />
        </div>
        <div className="form-field">
          <label htmlFor="description">紹介文</label>
          <textarea id="description" rows={4} value={form.description || ''} onChange={(e) => update('description', e.target.value)} />
        </div>
        <div className="form-field">
          <label htmlFor="image">写真を変更(任意)</label>
          <input id="image" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
          {loading ? '更新中…' : '更新する'}
        </button>
      </form>
    </div>
  )
}
