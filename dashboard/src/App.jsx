import {useState, useEffect} from 'react'
import CpuComp from './components/CpuComp'
import RamComp from './components/RamComp'
import NetComp from './components/NetComp'
import SysComp from './components/SysComp'
import DiskComp from './components/DiskComp'
import ThemeToggle from './components/ThemeToggle'

const getApiUrl = () => {
  const hostname = window.location.hostname;
  return `http://${hostname}:8000/api/latest`
}

function App() {
  const [hardwareData, setHardwareData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(getApiUrl());
        if (!response.ok) throw new Error("Network response was not ok")
        
        const data = await response.json()
        setHardwareData(data)
      } catch (err) {
        setError(err.message)
      }
    }

    fetchData()
    const intervalId = setInterval(fetchData, 2000)

    return () => clearInterval(intervalId)
}, [])

  return (
    <div>

      {error && <p className="text-red-500">API Error: {error}</p>}

      {!hardwareData && !error && <p className="text-ctp-light-text dark:text-ctp-dark-text">Connecting to probe...</p>}
      
      {hardwareData && (
        <div className="bg-ctp-light-crust dark:bg-ctp-dark-crust font-sans p-2 md:p-4 text-ctp-light-text dark:text-ctp-dark-text">
          <div className="bg-ctp-light-crust dark:bg-ctp-dark-crust pb-2">
            <ThemeToggle />
          </div>
          <main>
            <div className="pb-2 pt-2 md:pb-4 md:pt-4">
              <CpuComp data={hardwareData} />
            </div>
            <div className="flex flex-wrap lg:flex-nowrap gap-2 md:gap-4 justify-center">
              <RamComp data={hardwareData} />
              <NetComp data={hardwareData} />
              <SysComp data={hardwareData} />
            </div>
            <DiskComp data={hardwareData} />
          </main>
        </div>
      )}
    </div>
  )
}

export default App
