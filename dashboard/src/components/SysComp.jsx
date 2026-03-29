export default function SysComp({ data }) {
  if (!data) return null;

  // Helper to format uptime (seconds -> days, hours, minutes)
  const formatUptime = (seconds) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60)
    if (d === 0 && h === 0 && m === 0) return `${s} S`
    if (d === 0 && h === 0) return `${m} M - ${s} S`
    if (d === 0) return `${h} H - ${m} M - ${s} S`
    return `${d} D - ${h} H - ${m} M - ${s} S`;
  };

  const dateObj = new Date(data.timestamp);
  const dateString = dateObj.toLocaleDateString();
  const timeString = dateObj.toLocaleTimeString();

  return (
    <div className="h-96 flex-1 min-w-full lg:min-w-0 bg-ctp-light-base dark:bg-ctp-dark-base p-6 rounded-2xl shadow-xl border-2 border-ctp-light-surface1 dark:border-ctp-dark-surface1 flex flex-col">
      <h2 className="text-xl font-bold text-ctp-light-text dark:text-ctp-dark-text mb-8 text-center uppercase tracking-widest">
        System Info
      </h2>

      <div className="grid grid-cols-2 grid-rows-2 gap-4 grow">
        
        <div className="flex flex-col items-center justify-center p-4 bg-ctp-light-surface0 dark:bg-ctp-dark-surface0 rounded-xl border-2 border-transparent hover:border-ctp-light-peach dark:hover:border-ctp-dark-peach">
          <span className="text-[10px] uppercase font-bold text-ctp-light-subtext0 dark:text-ctp-dark-subtext0 mb-1">Hostname</span>
          <span className="text-sm font-bold text-ctp-light-peach dark:text-ctp-dark-peach text-center break-all">
            {data.system_name}
          </span>
        </div>

        <div className="flex flex-col items-center justify-center p-4 bg-ctp-light-surface0 dark:bg-ctp-dark-surface0 rounded-xl border-2 border-transparent hover:border-ctp-light-mauve dark:hover:border-ctp-dark-mauve">
          <span className="text-[10px] uppercase font-bold text-ctp-light-subtext0 dark:text-ctp-dark-subtext0 mb-1">OS Version</span>
          <span className="text-sm font-bold text-ctp-light-mauve dark:text-ctp-dark-mauve text-center">
            {data.os_version}
          </span>
        </div>

        <div className="flex flex-col items-center justify-center p-4 bg-ctp-light-surface0 dark:bg-ctp-dark-surface0 rounded-xl border-2 border-transparent hover:border-ctp-light-green dark:hover:border-ctp-dark-green">
          <span className="text-[10px] uppercase font-bold text-ctp-light-subtext0 dark:text-ctp-dark-subtext0 mb-1">Uptime</span>
          <span className="text-sm font-black text-ctp-light-green dark:text-ctp-dark-green">
            {formatUptime(data.uptime)}
          </span>
        </div>

        <div className="flex flex-col items-center justify-center p-4 bg-ctp-light-surface0 dark:bg-ctp-dark-surface0 rounded-xl border-2 border-transparent hover:border-ctp-light-blue dark:hover:border-ctp-dark-blue">
          <span className="text-[10px] uppercase font-bold text-ctp-light-subtext0 dark:text-ctp-dark-subtext0 mb-1">Last Sync</span>
          <span className="text-sm font-bold text-ctp-light-blue dark:text-ctp-dark-blue">{dateString}</span>
          <span className="text-xs font-mono text-ctp-light-lavender dark:text-ctp-dark-lavender">{timeString}</span>
        </div>

      </div>
    </div>
  );
}