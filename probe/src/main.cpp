#include <iostream>
#include <fstream>
#include <string>
#include <thread>
#include <chrono>
#include "probe.h"

int main() {
    std::cout << "Starting Sentinel Probe..." << std::endl;
    SystemStats stats = collect_stats();
    std::string test = format_as_json(stats);
    std::cout << test;
    // while (true) {
    //     double cpu = get_cpu_usage();
    //
    //     std::cout << "{\"cpu\": " << cpu << "}" << std::endl;
    //
    //     std::this_thread::sleep_for(std::chrono::seconds(2));
    // }
    return 0;
}