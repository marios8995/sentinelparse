import { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

export default function CpuHistoryComp({ data, interval }) {
  const [unit, setUnit] = useState('C');

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (interval === 'hourly') return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (interval === 'daily') return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    if (interval === 'monthly') return date.toLocaleDateString([], { month: 'short', year: 'numeric' });
    if (interval === 'yearly') return date.getFullYear().toString();
    return date.toLocaleTimeString();
  };

  const convertTemp = (c) => (unit === 'F' ? (c * 9) / 5 + 32 : c);

  const sortedAndSafeData = [...data]
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .map(row => ({
      ...row,
      cpu_temp: row.cpu_temp || 0,
      cpu_overall: row.cpu_overall || 0
    }));

  const chartData = {
    labels: sortedAndSafeData.map(row => formatTime(row.timestamp)),
    datasets: [
      {
        label: 'Usage (%)',
        data: sortedAndSafeData.map(row => row.cpu_overall),
        borderColor: '#cba6f7',
        backgroundColor: 'rgba(203, 166, 247, 0.2)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y1',
      },
      {
        label: `Temp (°${unit})`,
        data: sortedAndSafeData.map(row => convertTemp(row.cpu_temp)),
        borderColor: '#ed8796',
        backgroundColor: 'rgba(237, 135, 150, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y2',
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    scales: {
      y1: {
        type: 'linear',
        display: true,
        position: 'left',
        min: 0,
        max: 100,
        ticks: { color: '#888888', callback: (value) => `${value}%` },
        grid: { color: 'rgba(136, 136, 136, 0.1)' }
      },
      y2: {
        type: 'linear',
        display: true,
        position: 'right',
        ticks: { color: '#888888', callback: (value) => `${value.toFixed(0)}°${unit}` },
        grid: { drawOnChartArea: false },
      },
      x: {
        ticks: { color: '#888888', maxTicksLimit: 10 },
        grid: { display: false }
      }
    },
    plugins: {
      legend: { labels: { color: '#888888', usePointStyle: true } },
      tooltip: {
        backgroundColor: '#1e1e2e',
        titleColor: '#cdd6f4',
        bodyColor: '#cdd6f4',
        padding: 10,
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y.toFixed(1);
            return `${label}: ${value}${label.includes('Temp') ? `°${unit}` : '%'}`;
          }
        }
      }
    }
  };

  return (
    <div className="p-4 bg-ctp-light-mantle dark:bg-ctp-dark-mantle rounded-xl border border-ctp-light-surface0 dark:border-ctp-dark-surface0">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-ctp-light-text dark:text-ctp-dark-text">CPU History</h3>
        
        <button 
          onClick={() => setUnit(unit === 'C' ? 'F' : 'C')}
          className="px-3 py-1 text-xs font-bold rounded-md bg-ctp-light-surface0 dark:bg-ctp-dark-surface0 hover:bg-ctp-light-surface1 hover:dark:bg-ctp-dark-surface1 transition-colors border border-ctp-light-surface1 dark:border-ctp-dark-surface1"
        >
          SHOW °{unit === 'C' ? 'F' : 'C'}
        </button>
      </div>
      
      <div className="w-full h-[300px] relative">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
