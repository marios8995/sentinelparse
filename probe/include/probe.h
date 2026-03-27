#ifndef PROBE_H
#define PROBE_H

#include <string>
#include <vector>
#include <chrono>
#include <map>

struct DiskInfo {
    std::string device_name = "Unknown"; // e.g., "nvme0n1"
    double read_kbps = 0.0;
    double write_kbps = 0.0;
    bool is_removable = false;
};

struct PartitionInfo {
    std::string name = "Unknown";
    std::string mount_point = "Unknown";
    std::string device = "Unknown";
    unsigned long long total = 0.0;
    unsigned long long available = 0.0;
    double percent_used = 0.0;
};

struct SystemStats {

    std::string cpu_model = "Unknown Model";
    double cpu_usage_avg = 0.0;
    double cpu_temp = 0.0;
    std::vector<double> cpu_cores_usage = {};

    size_t ram_total = 0;
    size_t ram_used = 0;
    double ram_percent = 0.0;

    std::vector<DiskInfo> disks = {};
    std::vector<PartitionInfo> partitions = {};

    unsigned long long net_download_speed = 0.0;
    unsigned long long net_upload_speed = 0.0;

    std::string system_name = "Unknown System Name";
    std::string os_version = "Unknown Operating System";
    std::chrono::system_clock::time_point timestamp = std::chrono::system_clock::now();
    unsigned long long uptime = 0.0;

};

struct CPUData {
    size_t total = 0;
    size_t idle = 0;
};

struct RAMData {
    size_t total = 0;
    size_t used = 0;
    double percent = 0.0;
};

struct NetData {
    unsigned long long total_received_bytes = 0;
    unsigned long long total_transmitted_bytes = 0;
};

SystemStats collect_stats();
std::string format_as_json(const SystemStats& stats);

#endif