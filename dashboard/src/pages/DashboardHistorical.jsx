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
        <div className="flex flex-col gap-4">
          
          <div className="w-full">
            <CpuHistoryComp data={historyData} interval={interval} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RamHistoryComp data={historyData} interval={interval} />
            <NetHistoryComp data={historyData} interval={interval} />
          </div>

          <div className="w-full">
            <DiskHistoryComp data={historyData} interval={interval} />
          </div>

        </div>
      )}

    </div>
  )
}
