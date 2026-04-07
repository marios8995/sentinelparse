import { useState, useEffect } from 'react'

const getApiUrl = () => {
  const hostname = window.location.hostname;
  return `http://${hostname}:8000`
}

export default function DashboardHistorical() {
  const [interval, setIntervalTime] = useState('hourly')
  const [historyData, setHistoryData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const intervals = ['hourly', 'daily', 'monthly', 'yearly']

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`${getApiUrl()}/api/historical/${interval}`)
        if (!response.ok) throw new Error("Failed to fetch historical data")
        
        const data = await response.json()
        setHistoryData(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [interval])

  const btnClass = (v) => `px-4 py-1.5 rounded-md transition-colors font-medium capitalize ${
    interval === v 
    ? 'bg-ctp-light-mauve dark:bg-ctp-dark-mauve text-ctp-light-surface0 dark:text-ctp-dark-surface0' 
    : 'bg-ctp-light-surface0 dark:bg-ctp-dark-surface0 hover:bg-ctp-light-surface1 hover:dark:bg-ctp-dark-surface1 text-ctp-light-text dark:text-ctp-dark-text'
  }`

  return (
    <div className="space-y-4">
      <div className="p-4 bg-ctp-light-mantle dark:bg-ctp-dark-mantle rounded-xl border border-ctp-light-surface0 dark:border-ctp-dark-surface0 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-ctp-light-text dark:text-ctp-dark-text">System History</h2>
          <p className="text-sm opacity-70">Viewing aggregated telemetry data</p>
        </div>
        
        <div className="flex gap-2 p-1 bg-ctp-light-crust dark:bg-ctp-dark-crust rounded-lg border border-ctp-light-surface0 dark:border-ctp-dark-surface0">
          {intervals.map((span) => (
            <button 
              key={span} 
              onClick={() => setIntervalTime(span)} 
              className={btnClass(span)}
            >
              {span}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 bg-ctp-light-mantle dark:bg-ctp-dark-mantle rounded-xl border border-ctp-light-surface0 dark:border-ctp-dark-surface0 min-h-[400px]">
        {loading && <p className="animate-pulse">Loading historical data...</p>}
        {error && <p className="text-ctp-light-red dark:text-ctp-dark-red">Error: {error}</p>}
        
        {!loading && !error && historyData && (
          <div className="overflow-auto max-h-[500px] text-xs font-mono opacity-80">
            {historyData.length === 0 ? (
              <p className="text-center italic mt-10 opacity-50">No data available for this interval yet.</p>
            ) : (
              <pre>{JSON.stringify(historyData, null, 2)}</pre>
            )}
          </div>
        )}
      </div>

    </div>
  )
}