Write-Host "Stopping all Sentinel services..." -ForegroundColor Yellow

# Kill the PowerShell Jobs
Get-Job -Name "Sentinel*" | Stop-Job
Get-Job -Name "Sentinel*" | Remove-Job -Force

# Double Tap: Ensure the underlying processes (Python/Node) are actually dead
Stop-Process -Name "python", "node" -ErrorAction SilentlyContinue

Write-Host "All services stopped." -ForegroundColor Green