# Test FXStreet API
$headers = @{
    "Authorization" = "Api-Key 1xPQ0mcU.W6Sv0rzrDnN9dVvCQLbQ3FRgqjXe1pBM"
    "Content-Type" = "application/json"
}

Write-Host "Testing FXStreet API..." -ForegroundColor Yellow
$fxstreetResponse = Invoke-RestMethod -Uri "https://www.jblanked.com/news/api/fxstreet/calendar/range/?from=2024-01-01&to=2026-12-31" -Headers $headers -Method Get

if ($fxstreetResponse -is [System.Array]) {
    Write-Host "FXStreet returns ARRAY format" -ForegroundColor Green
    Write-Host "Total events: $($fxstreetResponse.Length)" -ForegroundColor Cyan
    Write-Host "First event:" -ForegroundColor Cyan
    $fxstreetResponse[0] | ConvertTo-Json
} else {
    Write-Host "FXStreet returns OBJECT format" -ForegroundColor Green
    Write-Host "Object keys: $($fxstreetResponse.PSObject.Properties.Name -join ', ')" -ForegroundColor Cyan
    if ($fxstreetResponse.value) {
        Write-Host "Has 'value' property with $($fxstreetResponse.value.Length) events" -ForegroundColor Cyan
    }
}
