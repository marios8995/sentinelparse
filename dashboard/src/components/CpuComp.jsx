export default function CpuComp({data}) {
    if (!data) return null;
    const getTempColor = (temp) => {
        if (temp > 95) return 'text-ctp-light-red dark:text-ctp-dark-red'
        if (temp > 85) return 'text-ctp-light-maroon dark:text-ctp-dark-maroon'
        if (temp > 65) return 'text-ctp-light-peach dark:text-ctp-dark-peach'
        if (temp > 45) return 'text-ctp-light-green dark:text-ctp-dark-green'
        return 'text-ctp-light-sky dark:text-ctp-dark-sky'
    };

    const getBarColor = (usage) => {
        if (usage === 100) return 'bg-ctp-light-red dark:bg-ctp-dark-red'
        if (usage > 90) return 'bg-ctp-light-maroon dark:bg-ctp-dark-maroon'
        if (usage > 75) return 'bg-ctp-light-peach dark:bg-ctp-dark-peach'
        if (usage > 60) return 'bg-ctp-light-yellow dark:bg-ctp-dark-yellow'
        if (usage > 40) return 'bg-ctp-light-green dark:bg-ctp-dark-green'
        if (usage > 20) return 'bg-ctp-light-sky dark:bg-ctp-dark-sky'
        return 'bg-ctp-light-blue dark:bg-ctp-dark-blue'
    };

    return (
        <div className="w-full bg-ctp-light-base dark:bg-ctp-dark-base p-6 md:p-8 rounded-2xl shadow-xl border-2 border-ctp-light-surface1 dark:border-ctp-dark-surface1">

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-ctp-light-text dark:text-ctp-dark-text">
                        {data.cpu_model || "Central Processing Unit"}
                    </h2>
                    <p className="text-sm text-ctp-light-subtext0 dark:text-ctp-dark-subtext0">CPU Overall Utilization</p>
                </div>
                <div className="text-right">
                    <p className={`text-4xl font-black ${getTempColor(data.cpu_temp)}`}>
                    {data.cpu_temp}°C
                    </p>
                    <p className="text-sm text-ctp-light-subtext0 dark:text-ctp-dark-subtext0">Current Temp</p>
                </div>
            </div>

            <div className="mb-10">
                <div className="flex justify-between text-sm mb-2 font-semibold text-ctp-light-text dark:text-ctp-dark-text">
                    <span></span>
                    <span className="text-lg">{data.cpu_overall}%</span>
                    <span></span>
                </div>
                <div className="w-full bg-ctp-light-surface0 dark:bg-ctp-dark-surface0 rounded-full h-4 overflow-hidden">
                    <div
                        className={`h-4 rounded-full transition-all duration-1000 ease-out ${getBarColor(data.cpu_overall)}`}
                        style={{ width: `${data.cpu_overall}%` }}
                    ></div>
                </div>
            </div>

            <div>
                <h3 className="text-sm font-semibold text-ctp-light-subtext0 dark:text-ctp-dark-subtext0 mb-1 mt-12 uppercase tracking-wider text-center">
                    Logical Cores ({data.cpu_cores.length})
                </h3>

                <div className="flex flex-wrap justify-center gap-x-2 gap-y-10 ">
                {data.cpu_cores.map((core, index) => (
                    <div key={index} className="flex flex-col items-center justify-end flex-1 min-w-10 max-w-20 group">

                        <span className="text-[10px] mb-1 text-ctp-light-text dark:text-ctp-dark-text font-medium opacity-0 group-hover:opacity-100 transition-opacity ">
                            {core.usage_percent}%
                        </span>
                    
                        {/* Vertical Track */}
                        <div className="w-full bg-ctp-light-surface0 dark:bg-ctp-dark-surface0 rounded-md h-24 flex items-end overflow-hidden">
                            {/* Vertical Fill */}
                            <div
                            className={`w-full transition-all duration-1000 ease-out ${getBarColor(core.usage_percent)}`}
                            style={{ height: `${core.usage_percent}%` }}
                            ></div>
                        </div>
                    
                        {/* Core Label */}
                        <span className="text-[10px] mt-2 text-ctp-light-subtext0 dark:text-ctp-dark-subtext0 whitespace-nowrap">
                            C{index + 1}
                        </span>
                    </div>
                ))}
                </div>
            </div>

        </div>
    )

}