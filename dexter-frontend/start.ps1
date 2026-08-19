# Auto-updates apiBaseUrl with the current LAN IP, then starts Expo.
# Run this instead of `npx expo start` so the phone never hits a stale IP.
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254*" } | Select-Object -First 1).IPAddress
if (-not $ip) {
    Write-Host "ERROR: Could not detect LAN IP." -ForegroundColor Red
    exit 1
}

$appJson = "app.json"
$content = Get-Content $appJson -Raw
$content = $content -replace '"apiBaseUrl": "http://[^"]+"', "`"apiBaseUrl`": `"http://$ip`:8000/api/v1`""
Set-Content $appJson $content -NoNewline

Write-Host "apiBaseUrl -> http://$ip`:8000/api/v1" -ForegroundColor Green
npx expo start