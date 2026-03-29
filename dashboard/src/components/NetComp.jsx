export default function NetComp({ data }) {
  if (!data) return null;

  const formatSpeed = (bytesPerSec) => {
    if (bytesPerSec === 0) return { val: "0.0", unit: "KB/s" };
    
    const kb = bytesPerSec / 1024;
    if (kb < 1024) return { val: kb.toFixed(1), unit: "KB/s" };
    
    const mb = kb / 1024;
    if (mb < 1024) return { val: mb.toFixed(1), unit: "MB/s" };
    
    const gb = mb / 1024;
    return { val: gb.toFixed(2), unit: "GB/s" };
  };

  const downloadKB = formatSpeed(data.net_down);
  const uploadKB = formatSpeed(data.net_up);

  return (
    <div className="bg-ctp-light-base dark:bg-ctp-dark-base p-6 rounded-2xl shadow-xl border-2 border-ctp-light-surface1 dark:border-ctp-dark-surface1 flex flex-col w-full sm:w-1/2 lg:w-1/3 h-96">
      {/* Centered Title */}
      <h2 className="text-xl font-bold text-ctp-light-text dark:text-ctp-dark-text mb-8 text-center uppercase tracking-widest">
        Network
      </h2>

      <div className="grid grid-cols-2 gap-4 divide-ctp-light-surface1 dark:divide-ctp-dark-surface1 h-54">
        
        {/* Download Column */}
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="flex items-center space-x-2 text-ctp-light-sky dark:text-ctp-dark-sky">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <span className="text-xs font-bold uppercase tracking-tighter opacity-70">Download</span>
          </div>
          <div className="text-center">
            <span className="text-3xl font-black text-ctp-light-text dark:text-ctp-dark-text">
              {downloadKB.val}
            </span>
            <p className="text-[10px] font-mono text-ctp-light-subtext0 dark:text-ctp-dark-subtext0">{downloadKB.unit}</p>
          </div>
        </div>

        {/* Upload Column */}
        <div className="flex flex-col items-center justify-center space-y-2 pl-4">
          <div className="flex items-center space-x-2 text-ctp-light-yellow dark:text-ctp-dark-yellow">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            <span className="text-xs font-bold uppercase tracking-tighter opacity-70">Upload</span>
          </div>
          <div className="text-center">
            <span className="text-3xl font-black text-ctp-light-text dark:text-ctp-dark-text">
              {uploadKB.val}
            </span>
            <p className="text-[10px] font-mono text-ctp-light-subtext0 dark:text-ctp-dark-subtext0">{uploadKB.unit}</p>
          </div>
        </div>

      </div>
      
    </div>
  );
}