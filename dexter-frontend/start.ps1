# Auto-updates apiBaseUrl with the current LAN IP, then starts Expo with LAN host.
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254*" } | Select-Object -First 1 -ExpandProperty IPAddress)
if (-not $ip) {
    $ip = "172.20.10.3"
}

$appJson = "app.json"
if (Test-Path $appJson) {
    $content = Get-Content $appJson -Raw
    $content = $content -replace '"apiBaseUrl": "http://[^"]+"', "`"apiBaseUrl`": `"http://$ip`:8000/api/v1`""
    Set-Content $appJson $content -NoNewline
}

$env:REACT_NATIVE_PACKAGER_HOSTNAME = $ip
$env:EXPO_DEVTOOLS_LISTEN_ADDRESS = "0.0.0.0"

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  Dexter Expo Host -> $ip" -ForegroundColor Green
Write-Host "  Backend API URL  -> http://$ip`:8000/api/v1" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Cyan

npx expo start --host lan --clear