#include <iostream>
#include <fstream>
#include <string>
#include <chrono>
#include "probe.h"

int main() {
    try {
        SystemStats stats = collect_stats();
        std::string json_output = format_as_json(stats);
        std::cout << json_output << std::endl;
        return 0;
    } catch (const std::exception& e) {
        std::cerr << "{\"error\": \"" << e.what() << "\"}" << std::endl;
        return 1;
    } catch (...) {
        std::cerr << "{\"error\": \"Unknown critical failure\"}" << std::endl;
        return 1;
    }
}