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
Start-Process -FilePath "powershell.exe" `
    -ArgumentList "-NoProfile -Command `".\.venv\Scripts\python collector/main.py`"" `
    -WorkingDirectory $RootPath -WindowStyle Hidden
Write-Host " [OK]" -ForegroundColor Green

Write-Host "Starting API..." -NoNewline
Start-Process -FilePath "powershell.exe" `
    -ArgumentList "-NoProfile -Command `".\.venv\Scripts\python -m uvicorn server.api:app --host 0.0.0.0 --port 8000`"" `
    -WorkingDirectory $RootPath -WindowStyle Hidden
Write-Host " [OK]" -ForegroundColor Green

Write-Host "Starting Dashboard..." -NoNewline
Start-Process -FilePath "powershell.exe" `
    -ArgumentList "-NoProfile -Command `"npm.cmd run dev -- --host`"" `
    -WorkingDirectory "$RootPath\dashboard" -WindowStyle Hidden
Write-Host " [OK]" -ForegroundColor Green

Write-Host ""
Write-Host "------------------------------------------------" -ForegroundColor Cyan
Write-Host "SENTINEL ACTIVE" -ForegroundColor Green
Write-Host "Local Access:  http://localhost:5173" -ForegroundColor White
Write-Host "Network Access:  http://$($LocalIP):5173" -ForegroundColor White
Write-Host "------------------------------------------------" -ForegroundColor Cyan