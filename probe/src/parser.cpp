#include "probe.h"
#include "parsers.h"
#include <sstream>
#include <format>
#include <chrono>

SystemStats collect_stats() {
    SystemStats stats;
    stats.cpu_model = get_cpu_model();
    stats.cpu_usage_avg = get_cpu_usage();
    stats.cpu_temp = get_cpu_temp();
    stats.cpu_cores_usage = get_cpu_cores_usage();

    RAMData ram_data = get_ram_data();
    stats.ram_total = ram_data.total;
    stats.ram_used = ram_data.used;
    stats.ram_percent = ram_data.percent;

    std::vector<PartitionInfo> partition_info = get_partition_info();
    stats.partitions = partition_info;
    stats.disks = get_disk_info(partition_info);

    std::pair<unsigned long long, unsigned long long> net_speed = get_network_speed();
    stats.net_download_speed = net_speed.first;
    stats.net_upload_speed = net_speed.second;

    stats.system_name = get_system_name();
    stats.os_version = get_os_version();
    stats.timestamp = std::chrono::system_clock::now();
    stats.uptime = get_uptime();
    return stats;
}

std::string format_as_json(const SystemStats& stats) {
    std::stringstream ss;
    ss << "{";
    ss << std::format("\"cpu\": {:.2f}, ", stats.cpu_usage_avg);
    ss << std::format("\"temp\": {:.2f}, ", stats.cpu_temp);
    ss << std::format("\"cpu_model\": \"{}\", ", stats.cpu_model);

    ss << "\"cpu_cores_usage\": [";
    for (size_t i = 0; i < stats.cpu_cores_usage.size(); ++i) {
        ss << std::format("{:.2f}", stats.cpu_cores_usage[i]);
        if (i < stats.cpu_cores_usage.size() - 1) {
            ss << ", ";
        }
    }
    ss << "], ";

    ss << std::format("\"ram\": {:.2f}, ", stats.ram_percent);
    ss << std::format("\"ram_total\": {}, ", stats.ram_total);
    ss << std::format("\"ram_used\": {}, ", stats.ram_used);

    ss << "\"disks\": [";
    for (size_t i = 0; i < stats.disks.size(); ++i) {
        const auto& disk = stats.disks[i];
        ss << "{";
        ss << std::format("\"device_name\": \"{}\", \"read_kbps\": {:.2f}, \"write_kbps\": {:.2f}, \"is_removable\": {}",
            disk.device_name, disk.read_kbps, disk.write_kbps, (disk.is_removable ? "true" : "false"));

        ss << ", \"partitions\": [";
        bool first_partition = true;
        for (const auto& partition : stats.partitions) {
            bool match = false;
#ifdef _WIN32
            if (partition.device == disk.device_name) {
                match = true;
            }
#else
            if (partition.device.find(disk.device_name) != std::string::npos) {
                match = true;
            }
#endif
            if (match) {
                if (!first_partition) {
                    ss << ", ";
                }
                ss << std::format(
                    "{{\"name\": \"{}\", \"mount_point\": \"{}\", \"device\": \"{}\", \"total\": {}, \"available\": {}, \"percent_used\": {:.2f}}}",
                    partition.name, partition.mount_point, partition.device, partition.total, partition.available, partition.percent_used
                );
                first_partition = false;
            }
        }
        ss << "]";
        ss << "}";

        if (i < stats.disks.size() - 1) {
            ss << ", ";
        }
    }
    ss << "], ";

    ss << std::format("\"net_download_speed\": {}, ", stats.net_download_speed);
    ss << std::format("\"net_upload_speed\": {}, ", stats.net_upload_speed);
    ss << std::format("\"system_name\": \"{}\", ", stats.system_name);
    ss << std::format("\"os_version\": \"{}\", ", stats.os_version);
    ss << std::format("\"uptime\": {}, ", stats.uptime);
    ss << std::format("\"timestamp\": {}", std::chrono::system_clock::to_time_t(stats.timestamp));
    ss << "}";
    return ss.str();
}