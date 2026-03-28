cmake_minimum_required(VERSION 3.20)
project(SentinelProbe LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Add the 'include' directory so the compiler finds probe.h
include_directories(include)

set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/bin)

add_executable(SentinelProbe include/parsers.h include/probe.h
                             src/main.cpp  src/parser.cpp
                             src/parsers/cpu_parser.cpp src/parsers/ram_parser.cpp
                             src/parsers/disk_parser.cpp src/parsers/net_parser.cpp
                             src/parsers/sys_parser.cpp)

if(WIN32)
    target_link_libraries(SentinelProbe PRIVATE iphlpapi ws2_32 wbemuuid ole32 oleaut32 advapi32)
    set(RES_FILE "${CMAKE_CURRENT_SOURCE_DIR}/resource.rc")
    add_executable(probe src/main.cpp src/parser.cpp ${RES_FILE})
    target_link_libraries(probe wbemuuid ole32 oleaut32 advapi32)
endif()
