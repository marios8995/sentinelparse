#ifndef PARSER_H
#define PARSER_H

#include "probe.h"
#include <vector>
#include <string>
#include <map>
#include <set>

std::string get_cpu_model();
CPUData get_cpu_time();
double get_cpu_usage();
std::vector<CPUData> get_cpu_cores_time();
std::vector<double> get_cpu_cores_usage();
double get_cpu_temp();

RAMData get_ram_data();

std::vector<PartitionInfo> get_partition_info();
std::map<std::string, std::pair<unsigned long, unsigned long>> get_disk_stats(const std::set<std::string>& devices);
std::vector<DiskInfo> get_disk_info(const std::vector<PartitionInfo>& partition_info);

NetData get_net_data();
std::pair<unsigned long long, unsigned long long> get_network_speed();

std::string get_system_name();
std::string get_os_version();
unsigned long long get_uptime();

#endif