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

export default function RamHistoryComp({ data, interval }) {
  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (interval === 'hourly') return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (interval === 'daily') return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    if (interval === 'monthly') return date.toLocaleDateString([], { month: 'short', year: 'numeric' });
    if (interval === 'yearly') return date.getFullYear().toString();
    return date.toLocaleTimeString();
  };

  const sortedData = [...data]
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .map(row => ({
      ...row,
      ram_usage: row.ram_usage || 0
    }));

  const chartData = {
    labels: sortedData.map(row => formatTime(row.timestamp)),
    datasets: [
      {
        label: 'RAM Usage (%)',
        data: sortedData.map(row => row.ram_usage),
        borderColor: '#a6e3a1',
        backgroundColor: 'rgba(166, 227, 161, 0.2)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#a6e3a1',
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e1e2e',
        titleColor: '#cdd6f4',
        bodyColor: '#cdd6f4',
        callbacks: {
          label: (context) => `Usage: ${context.parsed.y.toFixed(1)}%`
        }
      }
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: { color: '#888888', callback: (v) => `${v}%` },
        grid: { color: 'rgba(136, 136, 136, 0.1)' }
      },
      x: {
        ticks: { color: '#888888', maxTicksLimit: 6 },
        grid: { display: false }
      }
    }
  };

  return (
    <div className="p-4 bg-ctp-light-mantle dark:bg-ctp-dark-mantle rounded-xl border border-ctp-light-surface0 dark:border-ctp-dark-surface0">
      <h3 className="text-lg font-bold text-ctp-light-text dark:text-ctp-dark-text mb-4">RAM History</h3>
      <div className="w-full h-[250px] relative">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
