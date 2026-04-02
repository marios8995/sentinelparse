@echo off
title Sentinel Probe Control Panel

net session >nul 2>&1
if %errorLevel% == 0 (
    echo [STATUS] Running as Administrator (Ready)
    goto menu
) else (
    echo [WARNING] NOT RUNNING AS ADMIN. 
    echo Please close this and 'Run as Administrator'.
    echo.
    pause
    exit
)

:menu
cls
echo ======================================================
echo                    SENTINEL PROBE
echo ======================================================
echo.
echo  [1] Setup System
echo  [2] Start Services
echo  [3] Stop All Services
echo  [4] Exit
echo.
echo ======================================================
set /p userchoice="Select an option (1-4): "

if "%userchoice%"=="1" goto setup
if "%userchoice%"=="2" goto start
if "%userchoice%"=="3" goto stop
if "%userchoice%"=="4" exit
goto menu

:setup
echo.
echo [!] Running Setup...
powershell.exe -ExecutionPolicy Bypass -File "scripts/setup_win.ps1"
pause
goto menu

:start
echo.
echo [!] Launching Services...
powershell.exe -ExecutionPolicy Bypass -File "scripts/start.ps1"
echo.
echo [SUCCESS] Sentinel is running in the background.
pause
goto menu

:stop
echo.
echo [!] Stopping Services...
powershell.exe -ExecutionPolicy Bypass -File "scripts/stop.ps1"
pause
goto menu
