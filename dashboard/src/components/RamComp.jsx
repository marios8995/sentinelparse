export default function RamComp({data}) {
    if (!data) return null;

    const getBarColor = (usage) => {
        if (usage === 100) return 'text-ctp-light-red dark:text-ctp-dark-red'
        if (usage > 90) return 'text-ctp-light-maroon dark:text-ctp-dark-maroon'
        if (usage > 75) return 'text-ctp-light-peach dark:text-ctp-dark-peach'
        if (usage > 60) return 'text-ctp-light-yellow dark:text-ctp-dark-yellow'
        if (usage > 40) return 'text-ctp-light-green dark:text-ctp-dark-green'
        if (usage > 20) return 'text-ctp-light-sky dark:text-ctp-dark-sky'
        return 'text-ctp-light-blue dark:text-ctp-dark-blue'
    };

    const percentage = data.ram_usage;
    const usedGB = (data.ram_used / 1024 / 1024).toFixed(2);
    const totalGB = (data.ram_total / 1024 / 1024).toFixed(1);
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="bg-ctp-light-base dark:bg-ctp-dark-base p-6 rounded-2xl shadow-xl border-2 border-ctp-light-surface1 dark:border-ctp-dark-surface1 flex flex-col items-center w-full sm:w-1/2 lg:w-1/3 h-96">
            <h2 className="text-xl font-bold text-ctp-light-text dark:text-ctp-dark-text mb-8 tracking-widest self-center">RAM</h2>

            <div className="relative flex items-center justify-center group mt-4">

                <svg className="transform -rotate-90 w-48 h-48">

                <circle
                    cx="96"
                    cy="96"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="transparent"
                    className="text-ctp-light-surface0 dark:text-ctp-dark-surface0"
                />

                <circle
                    cx="96"
                    cy="96"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={circumference}
                    style={{ 
                    strokeDashoffset: offset,
                    transition: 'stroke-dashoffset 0.8s ease-out' 
                    }}
                    strokeLinecap="round"
                    className={`${getBarColor(percentage)}`}
                />
                </svg>

                <div className="absolute flex flex-col items-center text-center">
                    <span className="text-4xl font-black text-ctp-light-text dark:text-ctp-dark-text">
                        {Math.round(percentage)}%
                    </span>
                
                    <div className="mt-1 transition-all duration-300 opacity-60">
                        <p className="text-xs font-bold text-ctp-light-subtext0 dark:text-ctp-dark-subtext0 uppercase tracking-tighter">
                            {usedGB} GB Used
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-12 w-full flex justify-between text-s text-ctp-light-subtext1 dark:text-ctp-dark-subtext1 font-mono">
                <span>0 GB</span>
                <span>{totalGB} GB</span>
            </div>
        </div>
    );
}