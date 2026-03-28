#include <chrono>
#include <filesystem>
#include <fstream>
#include <sstream>
#include <thread>
#include "parsers.h"

#ifdef _WIN32
    #define WIN32_LEAN_AND_MEAN
    #include <windows.h>
    #include <comdef.h>
    #include <Wbemidl.h>
#endif

std::string get_cpu_model() {
#ifdef _WIN32
    HKEY hKey;
    char buffer[256];
    DWORD bufferSize = sizeof(buffer);
    if (RegOpenKeyExA(HKEY_LOCAL_MACHINE, "HARDWARE\\DESCRIPTION\\System\\CentralProcessor\\0", 0, KEY_READ, &hKey) == ERROR_SUCCESS) {
        if (RegQueryValueExA(hKey, "ProcessorNameString", NULL, NULL, (LPBYTE)buffer, &bufferSize) == ERROR_SUCCESS) {
            RegCloseKey(hKey);
            std::string s = buffer;
            size_t last = s.find_last_not_of(' ');
            if (last == std::string::npos) {
                s = "";
            }
            s.erase(last + 1);
            return s;
        }
        RegCloseKey(hKey);
    }
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
#ifdef _WIN32
    FILETIME idleTime, kernelTime, userTime;
    if (GetSystemTimes(&idleTime, &kernelTime, &userTime)) {
        ULARGE_INTEGER idle, kernel, user;
        idle.LowPart = idleTime.dwLowDateTime;
        idle.HighPart = idleTime.dwHighDateTime;
        kernel.LowPart = kernelTime.dwLowDateTime;
        kernel.HighPart = kernelTime.dwHighDateTime;
        user.LowPart = userTime.dwLowDateTime;
        user.HighPart = userTime.dwHighDateTime;
        size_t total = kernel.QuadPart + user.QuadPart;
        return {total, idle.QuadPart};
    }
    return {0, 0};
#else
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
#endif
}

double get_cpu_usage() {
#ifdef _WIN32
    CPUData data_current = get_cpu_time();
    std::this_thread::sleep_for(std::chrono::seconds(1));
    CPUData data_new = get_cpu_time();
    auto total_delta = static_cast<double>(data_new.total - data_current.total);
    auto idle_delta = static_cast<double>(data_new.idle - data_current.idle);
    if (total_delta == 0) {
        return 0.0;
    }
    double usage = 100.0 * (1.0 - idle_delta / total_delta);
    return usage;
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
    typedef struct _SYSTEM_PROCESSOR_PERFORMANCE_INFORMATION {
        LARGE_INTEGER IdleTime;
        LARGE_INTEGER KernelTime;
        LARGE_INTEGER UserTime;
        LARGE_INTEGER DpcTime;
        LARGE_INTEGER InterruptTime;
        ULONG InterruptCount;
    } SYSTEM_PROCESSOR_PERFORMANCE_INFORMATION;

    typedef LONG(WINAPI *pNtQuerySystemInformation)(UINT, PVOID, ULONG, PULONG);

    pNtQuerySystemInformation ntQuerySystemInformation = (pNtQuerySystemInformation)GetProcAddress(
        GetModuleHandleA("ntdll.dll"), "NtQuerySystemInformation");

    if (ntQuerySystemInformation == nullptr) {
        return {};
    }

    SYSTEM_INFO sysInfo;
    GetSystemInfo(&sysInfo);
    int numCores = sysInfo.dwNumberOfProcessors;

    std::vector<SYSTEM_PROCESSOR_PERFORMANCE_INFORMATION> infos(numCores);
    ULONG returnLength;

    if (ntQuerySystemInformation(8, infos.data(), sizeof(SYSTEM_PROCESSOR_PERFORMANCE_INFORMATION) * numCores, &returnLength) != 0) {
        return {};
    }

    std::vector<CPUData> data;
    for (int i = 0; i < numCores; ++i) {
        ULARGE_INTEGER total, idle;
        total.QuadPart = infos[i].KernelTime.QuadPart + infos[i].UserTime.QuadPart;
        idle.QuadPart = infos[i].IdleTime.QuadPart;
        data.push_back({total.QuadPart, idle.QuadPart});
    }
    return data;
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
    std::vector<CPUData> data_current = get_cpu_cores_time();
    std::this_thread::sleep_for(std::chrono::seconds(1));
    std::vector<CPUData> data_new = get_cpu_cores_time();
    std::vector<double> usage;

    if (data_current.empty() || data_new.empty() || data_current.size() != data_new.size()) {
        SYSTEM_INFO sysInfo;
        GetSystemInfo(&sysInfo);
        return std::vector<double>(sysInfo.dwNumberOfProcessors, 0.0);
    }

    for (size_t i = 0; i < data_current.size(); i++) {
        auto total_delta = static_cast<double>(data_new[i].total - data_current[i].total);
        auto idle_delta = static_cast<double>(data_new[i].idle - data_current[i].idle);
        if (total_delta == 0) {
            usage.push_back(0.0);
        } else {
            double core_usage = 100.0 * (1.0 - idle_delta / total_delta);
            usage.push_back(core_usage < 0 ? 0 : core_usage);
        }
    }
    return usage;
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
    HRESULT hres;
    hres = CoInitializeEx(0, COINIT_MULTITHREADED);
    if (FAILED(hres)) {
        return -7.0;
    }

    hres = CoInitializeSecurity(
        NULL,
        -1,
        NULL,
        NULL,
        RPC_C_AUTHN_LEVEL_DEFAULT,
        RPC_C_IMP_LEVEL_IMPERSONATE,
        NULL,
        EOAC_NONE,
        NULL
    );

    if (FAILED(hres)) {
        CoUninitialize();
        return -6.0;
    }

    IWbemLocator *pLoc = NULL;
    hres = CoCreateInstance(
        CLSID_WbemLocator,
        0,
        CLSCTX_INPROC_SERVER,
        IID_IWbemLocator, (LPVOID *)&pLoc);

    if (FAILED(hres)) {
        CoUninitialize();
        return -5.0;
    }

    IWbemServices *pSvc = NULL;
    hres = pLoc->ConnectServer(
        _bstr_t(L"ROOT\\WMI"),
        NULL,
        NULL,
        0,
        0,
        0,
        0,
        &pSvc
    );

    if (FAILED(hres)) {
        pLoc->Release();
        CoUninitialize();
        return -4.0;
    }

    hres = CoSetProxyBlanket(
        pSvc,
        RPC_C_AUTHN_WINNT,
        RPC_C_AUTHZ_NONE,
        NULL,
        RPC_C_AUTHN_LEVEL_CALL,
        RPC_C_IMP_LEVEL_IMPERSONATE,
        NULL,
        EOAC_NONE
    );

    if (FAILED(hres)) {
        pSvc->Release();
        pLoc->Release();
        CoUninitialize();
        return -3.0;
    }

    IEnumWbemClassObject* pEnumerator = NULL;
    hres = pSvc->ExecQuery(
        bstr_t(L"WQL"),
        bstr_t(L"SELECT * FROM MSAcpi_ThermalZoneTemperature"),
        WBEM_FLAG_FORWARD_ONLY | WBEM_FLAG_RETURN_IMMEDIATELY,
        NULL,
        &pEnumerator);

    if (FAILED(hres)) {
        pSvc->Release();
        pLoc->Release();
        CoUninitialize();
        return -2.0;
    }

    IWbemClassObject *pclsObj = NULL;
    ULONG uReturn = 0;
    double total_temp = 0;
    int count = 0;

    while (pEnumerator) {
        HRESULT hr = pEnumerator->Next(WBEM_INFINITE, 1, &pclsObj, &uReturn);
        if (0 == uReturn) {
            break;
        }

        VARIANT vtProp;
        hr = pclsObj->Get(L"CurrentTemperature", 0, &vtProp, 0, 0);
        if (SUCCEEDED(hr)) {
            total_temp += (vtProp.uintVal / 10.0) - 273.15;
            count++;
            VariantClear(&vtProp);
        }
        pclsObj->Release();
    }

    pSvc->Release();
    pLoc->Release();
    pEnumerator->Release();
    CoUninitialize();

    if (count > 0) {
        return total_temp / count;
    }

    return -1.0;
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
