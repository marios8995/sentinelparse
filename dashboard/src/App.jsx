import { useState } from 'react'
import ThemeToggle from './components/ThemeToggle'
import DashboardLatest from './pages/DashboardLatest'
import DashboardHistorical from './pages/DashboardHistorical'

function App() {
  const [view, setView] = useState('latest')

  const btnClass = (v) => `px-3 py-1 rounded-md transition-colors ${
    view === v 
    ? 'bg-ctp-light-mauve dark:bg-ctp-dark-mauve text-ctp-light-surface0 dark:text-ctp-dark-surface0' 
    : 'bg-ctp-light-surface0 dark:bg-ctp-dark-surface0 hover:bg-ctp-light-surface1 hover:dark:bg-ctp-dark-surface1 text-ctp-light-text dark:text-ctp-dark-text'
  }`

  return (
    <div className="min-h-screen bg-ctp-light-crust dark:bg-ctp-dark-crust text-ctp-light-text dark:text-ctp-dark-text font-sans p-2 md:p-4">
      <header className="flex items-center justify-between border-b border-ctp-light-surface0 dark:border-ctp-dark-surface0 pb-4 mb-4">
        <div className="flex gap-2 items-center">
          <h1 className="text-xl font-bold mr-4 hidden md:block">Sentinel</h1>
          <button onClick={() => setView('latest')} className={btnClass('latest')}>
            Latest
          </button>
          <button onClick={() => setView('historical')} className={btnClass('historical')}>
            Historical
          </button>
        </div>
        <ThemeToggle />
      </header>

      <main>
        {view === 'latest' ? <DashboardLatest /> : <DashboardHistorical />}
      </main>
    </div>
  )
}

export default App
