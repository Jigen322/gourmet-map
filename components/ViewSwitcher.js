'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import ListView from './ListView'
import CalendarView from './CalendarView'

// 地図はブラウザのwindowに依存するため、サーバー側ではレンダリングしない
const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => <p className="field-hint">地図を読み込み中…</p>,
})

const TABS = [
  { key: 'list', label: '一覧' },
  { key: 'map', label: '地図' },
  { key: 'calendar', label: 'カレンダー' },
]

export default function ViewSwitcher({ spots }) {
  const [view, setView] = useState('list')

  return (
    <div>
      <div className="view-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setView(t.key)}
            className={`view-tab ${view === t.key ? 'active' : ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={view === 'map' ? {} : { paddingTop: 20, paddingBottom: 60 }}>
        {view === 'list' && <ListView spots={spots} />}
        {view === 'map' && <MapView spots={spots} />}
        {view === 'calendar' && <CalendarView spots={spots} />}
      </div>
    </div>
  )
}
