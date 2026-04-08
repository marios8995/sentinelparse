import { useState, useEffect } from 'react'
import CpuHistoryComp from '../components/historical/CpuHistoryComp';
import RamHistoryComp from '../components/historical/RamHistoryComp';
import NetHistoryComp from '../components/historical/NetHistoryComp';
import DiskHistoryComp from '../components/historical/DiskHistoryComp';

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

  const activeColors = {
    hourly: 'bg-ctp-light-blue dark:bg-ctp-dark-blue',
    daily: 'bg-ctp-light-green dark:bg-ctp-dark-green',
    monthly: 'bg-ctp-light-peach dark:bg-ctp-dark-peach',
    yearly: 'bg-ctp-light-maroon dark:bg-ctp-dark-maroon'
  }

  const getBtnClass = (span) => {
    const isActive = interval === span;
    const baseClasses = "px-4 py-1.5 rounded-md transition-all duration-200 font-medium capitalize border";
    
    if (isActive) {
      return `${baseClasses} ${activeColors[span]} text-ctp-light-surface0 dark:text-ctp-dark-surface0 border-transparent shadow-sm scale-105`;
    }
    
    return `${baseClasses} bg-ctp-light-surface0 dark:bg-ctp-dark-surface0 hover:bg-ctp-light-surface1 hover:dark:bg-ctp-dark-surface1 text-ctp-light-text dark:text-ctp-dark-text border-ctp-light-surface1 dark:border-ctp-dark-surface1`;
  }

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
              className={getBtnClass(span)}
            >
              {span}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="p-4 animate-pulse">Loading historical data...</div>}
      {error && <div className="p-4 text-ctp-light-red dark:text-ctp-dark-red">Error: {error}</div>}
      
      {!loading && !error && historyData && (
        <>
          {historyData.length < 2 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-ctp-light-mantle dark:bg-ctp-dark-mantle rounded-xl border border-ctp-light-surface0 dark:border-ctp-dark-surface0 text-center">
              <div className="mb-4 p-4 rounded-full bg-ctp-light-surface0 dark:bg-ctp-dark-surface0">
                <svg className="w-12 h-12 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-ctp-light-text dark:text-ctp-dark-text">No Historical Data Yet</h3>
              <p className="max-w-xs text-sm opacity-60 mt-2">
                The {interval} database is currently empty or still collecting initial snapshots.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <CpuHistoryComp data={historyData} interval={interval} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <RamHistoryComp data={historyData} interval={interval} />
                <NetHistoryComp data={historyData} interval={interval} />
              </div>
              <DiskHistoryComp data={historyData} interval={interval} />
            </div>
          )}
        </>
      )}

    </div>
  )
}
