#include "parsers.h"
#include <fstream>
#include <sstream>
#include <thread>
#include <chrono>

#ifdef _WIN32
    #define WIN32_LEAN_AND_MEAN
    #include <winsock2.h>
    #include <ws2tcpip.h>
    #include <iphlpapi.h>
    #pragma comment(lib, "ws2_32.lib")
    #pragma comment(lib, "iphlpapi.lib")
#endif

NetData get_net_data() {
#ifdef _WIN32
    NetData data;
    PMIB_IF_TABLE2 table;
    if (GetIfTable2(&table) == NO_ERROR) {
        for (ULONG i = 0; i < table->NumEntries; i++) {
            const MIB_IF_ROW2& row = table->Table[i];
            if (row.OperStatus == IfOperStatusUp && row.Type != 24) {
                data.total_received_bytes += row.InOctets;
                data.total_transmitted_bytes += row.OutOctets;
            }
        }
        FreeMibTable(table);
    }
    return data;
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
    NetData d1 = get_net_data();
    std::this_thread::sleep_for(std::chrono::seconds(1));
    NetData d2 = get_net_data();
    unsigned long long down = d2.total_received_bytes - d1.total_received_bytes;
    unsigned long long up = d2.total_transmitted_bytes - d1.total_transmitted_bytes;
    return {down, up};
#else
    NetData data1 = get_net_data();
    std::this_thread::sleep_for(std::chrono::seconds(1));
    NetData data2 = get_net_data();

    unsigned long long download_speed_bps = (data2.total_received_bytes - data1.total_received_bytes);
    unsigned long long upload_speed_bps = (data2.total_transmitted_bytes - data1.total_transmitted_bytes);

    return {download_speed_bps, upload_speed_bps};
#endif
}
