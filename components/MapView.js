'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Link from 'next/link'

const TOKYO_STATION = [35.681236, 139.767125]

function createSpotIcon(imageUrl) {
  return L.divIcon({
    className: 'map-pin',
    html: `
      <div class="map-pin-photo" style="background-image:url('${imageUrl ? imageUrl.replace(/'/g, "%27") : ''}')"></div>
      <div class="map-pin-arrow"></div>
    `,
    iconSize: [46, 58],
    iconAnchor: [23, 58],
    popupAnchor: [0, -54],
  })
}

const userIcon = L.divIcon({
  className: 'user-pin',
  html: '<div class="user-pin-dot"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

// 現在地が後から分かった時に、地図の中心を動かすための小さな仕掛け
function RecenterOnLocate({ position }) {
  const map = useMap()
  useEffect(() => {
    if (position) map.setView(position, 13)
  }, [position, map])
  return null
}

export default function MapView({ spots }) {
  const [userPos, setUserPos] = useState(null)
  const [status, setStatus] = useState('locating') // locating | found | denied | unsupported

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setStatus('unsupported')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude])
        setStatus('found')
      },
      () => setStatus('denied'),
      { timeout: 8000 }
    )
  }, [])

  const pinned = spots.filter((s) => s.latitude != null && s.longitude != null)
  const unpinnedCount = spots.length - pinned.length

  return (
    <div>
      {status === 'locating' && <p className="field-hint">現在地を取得中…</p>}
      {status === 'denied' && (
        <p className="field-hint">現在地を取得できなかったため、東京駅を中心に表示しています。</p>
      )}

      <div className="map-frame">
        <MapContainer center={userPos || TOKYO_STATION} zoom={userPos ? 13 : 6} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <RecenterOnLocate position={userPos} />

          {userPos && (
            <Marker position={userPos} icon={userIcon}>
              <Popup>現在地</Popup>
            </Marker>
          )}

          {pinned.map((spot) => (
            <Marker key={spot.id} position={[spot.latitude, spot.longitude]} icon={createSpotIcon(spot.image_url)}>
              <Popup>
                <strong>{spot.title}</strong><br />
                {spot.area}{spot.shop_name ? ` ・ ${spot.shop_name}` : ''}<br />
                <Link href={`/spots/${spot.id}`}>詳細を見る</Link>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {unpinnedCount > 0 && (
        <p className="field-hint" style={{ marginTop: 8 }}>
          ※ 住所から位置情報を取得できなかった投稿が{unpinnedCount}件あり、地図には表示されていません。
        </p>
      )}
    </div>
  )
}
