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

export default function NetHistoryComp({ data, interval }) {
  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (interval === 'hourly') return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (interval === 'daily') return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    if (interval === 'monthly') return date.toLocaleDateString([], { month: 'short', year: 'numeric' });
    if (interval === 'yearly') return date.getFullYear().toString();
    return date.toLocaleTimeString();
  };

  const formatBytes = (bytes, decimals = 1) => {
    if (!+bytes) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const sortedAndSafeData = [...data]
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .map(row => ({
      ...row,
      net_down: row.net_down || 0,
      net_up: row.net_up || 0
    }));

  const chartData = {
    labels: sortedAndSafeData.map(row => formatTime(row.timestamp)),
    datasets: [
      {
        label: 'Download',
        data: sortedAndSafeData.map(row => row.net_down),
        borderColor: '#89b4fa',
        backgroundColor: 'rgba(137, 180, 250, 0.2)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#89b4fa',
      },
      {
        label: 'Upload',
        data: sortedAndSafeData.map(row => row.net_up),
        borderColor: '#fab387',
        backgroundColor: 'rgba(250, 179, 135, 0.2)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#fab387',
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#888888', usePointStyle: true, boxWidth: 8 }
      },
      tooltip: {
        backgroundColor: '#1e1e2e',
        titleColor: '#cdd6f4',
        bodyColor: '#cdd6f4',
        padding: 10,
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const formattedValue = formatBytes(context.parsed.y);
            return `${label}: ${formattedValue}`;
          }
        }
      }
    },
    scales: {
      y: {
        min: 0,
        ticks: {
          color: '#888888',
          callback: (value) => formatBytes(value, 0) 
        },
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
      <h3 className="text-lg font-bold text-ctp-light-text dark:text-ctp-dark-text mb-4">Network Traffic</h3>
      <div className="w-full h-[250px] relative">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
