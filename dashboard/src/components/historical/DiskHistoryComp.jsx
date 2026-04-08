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

const CTP_COLORS = [
  '#cba6f7',
  '#89b4fa',
  '#a6e3a1',
  '#fab387',
  '#f38ba8',
  '#94e2d5',
  '#f9e2af',
  '#f5c2e7',
];

export default function DiskHistoryComp({ data, interval }) {
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
  if (bytes === 0 || !bytes) return '0 B';
  const isNegative = bytes < 0;
  const absBytes = Math.abs(bytes);
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(absBytes) / Math.log(k));
  const safeIndex = Math.max(0, Math.min(i, sizes.length - 1));
  
  const value = parseFloat((absBytes / Math.pow(k, safeIndex)).toFixed(dm));
  return `${isNegative ? '-' : ''}${value} ${sizes[safeIndex]}`;
};

  const sortedData = [...data].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const uniquePartitions = new Set();
  sortedData.forEach(snap => {
    snap.disks?.forEach(disk => {
      disk.partitions?.forEach(part => {
        uniquePartitions.add(`${disk.name} (${part.mount_point})`);
      });
    });
  });

  const partitionArray = Array.from(uniquePartitions);

  const datasets = partitionArray.map((partLabel, index) => {
    const color = CTP_COLORS[index % CTP_COLORS.length];

    return {
      label: partLabel,
      data: sortedData.map(snap => {
        let foundBytes = 0;
        snap.disks?.forEach(disk => {
          disk.partitions?.forEach(part => {
            if (`${disk.name} (${part.mount_point})` === partLabel) {
              foundBytes = part.bytes_dif || 0;
            }
          });
        });
        return foundBytes;
      }),
      borderColor: color,
      backgroundColor: color + '33',
      fill: true,
      tension: 0.4,
      pointRadius: 3,
      pointBackgroundColor: color,
    };
  });

  const chartData = {
    labels: sortedData.map(row => formatTime(row.timestamp)),
    datasets: datasets
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top', labels: { color: '#888888', usePointStyle: true } },
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
        ticks: { color: '#888888', callback: (value) => formatBytes(value, 0) },
        grid: { color: 'rgba(136, 136, 136, 0.1)' }
      },
      x: {
        ticks: { color: '#888888', maxTicksLimit: 10 },
        grid: { display: false }
      }
    }
  };

  return (
    <div className="p-4 bg-ctp-light-mantle dark:bg-ctp-dark-mantle rounded-xl border border-ctp-light-surface0 dark:border-ctp-dark-surface0">
      <h3 className="text-lg font-bold text-ctp-light-text dark:text-ctp-dark-text mb-4">Disk Capacity Changes</h3>
      <div className="w-full h-[300px] relative">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
