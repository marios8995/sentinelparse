#include "parsers.h"
#include <fstream>
#include <string>

#ifdef _WIN32
    #define WIN32_LEAN_AND_MEAN
    #include <windows.h>
#else
    #include <sys/utsname.h>
    #include <sys/sysinfo.h>
#endif

std::string get_system_name() {
#ifdef _WIN32
    char buffer[MAX_COMPUTERNAME_LENGTH + 1];
    DWORD size = sizeof(buffer);
    if (GetComputerNameA(buffer, &size)) {
        return std::string(buffer);
    }
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
    HKEY hKey;
    char name[256];
    DWORD size = sizeof(name);
    if (RegOpenKeyExA(HKEY_LOCAL_MACHINE, "SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion", 0, KEY_READ, &hKey) == ERROR_SUCCESS) {
        if (RegQueryValueExA(hKey, "ProductName", NULL, NULL, (LPBYTE)name, &size) == ERROR_SUCCESS) {
            RegCloseKey(hKey);
            return std::string(name);
        }
        RegCloseKey(hKey);
    }
    return "Unknown Windows System";
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
    return "Unknown Linux System";
#endif
}

unsigned long long get_uptime() {
#ifdef _WIN32
    return GetTickCount64() / 1000;
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
