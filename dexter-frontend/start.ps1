# Auto-updates apiBaseUrl with the current LAN IP, then starts Expo with LAN host.
# Prefer the IPv4 on the interface that owns the default route (the actually-active
# network) — avoids advertising a stale/alternate adapter IP that the phone can't reach.
$ip = $null
$defaultRoute = Get-NetRoute -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.DestinationPrefix -eq "0.0.0.0/0" } | Sort-Object RouteMetric | Select-Object -First 1
if ($defaultRoute) {
    $ip = Get-NetIPAddress -AddressFamily IPv4 -InterfaceIndex $defaultRoute.InterfaceIndex -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254*" } | Select-Object -First 1 -ExpandProperty IPAddress
}
if (-not $ip) {
    $ip = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254*" } | Select-Object -First 1 -ExpandProperty IPAddress
}
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

# Skip Expo's remote npm version check (avoids transient "TypeError: fetch failed"
# in getNativeModuleVersionsAsync when api.expo.dev is unreachable / flaky).
$env:EXPO_OFFLINE = "1"

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  Dexter Expo Host -> $ip" -ForegroundColor Green
Write-Host "  Backend API URL  -> http://$ip`:8000/api/v1" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Cyan

npx expo start --host lan --clear