$ScriptDir = $PSScriptRoot
$RootPath = Split-Path -Parent $ScriptDir
Set-Location $RootPath
Write-Host "Launching SentinelProbe..." -ForegroundColor Green

$LocalIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
    $_.InterfaceAlias -match 'Wi-Fi|Ethernet' -and 
    $_.InterfaceAlias -notmatch 'vEthernet|Docker' -and 
    $_.IPAddress -notmatch '^169' 
}).IPAddress | Select-Object -First 1

if (!$LocalIP) { $LocalIP = "127.0.0.1" }

$DBPath = Join-Path $RootPath "databases/sentinel.db"
$env:DATABASE_URL = "sqlite:///$DBPath"

Write-Host "Starting Collector..." -NoNewline
Start-Job -Name "SentinelCollector" -ScriptBlock {
    param($path) cd $path; .\.venv\Scripts\python collector/main.py
} -ArgumentList $RootPath | Out-Null
Write-Host " [OK]" -ForegroundColor Green

Write-Host "Starting API..." -NoNewline
Start-Job -Name "SentinelAPI" -ScriptBlock {
    param($path) cd $path; .\.venv\Scripts\python -m uvicorn server.api:app --host 0.0.0.0 --port 8000
} -ArgumentList $RootPath | Out-Null
Write-Host " [OK]" -ForegroundColor Green

Write-Host "Starting Dashboard..." -NoNewline
Start-Job -Name "SentinelDashboard" -ScriptBlock {
    param($path) cd $path/dashboard; npm.cmd run dev -- --host
} -ArgumentList $RootPath | Out-Null
Write-Host " [OK]" -ForegroundColor Green

Write-Host ""
Write-Host "------------------------------------------------" -ForegroundColor Cyan
Write-Host "SENTINEL ACTIVE" -ForegroundColor Green
Write-Host "Local Access:  http://localhost:5173" -ForegroundColor White
Write-Host "Network Access:  http://$($LocalIP):5173" -ForegroundColor White
Write-Host "------------------------------------------------" -ForegroundColor Cyan