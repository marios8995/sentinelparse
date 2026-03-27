cmake_minimum_required(VERSION 3.20)
project(SentinelProbe LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Add the 'include' directory so the compiler finds probe.h
include_directories(include)

add_executable(SentinelProbe src/main.cpp
        include/probe.h
        src/parser.cpp
)
