Write-Host "Stopping all Sentinel services..." -ForegroundColor Yellow

Stop-Process -Name "python" -ErrorAction SilentlyContinue
Stop-Process -Name "node" -ErrorAction SilentlyContinue
Stop-Process -Name "SentinelProbe" -ErrorAction SilentlyContinue

Stop-Process -Name "python", "node" -ErrorAction SilentlyContinue

Write-Host "All services stopped." -ForegroundColor Green