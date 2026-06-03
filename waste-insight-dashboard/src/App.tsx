import { useState } from 'react'
import { ReplanPage }   from './pages/ReplanPage'
import { AddpaperPage } from './pages/AddpaperPage'

type Tab = 'Replan' | 'Addpaper'

export function App() {
  const [tab, setTab] = useState<Tab>('Replan')
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-6 h-14 flex items-center gap-6">
          {/* Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
            </div>
            <span className="font-semibold text-slate-800 text-sm">Waste Insight</span>
          </div>

          <div className="w-px h-5 bg-slate-200"/>

          {/* Tab switcher */}
          <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
            {(['Replan', 'Addpaper'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                  tab === t
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-screen-2xl mx-auto px-6 py-5">
        {tab === 'Replan'   && <ReplanPage />}
        {tab === 'Addpaper' && <AddpaperPage />}
      </main>
    </div>
  )
}
