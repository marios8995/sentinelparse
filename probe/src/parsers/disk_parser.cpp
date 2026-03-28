#include "parsers.h"
#include <fstream>
#include <sstream>
#include <filesystem>
#include <thread>
#include <chrono>

#ifdef _WIN32
    #define WIN32_LEAN_AND_MEAN
    #include <windows.h>
    #include <winioctl.h>
#endif

std::vector<PartitionInfo> get_partition_info() {
#ifdef _WIN32
    std::vector<PartitionInfo> partitions;
    char buffer[128];
    DWORD len = GetLogicalDriveStringsA(sizeof(buffer) - 1, buffer);
    if (len > 0) {
        char* drive = buffer;
        while (*drive) {
            PartitionInfo info;
            info.mount_point = drive;
            info.name = drive;
            ULARGE_INTEGER total, free;
            if (GetDiskFreeSpaceExA(drive, NULL, &total, &free)) {
                info.total = total.QuadPart;
                info.available = free.QuadPart;
                info.percent_used = (static_cast<double>(total.QuadPart - free.QuadPart) / total.QuadPart) * 100.0;
            }

            std::string volume_path = "\\\\.\\" + std::string(drive, 2);
            HANDLE hVolume = CreateFileA(volume_path.c_str(), 0, FILE_SHARE_READ | FILE_SHARE_WRITE, NULL, OPEN_EXISTING, 0, NULL);
            if (hVolume != INVALID_HANDLE_VALUE) {
                VOLUME_DISK_EXTENTS extents;
                DWORD bytesReturned;
                if (DeviceIoControl(hVolume, IOCTL_VOLUME_GET_VOLUME_DISK_EXTENTS, NULL, 0, &extents, sizeof(extents), &bytesReturned, NULL)) {
                    if (bytesReturned > 0) {
                        info.device = "\\\\.\\PhysicalDrive" + std::to_string(extents.Extents[0].DiskNumber);
                    }
                }
                CloseHandle(hVolume);
            }

            partitions.push_back(info);
            drive += strlen(drive) + 1;
        }
    }
    return partitions;
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
#ifdef _WIN32
    std::map<std::string, std::pair<unsigned long, unsigned long>> stats;
    return stats;
#else
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
#endif
}

std::vector<DiskInfo> get_disk_info(const std::vector<PartitionInfo>& partition_info) {
#ifdef _WIN32
    std::set<std::string> device_names;
    std::map<std::string, std::string> device_to_root;
    for (const auto& p : partition_info) {
        if (!p.device.empty()) {
            device_names.insert(p.device);
            if (device_to_root.find(p.device) == device_to_root.end()) {
                device_to_root[p.device] = p.mount_point;
            }
        }
    }
    auto stats1 = get_disk_stats(device_names);
    std::this_thread::sleep_for(std::chrono::seconds(1));
    auto stats2 = get_disk_stats(device_names);
    std::vector<DiskInfo> disk_infos;
    for (const auto& device_name : device_names) {
        DiskInfo info;
        info.device_name = device_name;
        UINT drive_type = GetDriveTypeA(device_to_root[device_name].c_str());
        info.is_removable = (drive_type == DRIVE_REMOVABLE || drive_type == DRIVE_CDROM);
        if (stats1.count(device_name) && stats2.count(device_name)) {
            auto read_delta = stats2.at(device_name).first - stats1.at(device_name).first;
            auto write_delta = stats2.at(device_name).second - stats1.at(device_name).second;
            info.read_kbps = static_cast<double>(read_delta) / 1024.0;
            info.write_kbps = static_cast<double>(write_delta) / 1024.0;
        }
        disk_infos.push_back(info);
    }
    return disk_infos;
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
