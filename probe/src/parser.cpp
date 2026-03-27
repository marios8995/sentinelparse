#include <filesystem>
#include "probe.h"
#include <fstream>
#include <sstream>
#include <iostream>
#include <vector>
#include <numeric>
#include <format>
#include <set>
#include <unistd.h>
#include <thread>
#include <chrono>
#include <map>
#include <sys/utsname.h>
#ifdef _WIN32
    #include <windows.h>
#else
    #include <sys/sysinfo.h>
#endif

std::string get_cpu_model() {
#ifdef _WIN32

    return "Generic CPU";
#else
    std::ifstream cpuinfo("/proc/cpuinfo");
    std::string line;
    std::string result = "Generic CPU";
    if (!cpuinfo.is_open()) return result;
    while (std::getline(cpuinfo, line)) {
        size_t pos = line.find(':');
        if (line.find("model name") != std::string::npos && pos != std::string::npos) {
            if (pos + 2 < line.length()) {
                result = line.substr(pos + 2);
            }
            break;
        }
    }
    cpuinfo.close();
    return result;
#endif
}

CPUData get_cpu_time() {
    std::ifstream data_in("/proc/stat");
    std::string line;
    std::getline(data_in, line);
    std::string label;
    size_t value;
    size_t total = 0;
    size_t idle = 0;
    std::vector<size_t> values;
    std::stringstream ss(line);
    ss >> label;
    while (ss >> value) {
        values.push_back(value);
        total += value;
    }
    idle = values[3] + values[4];
    return {total, idle};
}

double get_cpu_usage() {
#ifdef _WIN32

    return 0.0;
#else
    CPUData data_current = get_cpu_time();
    std::this_thread::sleep_for(std::chrono::seconds(1));
    CPUData data_new = get_cpu_time();
    auto total_delta = static_cast<float>(data_new.total - data_current.total);
    auto idle_delta = static_cast<float>(data_new.idle - data_current.idle);
    float usage = 100.0f * (1.0f - (idle_delta / total_delta));
    return usage;
#endif
}

std::vector<CPUData> get_cpu_cores_time() {
#ifdef _WIN32

    return {};
#else
    std::ifstream data_in("/proc/stat");
    std::string line;
    std::vector<CPUData> data;
    std::string label;
    size_t value;

    while (std::getline(data_in, line)) {
        if (line.find("cpu") != std::string::npos && line.find("cpu ") == std::string::npos) {
            std::stringstream ss(line);
            ss >> label;
            size_t total = 0;
            size_t idle = 0;
            std::vector<size_t> values;
            while (ss >> value) {
                values.push_back(value);
                total += value;
            }
            idle = values[3] + values[4];
            data.push_back({total, idle});
        }
    }
    data_in.close();
    return data;
#endif
}

std::vector<double> get_cpu_cores_usage() {
#ifdef _WIN32

    return {};
#else
    std::vector<CPUData> data_current = get_cpu_cores_time();
    std::this_thread::sleep_for(std::chrono::seconds(1));
    std::vector<CPUData> data_new = get_cpu_cores_time();
    std::vector<double> usage;
    for (size_t i = 0; i < data_current.size(); i++) {
        auto total_delta = static_cast<float>(data_new[i].total - data_current[i].total);
        auto idle_delta = static_cast<float>(data_new[i].idle - data_current[i].idle);
        float usage_i = 100.0f * (1.0f - (idle_delta / total_delta));
        usage.push_back(usage_i);
    }
    return usage;
#endif
}

double get_cpu_temp() {
#ifdef _WIN32
    return 0.0;
#else
    for (const auto& entry : std::filesystem::directory_iterator("/sys/class/hwmon/")) {
        std::ifstream nameFile(entry.path().string() + "/name");
        std::string sensorName;
        nameFile >> sensorName;
        if (sensorName == "k10temp" || sensorName == "coretemp") {
            std::ifstream tempFile(entry.path().string() + "/temp1_input");
            if (tempFile.is_open()) {
                double temp;
                tempFile >> temp;
                tempFile.close();
                return temp / 1000.0;
            }
            tempFile.close();
        }
        nameFile.close();
    }
    return -1.0;
#endif
}

RAMData get_ram_data() {
#ifdef _WIN32
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

std::vector<PartitionInfo> get_partition_info() {
#ifdef _WIN32
    return {};
#else
    std::set<std::string> seen_dev;
    std::vector<PartitionInfo> partitions;
    std::ifstream mounts("/proc/mounts");
    if (!mounts.is_open()) return partitions;
    std::string line;
    while (std::getline(mounts, line)) {
        std::stringstream ss(line);
        std::string device, mount_point, type;
        if (!(ss >> device >> mount_point >> type)) continue;
        if (device.substr(0,5) != "/dev/") continue;
        if (type == "tmpfs" || type == "devtmpfs") continue;
        if (seen_dev.count(device)) continue;
        if (mount_point.find("boot") != std::string::npos || mount_point.find("efi") != std::string::npos) continue;
        seen_dev.insert(device);
        PartitionInfo info;
        info.mount_point = mount_point;
        if (mount_point == "/") {
            info.name = "System";
        }
        else if (mount_point.starts_with("/") && !mount_point.starts_with("/run")) {
            info.name = mount_point.substr(1);
        }
        else {
            info.name = device.substr(5,device.length());
        }
        try {
            auto space = std::filesystem::space(mount_point);
            info.total = space.capacity;
            info.available = space.available;
            info.percent_used = static_cast<double>(space.capacity - space.available) / space.capacity * 100.0f;
        } catch (...) {
            continue;
        }
        info.device = device;
        partitions.push_back(info);
    }
    mounts.close();
    return partitions;
#endif
}

std::map<std::string, std::pair<unsigned long, unsigned long>> get_disk_stats(const std::set<std::string>& devices) {
    std::map<std::string, std::pair<unsigned long, unsigned long>> stats;
    std::ifstream diskstats("/proc/diskstats");
    std::string line;
    while (std::getline(diskstats, line)) {
        std::stringstream ss(line);
        unsigned int major, minor;
        std::string device_name;
        unsigned long reads, read_sectors, writes, write_sectors;
        ss >> major >> minor >> device_name;
        if (devices.count(device_name)) {
            ss >> reads >> read_sectors >> writes >> write_sectors;
            stats[device_name] = {read_sectors, write_sectors};
        }
    }
    return stats;
}

std::vector<DiskInfo> get_disk_info(const std::vector<PartitionInfo>& partition_info) {
#ifdef _WIN32
    return {};
#else
    std::set<std::string> device_names;
    for (const auto& p : partition_info) {
        std::string dev_name = p.device.substr(p.device.find_last_of('/') + 1);
        std::string base_name = dev_name;
        size_t p_pos = base_name.find_last_of('p');
        bool is_nvme_or_mmc = (base_name.find("nvme") == 0 || base_name.find("mmcblk") == 0);
        if (is_nvme_or_mmc && p_pos != std::string::npos && p_pos > 0 && isdigit(base_name[p_pos + 1])) {
            base_name.erase(p_pos);
        } else {
            size_t last_digit_pos = base_name.find_last_of("0123456789");
            if (last_digit_pos != std::string::npos && last_digit_pos == base_name.length() - 1) {
                while (!base_name.empty() && isdigit(base_name.back())) {
                    base_name.pop_back();
                }
            }
        }
        device_names.insert(base_name);
    }

    auto stats1 = get_disk_stats(device_names);
    std::this_thread::sleep_for(std::chrono::seconds(1));
    auto stats2 = get_disk_stats(device_names);

    std::vector<DiskInfo> disk_infos;
    for (const auto& device_name : device_names) {
        DiskInfo info;
        info.device_name = device_name;
        if (stats1.count(device_name) && stats2.count(device_name)) {
            auto read_delta = stats2[device_name].first - stats1[device_name].first;
            auto write_delta = stats2[device_name].second - stats1[device_name].second;
            info.read_kbps = (static_cast<double>(read_delta) * 512) / 1024.0;
            info.write_kbps = (static_cast<double>(write_delta) * 512) / 1024.0;
            std::ifstream file("/sys/block/" + device_name + "/removable");
            int val;
            info.is_removable = (file >> val) && (val == 1);
        }
        disk_infos.push_back(info);
    }
    return disk_infos;
#endif
}

NetData get_net_data() {
#ifdef _WIN32
    return {0, 0};
#else
    std::ifstream net_dev("/proc/net/dev");
    std::string line;
    std::getline(net_dev, line);
    std::getline(net_dev, line);

    unsigned long long total_received_bytes = 0;
    unsigned long long total_transmitted_bytes = 0;

    while (std::getline(net_dev, line)) {
        std::stringstream ss(line);
        std::string interface_name;
        ss >> interface_name;
        interface_name.pop_back();

        if (interface_name == "lo" || interface_name.empty() || interface_name.find("veth") == 0 || interface_name.find("br-") == 0) {
            continue;
        }

        unsigned long long received_bytes, received_packets, received_errs, received_drop,
                           transmitted_bytes, transmitted_packets, transmitted_errs, transmitted_drop;

        ss >> received_bytes >> received_packets >> received_errs >> received_drop;
        for (int i = 0; i < 4; ++i) {
            std::string dummy;
            ss >> dummy;
        }
        ss >> transmitted_bytes >> transmitted_packets >> transmitted_errs >> transmitted_drop;

        if (received_bytes == 0 && transmitted_bytes == 0) {
            continue;
        }

        total_received_bytes += received_bytes;
        total_transmitted_bytes += transmitted_bytes;
    }
    return {total_received_bytes, total_transmitted_bytes};
#endif
}

std::pair<unsigned long long, unsigned long long> get_network_speed() {
#ifdef _WIN32
    return {0, 0};
#else
    NetData data1 = get_net_data();
    std::this_thread::sleep_for(std::chrono::seconds(1));
    NetData data2 = get_net_data();

    unsigned long long download_speed_bps = (data2.total_received_bytes - data1.total_received_bytes);
    unsigned long long upload_speed_bps = (data2.total_transmitted_bytes - data1.total_transmitted_bytes);

    return {download_speed_bps, upload_speed_bps};
#endif
}

std::string get_system_name() {
#ifdef _WIN32
    return "Unknown System Name";
#else
    struct utsname buf;
    if (uname(&buf) == 0) {
        return buf.nodename;
    }
    return "Unknown System Name";
#endif
}

std::string get_os_version() {
#ifdef _WIN32
    return "Unknown Operating System";
#else
    std::ifstream os_release("/etc/os-release");
    std::string line;
    while (std::getline(os_release, line)) {
        if (line.rfind("PRETTY_NAME=", 0) == 0) {
            return line.substr(14, line.length() - 15);
        }
        if (line.rfind("NAME=", 0) == 0) {
            return line.substr(6, line.length() - 7);
        }
    }
    os_release.close();
    return "Unknown Operating System";
#endif
}

unsigned long long get_uptime() {
#ifdef _WIN32
    return 0;
#else
    std::ifstream uptime_file("/proc/uptime");
    double uptime_seconds;
    if (uptime_file >> uptime_seconds) {
        uptime_file.close();
        return static_cast<unsigned long long>(uptime_seconds);
    }
    uptime_file.close();
    return 0;
#endif
}

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
        ss << std::format(
            "{{\"device_name\": \"{}\", \"read_kbps\": {:.2f}, \"write_kbps\": {:.2f}, \"is_removable\": {}}}",
            disk.device_name, disk.read_kbps, disk.write_kbps, (disk.is_removable ? "true" : "false")
        );
        if (i < stats.disks.size() - 1) {
            ss << ", ";
        }
    }
    ss << "], ";

    ss << "\"partitions\": [";
    for (size_t i = 0; i < stats.partitions.size(); ++i) {
        const auto& partition = stats.partitions[i];
        ss << std::format(
            "{{\"name\": \"{}\", \"mount_point\": \"{}\", \"device\": \"{}\", \"total\": {}, \"available\": {}, \"percent_used\": {:.2f}}}",
            partition.name, partition.mount_point, partition.device, partition.total, partition.available, partition.percent_used
        );
        if (i < stats.partitions.size() - 1) {
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