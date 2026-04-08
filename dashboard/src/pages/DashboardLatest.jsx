import { useState, useEffect } from 'react'
import CpuComp from '../components/latest/CpuComp'
import RamComp from '../components/latest/RamComp'
import NetComp from '../components/latest/NetComp'
import SysComp from '../components/latest/SysComp'
import DiskComp from '../components/latest/DiskComp'

const getApiUrl = () => {
  const hostname = window.location.hostname;
  return `http://${hostname}:8000`
}

export default function DashboardLatest() {
  const [hardwareData, setHardwareData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(getApiUrl() + '/api/latest/raw')
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

  if (error) return <p className="text-red-500">API Error: {error}</p>
  if (!hardwareData) return <p>Connecting to probe...</p>

  return (
    <div className="space-y-4">
      <CpuComp data={hardwareData} />
      <div className="flex flex-wrap lg:flex-nowrap gap-4 justify-center">
        <RamComp data={hardwareData} />
        <NetComp data={hardwareData} />
        <SysComp data={hardwareData} />
      </div>
      <DiskComp data={hardwareData} />
    </div>
  )
}
