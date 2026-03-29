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

std::map<std::string, std::pair<unsigned long long, unsigned long long>> get_raw_disk_counters(const std::set<std::string>& devices) {
    std::map<std::string, std::pair<unsigned long long, unsigned long long>> stats;
#ifdef _WIN32
    for (const auto& dev : devices) {
        HANDLE hDevice = CreateFileA(dev.c_str(), 0, FILE_SHARE_READ | FILE_SHARE_WRITE, NULL, OPEN_EXISTING, 0, NULL);
        if (hDevice != INVALID_HANDLE_VALUE) {
            DISK_PERFORMANCE perf;
            DWORD bytesReturned;
            if (DeviceIoControl(hDevice, IOCTL_DISK_PERFORMANCE, NULL, 0, &perf, sizeof(perf), &bytesReturned, NULL)) {
                stats[dev] = { (unsigned long long)perf.BytesRead.QuadPart, (unsigned long long)perf.BytesWritten.QuadPart };
            }
            CloseHandle(hDevice);
        }
    }
#else
    std::ifstream diskstats("/proc/diskstats");
    std::string line;
    while (std::getline(diskstats, line)) {
        std::stringstream ss(line);
        unsigned int major, minor;
        std::string device_name;
        ss >> major >> minor >> device_name;

        if (devices.count(device_name)) {
            // We need to skip to field 6 (Sectors Read) and field 10 (Sectors Written)
            unsigned long long f1, f2, sectors_read, f4, f5, f6, sectors_written;
            ss >> f1 >> f2 >> sectors_read >> f4 >> f5 >> f6 >> sectors_written;

            // Linux sectors are almost always 512 bytes
            stats[device_name] = { sectors_read * 512, sectors_written * 512 };
        }
    }
#endif
    return stats;
}

std::vector<DiskInfo> get_disk_info(const std::vector<PartitionInfo>& partition_info) {
    std::set<std::string> device_names;
    std::map<std::string, std::string> device_to_root;

    for (const auto& p : partition_info) {
#ifdef _WIN32
        if (!p.device.empty()) {
            device_names.insert(p.device);
            device_to_root[p.device] = p.mount_point;
        }
#else
        std::string dev_name = p.device.substr(p.device.find_last_of('/') + 1);
        std::string base_name = dev_name;
        // Logic to strip partition numbers (e.g., sda1 -> sda, nvme0n1p1 -> nvme0n1)
        if (base_name.find("nvme") == 0 || base_name.find("mmcblk") == 0) {
            size_t p_pos = base_name.find_last_of('p');
            if (p_pos != std::string::npos && p_pos > 0 && isdigit(base_name[p_pos+1])) base_name.erase(p_pos);
        } else {
            while (!base_name.empty() && isdigit(base_name.back())) base_name.pop_back();
        }
        device_names.insert(base_name);
#endif
    }

    auto s1 = get_raw_disk_counters(device_names);
    std::this_thread::sleep_for(std::chrono::seconds(1));
    auto s2 = get_raw_disk_counters(device_names);

    std::vector<DiskInfo> disk_infos;
    for (const auto& name : device_names) {
        DiskInfo info;
        info.device_name = name;
        if (s1.count(name) && s2.count(name)) {
            double read_bytes = (double)(s2[name].first - s1[name].first);
            double write_bytes = (double)(s2[name].second - s1[name].second);

            // Convert to KB/s
            info.read_kbps = read_bytes / 1024.0;
            info.write_kbps = write_bytes / 1024.0;
        }

#ifdef _WIN32
        UINT drive_type = GetDriveTypeA(device_to_root[name].c_str());
        info.is_removable = (drive_type == DRIVE_REMOVABLE || drive_type == DRIVE_CDROM);
#else
        std::ifstream file("/sys/block/" + name + "/removable");
        int val;
        info.is_removable = (file >> val) && (val == 1);
#endif
        disk_infos.push_back(info);
    }
    return disk_infos;
}