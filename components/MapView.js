'use client'

import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Link from 'next/link'

const TOKYO = [35.681236, 139.767125]

function createSpotIcon(imageUrl, isActive) {
  return L.divIcon({
    className: '',
    html: `
      <div class="map-pin-wrap ${isActive ? 'active' : ''}">
        <div class="map-pin-photo" style="background-image:url('${imageUrl ? imageUrl.replace(/'/g, '%27') : ''}')"></div>
        <div class="map-pin-arrow"></div>
      </div>`,
    iconSize: [48, 60],
    iconAnchor: [24, 60],
    popupAnchor: [0, -58],
  })
}

// クラスターのアイコン(件数バッジ)
function createClusterIcon(cluster) {
  const count = cluster.getChildCount()
  const size = count < 10 ? 36 : count < 100 ? 42 : 48
  return L.divIcon({
    className: '',
    html: `<div class="cluster-icon" style="width:${size}px;height:${size}px">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

const userIcon = L.divIcon({
  className: '',
  html: '<div class="user-pin-dot"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

function FlyTo({ target }) {
  const map = useMap()
  useEffect(() => {
    if (target) map.flyTo([target.latitude, target.longitude], 15, { duration: 0.8 })
  }, [target, map])
  return null
}

function RecenterOnLocate({ position }) {
  const map = useMap()
  useEffect(() => {
    if (position) map.setView(position, 13)
  }, [position, map])
  return null
}

export default function MapView({ spots }) {
  const [userPos, setUserPos] = useState(null)
  const [activeSpot, setActiveSpot] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const markerRefs = useRef({})
  const listItemRefs = useRef({})

  useEffect(() => {
    if (!('geolocation' in navigator)) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { timeout: 8000 }
    )
  }, [])

  const pinned = spots.filter((s) => s.latitude != null && s.longitude != null)
  const unpinnedCount = spots.length - pinned.length

  function handleSpotClick(spot) {
    setActiveSpot(spot)
    setSidebarOpen(false)
    const el = listItemRefs.current[spot.id]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    const marker = markerRefs.current[spot.id]
    if (marker) marker.openPopup()
  }

  function handleMarkerClick(spot) {
    setActiveSpot(spot)
    setSidebarOpen(true)
    const el = listItemRefs.current[spot.id]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  return (
    <div className="mapview-root">
      {/* サイドバー */}
      <div className={`mapview-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="mapview-sidebar-header">
          <span className="mapview-sidebar-count">{pinned.length}件の投稿</span>
          <button
            type="button"
            className="mapview-sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'サイドバーを閉じる' : 'サイドバーを開く'}
          >
            {sidebarOpen ? '✕' : '☰'}
          </button>
        </div>

        <div className="mapview-sidebar-list">
          {pinned.length === 0 && (
            <p className="field-hint" style={{ padding: '16px' }}>
              住所を入力して投稿すると地図に表示されます
            </p>
          )}
          {pinned.map((spot) => (
            <button
              key={spot.id}
              ref={(el) => { listItemRefs.current[spot.id] = el }}
              type="button"
              className={`mapview-spot-item ${activeSpot?.id === spot.id ? 'active' : ''}`}
              onClick={() => handleSpotClick(spot)}
            >
              {spot.image_url ? (
                <img src={spot.image_url} alt={spot.title} className="mapview-spot-thumb" />
              ) : (
                <div className="mapview-spot-thumb mapview-spot-thumb-empty" />
              )}
              <div className="mapview-spot-info">
                <span className="mapview-spot-title">{spot.title}</span>
                <span className="mapview-spot-area">{spot.area}{spot.shop_name ? ` ・ ${spot.shop_name}` : ''}</span>
                {(spot.categories || []).length > 0 && (
                  <span className="mapview-spot-tags">{spot.categories.slice(0, 3).join(' / ')}</span>
                )}
              </div>
            </button>
          ))}

          {unpinnedCount > 0 && (
            <p className="field-hint" style={{ padding: '12px 16px', borderTop: '1px solid var(--color-paper-dim)' }}>
              ※ 住所未入力の投稿が{unpinnedCount}件あり非表示です
            </p>
          )}
        </div>
      </div>

      {/* サイドバーが閉じている時の開くボタン(PC) */}
      {!sidebarOpen && (
        <button
          type="button"
          className="mapview-open-btn"
          onClick={() => setSidebarOpen(true)}
          aria-label="サイドバーを開く"
        >
          ☰
        </button>
      )}

      {/* 地図 */}
      <div className="mapview-map">
        <MapContainer
          center={userPos || TOKYO}
          zoom={userPos ? 13 : 6}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <RecenterOnLocate position={userPos} />
          {activeSpot && <FlyTo target={activeSpot} />}

          {userPos && (
            <Marker position={userPos} icon={userIcon}>
              <Popup>現在地</Popup>
            </Marker>
          )}

          {/* クラスタリング: 近くのピンをまとめて件数バッジで表示 */}
          <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={60}
            showCoverageOnHover={false}
            iconCreateFunction={createClusterIcon}
          >
            {pinned.map((spot) => (
              <Marker
                key={spot.id}
                position={[spot.latitude, spot.longitude]}
                icon={createSpotIcon(spot.image_url, activeSpot?.id === spot.id)}
                ref={(el) => { if (el) markerRefs.current[spot.id] = el }}
                eventHandlers={{ click: () => handleMarkerClick(spot) }}
              >
                <Popup>
                  <div style={{ minWidth: 160 }}>
                    <strong style={{ fontSize: '0.9rem' }}>{spot.title}</strong><br />
                    <span style={{ fontSize: '0.8rem', color: '#666' }}>
                      {spot.area}{spot.shop_name ? ` ・ ${spot.shop_name}` : ''}
                    </span><br />
                    <Link href={`/spots/${spot.id}`} style={{ fontSize: '0.8rem', color: 'var(--color-lantern-deep)', fontWeight: 600 }}>
                      詳細を見る →
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        </MapContainer>
      </div>
    </div>
  )
}
