# Starts the Dexter backend and frontend in separate terminal windows (Windows / PowerShell).
# Usage:  .\start-all.ps1
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$backend = Join-Path $root "backend"
$frontend = Join-Path $root "dexter-frontend"

# 1) Backend window
Start-Process powershell.exe -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$backend'; & '.\venv\Scripts\python.exe' -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
)

# 2) Frontend window
Start-Process powershell.exe -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$frontend'; & '.\start.ps1'"
)

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  Two windows opened:"
Write-Host "    1) Backend  -> http://localhost:8000/docs"
Write-Host "    2) Frontend -> Expo (scan QR / press keys there)"
Write-Host "  Close each window to stop that process."
Write-Host "==============================================" -ForegroundColor Cyan