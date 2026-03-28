#include "parsers.h"
#include <fstream>
#include <string>

#ifdef _WIN32
    #define WIN32_LEAN_AND_MEAN
    #include <windows.h>
#endif

RAMData get_ram_data() {
#ifdef _WIN32
    MEMORYSTATUSEX memInfo;
    memInfo.dwLength = sizeof(MEMORYSTATUSEX);
    if (GlobalMemoryStatusEx(&memInfo)) {
        RAMData data;
        data.total = memInfo.ullTotalPhys / 1024;
        size_t available = memInfo.ullAvailPhys / 1024;
        data.used = data.total - available;
        data.percent = (static_cast<double>(data.used) / static_cast<double>(data.total)) * 100.0f;
        return data;
    }
    return {0, 0, 0.0};
#else
    std::ifstream meminfo("/proc/meminfo");
    std::string label, line;
    size_t total = 0, available = 0, value;
    RAMData data;

    while (meminfo >> label >> value >> line) {
        if (label == "MemTotal:") total = value;
        else if (label == "MemAvailable:") available = value;
        if (total && available) break;
    }

    data.total = total;
    data.used = total - available;
    data.percent = total > 0 ? (static_cast<double>(data.used) / total) * 100.0f : 0.0;
    return data;
#endif
}