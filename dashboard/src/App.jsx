import {useState, useEffect} from 'react'
import CpuComp from './components/CpuComp'
import RamComp from './components/RamComp'
import NetComp from './components/NetComp'
import SysComp from './components/SysComp'
import DiskComp from './components/DiskComp'

function App() {
  const [hardwareData, setHardwareData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/latest')
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
    <div className="min-h-screen bg-ctp-light-crust dark:bg-ctp-dark-crust p-4 md:p-8 font-sans text-ctp-light-text dark:text-ctp-dark-text">

      {error && <p className="text-red-500">API Error: {error}</p>}

      {!hardwareData && !error && <p className="text-ctp-light-text dark:text-ctp-dark-text">Connecting to probe...</p>}
      
      {hardwareData && (
        <div>
          <CpuComp data={hardwareData} />
          <div className="flex flex-wrap justify-center">
            <RamComp data={hardwareData} />
            <NetComp data={hardwareData} />
            <SysComp data={hardwareData} />
          </div>
          <DiskComp data={hardwareData} />
        </div>
      )}
    </div>
  )
}

export default App
