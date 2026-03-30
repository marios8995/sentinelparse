$ScriptDir = $PSScriptRoot
$RootPath = Split-Path -Parent $ScriptDir
Set-Location $RootPath
Write-Host "Setting up SentinelParse..." -ForegroundColor Cyan

New-NetFirewallRule -DisplayName "SentinelParse API" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "SentinelParse Dashboard" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow

Write-Host "[1/3] Compiling Probe..." -ForegroundColor Yellow
if (Test-Path "probe\build") { Remove-Item -Recurse -Force "probe\build" }
if (!(Test-Path "probe\bin")) { New-Item -ItemType Directory -Path "probe\bin" }
cmake -S probe -B probe/build -DCMAKE_EXE_LINKER_FLAGS="/INCREMENTAL:NO /MANIFEST:NO"
cmake --build probe/build --target SentinelProbe

Write-Host "[2/3] Installing Collector and API Modules..." -ForegroundColor Yellow
if (!(Test-Path ".venv")) { python -m venv .venv }
& .\.venv\Scripts\pip install -r requirements.txt

Write-Host "[3/3] Installing Dashboard Dependencies..." -ForegroundColor Yellow
Set-Location dashboard
npm install
Set-Location $RootPath

Write-Host "Done" -ForegroundColor Green