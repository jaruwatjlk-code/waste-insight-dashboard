import { useState } from 'react'
import { ReplanPage }   from './pages/ReplanPage'
import { AddpaperPage } from './pages/AddpaperPage'

type Tab = 'Replan' | 'Addpaper'

export function App() {
  const [tab, setTab] = useState<Tab>('Replan')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
        <h1 className="text-base font-bold text-gray-800">Waste Insight Dashboard</h1>
        <span className="text-gray-300">|</span>

        {/* Tabs */}
        <nav className="flex gap-1">
          {(['Replan', 'Addpaper'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors ${
                tab === t
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t}
            </button>
          ))}
        </nav>
      </header>

      {/* Page content */}
      <main className="px-4 sm:px-6 py-5 max-w-screen-xl mx-auto">
        {tab === 'Replan'   && <ReplanPage />}
        {tab === 'Addpaper' && <AddpaperPage />}
      </main>
    </div>
  )
}
