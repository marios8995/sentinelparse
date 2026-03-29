import React from 'react';

const getDiskColor = (usage, type = 'bg') => {
  const prefix = type === 'bg' ? 'bg' : 'text';
  if (usage === 100) return `${prefix}-ctp-light-red dark:${prefix}-ctp-dark-red`;
  if (usage > 90) return `${prefix}-ctp-light-maroon dark:${prefix}-ctp-dark-maroon`;
  if (usage > 75) return `${prefix}-ctp-light-peach dark:${prefix}-ctp-dark-peach`;
  if (usage > 60) return `${prefix}-ctp-light-yellow dark:${prefix}-ctp-dark-yellow`;
  if (usage > 40) return `${prefix}-ctp-light-green dark:${prefix}-ctp-dark-green`;
  if (usage > 20) return `${prefix}-ctp-light-sky dark:${prefix}-ctp-dark-sky`;
  return `${prefix}-ctp-light-blue dark:${prefix}-ctp-dark-blue`;
};

const formatSpeed = (kbPerSec) => {
    if (kbPerSec < 1024) return { val: kbPerSec.toFixed(1), unit: "KB/s" };
    
    const mb = kbPerSec / 1024;
    if (mb < 1024) return { val: mb.toFixed(1), unit: "MB/s" };
    
    const gb = mb / 1024;
    return { val: gb.toFixed(2), unit: "GB/s" };
};

const formatStorage = (bytes) => {
  const gb = bytes / (1024 ** 3);
  if (gb < 1000) return `${gb.toFixed(1)} GB`;
  return `${(gb / 1024).toFixed(2)} TB`;
};

const PartComp = ({ part, index }) => {
  const label = part.name === part.mount_point 
    ? part.mount_point 
    : `${part.name} (${part.mount_point})`;

  const usedBytes = part.total_bytes - part.free_bytes;

  return (
    <div className="group flex flex-col space-y-1">
      <div className="flex justify-between text-[11px] font-medium text-ctp-light-subtext1 dark:text-ctp-dark-subtext1">
        <span>{index + 1} - {label}</span>
        <span className="font-mono">
          <span className="group-hover:hidden">{formatStorage(part.total_bytes)}</span>
          <span className="hidden group-hover:inline text-ctp-light-text dark:text-ctp-dark-text font-bold">
            {part.usage_percent.toFixed(1)}% | {formatStorage(usedBytes)} / {formatStorage(part.total_bytes)}
          </span>
        </span>
      </div>
      
      <div className="w-full bg-ctp-light-surface0 dark:bg-ctp-dark-surface0 rounded-full h-2.5 overflow-hidden border border-ctp-light-surface1 dark:border-ctp-dark-surface1">
        <div
          className={`h-full transition-all duration-1000 ease-out ${getDiskColor(part.usage_percent, 'bg')}`}
          style={{ width: `${part.usage_percent}%` }}
        ></div>
      </div>
    </div>
  );
};

export default function DiskComp({ data }) {
  if (!data || !data.disks) return null;

  let fixedCount = 0;
  let removableCount = 0;

  return (
    <div className="col-span-full mt-10">
      {/* Centered Title with Retro Rainbow Underline */}
      <div className="flex flex-col items-center mb-10">
        <h2 className="text-2xl font-black text-ctp-light-text dark:text-ctp-dark-text uppercase tracking-[0.2em]">
          Storage Devices
        </h2>
        <div className="h-1.5 w-48 mt-3 rounded-full bg-linear-to-r from-ctp-light-red via-ctp-light-peach via-ctp-light-yellow via-ctp-light-green via-ctp-light-sky to-ctp-light-blue dark:from-ctp-dark-red dark:via-ctp-dark-peach dark:via-ctp-dark-yellow dark:via-ctp-dark-green dark:via-ctp-dark-sky dark:to-ctp-dark-blue"></div>
      </div>
      
      {/* Flex container: max 2 per row, stretch if alone */}
      <div className="flex flex-wrap gap-6">
        {data.disks.map((disk, idx) => {
          let title = disk.is_removable 
            ? `REMOVABLE DISK ${++removableCount}` 
            : `DISK ${++fixedCount}`;

          const read_sp = formatSpeed(disk.read_speed);
          const write_sp = formatSpeed(disk.write_speed);

          return (
            <div 
              key={idx} 
              className="grow min-w-full lg:min-w-[calc(50%-1.5rem)] bg-ctp-light-base dark:bg-ctp-dark-base p-6 rounded-2xl shadow-xl border-2 border-ctp-light-surface1 dark:border-ctp-dark-surface1"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-black text-ctp-light-text dark:text-ctp-dark-text">{title}</h3>
                  <p className="text-xs font-mono text-ctp-light-subtext0 dark:text-ctp-dark-subtext0 mt-1">
                    {disk.name}
                  </p>
                </div>
                
                {/* Clean, Separated Read/Write Speeds */}
                <div className="flex gap-10">
                   <div className="flex flex-col items-center">
                      <span className="text-[12px] uppercase font-black text-ctp-light-sky dark:text-ctp-dark-sky tracking-tighter">Read</span>
                      <span className="text-sm font-mono font-bold">
                        {read_sp.val} <span className="text-[10px] opacity-60">{read_sp.unit}</span>
                      </span>
                   </div>
                   <div className="flex flex-col items-center">
                      <span className="text-[12px] uppercase font-black text-ctp-light-yellow dark:text-ctp-dark-yellow tracking-tighter">Write</span>
                      <span className="text-sm font-mono font-bold">
                        {write_sp.val} <span className="text-[10px] opacity-60">{write_sp.unit}</span>
                      </span>
                   </div>
                </div>
              </div>

              <div className="mt-8">
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-[11px] font-black text-ctp-light-subtext1 dark:text-ctp-dark-subtext1 uppercase tracking-widest">
                    Partitions / {disk.partitions.length}
                  </span>
                  <div className="h-px grow bg-ctp-light-surface1/50 dark:bg-ctp-dark-surface1/50"></div>
                </div>
                
                <div className="space-y-6">
                  {disk.partitions.map((part, pIdx) => (
                    <PartComp key={pIdx} part={part} index={pIdx} />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}