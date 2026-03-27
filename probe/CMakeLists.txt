cmake_minimum_required(VERSION 3.20)
project(SentinelProbe LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Add the 'include' directory so the compiler finds probe.h
include_directories(include)

add_executable(SentinelProbe src/main.cpp include/probe.h src/parser.cpp)

if(WIN32)
    target_link_libraries(SentinelProbe PRIVATE iphlpapi ws2_32 wbemuuid ole32 oleaut32 advapi32)
    set(RES_FILE "${CMAKE_CURRENT_SOURCE_DIR}/resource.rc")
    add_executable(probe src/main.cpp src/parser.cpp ${RES_FILE})
    target_link_libraries(probe wbemuuid ole32 oleaut32 advapi32)
endif()
