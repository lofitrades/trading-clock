# Test Forex Factory API with 3-year date range
$headers = @{
    "Authorization" = "Api-Key 1xPQ0mcU.W6Sv0rzrDnN9dVvCQLbQ3FRgqjXe1pBM"
    "Content-Type" = "application/json"
}

Write-Host "Testing Forex Factory API with 3-year range..." -ForegroundColor Yellow
$url = "https://www.jblanked.com/news/api/forex-factory/calendar/range/?from=2024-01-01&to=2026-12-31"
Write-Host "URL: $url" -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri $url -Headers $headers -Method Get
    
    if ($response -is [System.Array]) {
        Write-Host "✅ Forex Factory returns ARRAY format" -ForegroundColor Green
        Write-Host "Total events: $($response.Length)" -ForegroundColor Cyan
        
        if ($response.Length -gt 0) {
            Write-Host "`nFirst event:" -ForegroundColor Cyan
            $response[0] | ConvertTo-Json
            
            Write-Host "`nSample of event names (first 10):" -ForegroundColor Cyan
            $response[0..9] | ForEach-Object { Write-Host "  - $($_.Name) ($($_.Currency)) - $($_.Date)" -ForegroundColor Gray }
        } else {
            Write-Host "⚠️ WARNING: 0 events returned!" -ForegroundColor Red
        }
    } else {
        Write-Host "Forex Factory returns OBJECT format" -ForegroundColor Green
        Write-Host "Object keys: $($response.PSObject.Properties.Name -join ', ')" -ForegroundColor Cyan
        if ($response.value) {
            Write-Host "Has 'value' property with $($response.value.Length) events" -ForegroundColor Cyan
        }
    }
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
}
