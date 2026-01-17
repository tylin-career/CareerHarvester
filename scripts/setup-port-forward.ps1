# CareerHarvester - Windows Port Forwarding Setup
# Run this script in PowerShell as Administrator
#
# This creates permanent port forwarding from Windows to WSL
# so you can access the app via http://localhost:3000

param(
    [string]$WslIp = ""
)

# If no IP provided, try to get it from WSL
if (-not $WslIp) {
    Write-Host "Getting WSL IP address..." -ForegroundColor Cyan
    $WslIp = (wsl hostname -I).Trim().Split()[0]
    
    if (-not $WslIp) {
        Write-Host "ERROR: Could not determine WSL IP. Please provide it manually:" -ForegroundColor Red
        Write-Host "  .\setup-port-forward.ps1 -WslIp 172.21.159.190" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Blue
Write-Host "  CareerHarvester Port Forwarding      " -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""
Write-Host "WSL IP: $WslIp" -ForegroundColor Green
Write-Host ""

# Remove existing port proxies (ignore errors)
Write-Host "Removing any existing port proxies..." -ForegroundColor Yellow
netsh interface portproxy delete v4tov4 listenport=3000 listenaddress=0.0.0.0 2>$null
netsh interface portproxy delete v4tov4 listenport=5000 listenaddress=0.0.0.0 2>$null

# Add new port proxies
Write-Host "Adding port forwarding rules..." -ForegroundColor Cyan

netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=$WslIp
netsh interface portproxy add v4tov4 listenport=5000 listenaddress=0.0.0.0 connectport=5000 connectaddress=$WslIp

# Add firewall rules (if not exist)
Write-Host "Configuring firewall..." -ForegroundColor Cyan
New-NetFirewallRule -DisplayName "CareerHarvester Frontend (3000)" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow 2>$null
New-NetFirewallRule -DisplayName "CareerHarvester Backend (5000)" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow 2>$null

Write-Host ""
Write-Host "========================================" -ForegroundColor Blue
Write-Host "  Setup Complete!                      " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""
Write-Host "You can now access CareerHarvester at:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "Make sure the servers are running in WSL:" -ForegroundColor Yellow
Write-Host "  cd ~/projects/CareerHarvester && ./start-dev.sh" -ForegroundColor Cyan
Write-Host ""

# Show current port proxy configuration
Write-Host "Current port forwarding rules:" -ForegroundColor Yellow
netsh interface portproxy show v4tov4
