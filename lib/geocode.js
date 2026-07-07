// 住所の文字列から緯度・経度を調べる無料の仕組み(OpenStreetMap Nominatim)
// APIキーは不要ですが、過度なアクセスは制限されるので投稿・更新時にだけ呼び出します。
export async function geocodeAddress(address) {
  if (!address || !address.trim()) return null

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`,
      { headers: { 'Accept-Language': 'ja' } }
    )
    const data = await res.json()
    if (data && data[0]) {
      return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) }
    }
  } catch (e) {
    console.error('geocode error', e)
  }
  return null
}
