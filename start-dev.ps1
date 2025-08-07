Write-Host "Starting HealthFirst Connect Development Server..." -ForegroundColor Green
Write-Host ""

# Load environment variables
if (Test-Path ".env.local") {
    Write-Host "Loading environment variables..." -ForegroundColor Yellow
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match "^([^#][^=]*)=(.*)$") {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
    Write-Host "✅ Environment variables loaded" -ForegroundColor Green
} else {
    Write-Host "❌ .env.local file not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "Configuration:" -ForegroundColor Cyan
Write-Host "- OpenAI API Key: $($env:OPENAI_API_KEY.Substring(0, 20))..." -ForegroundColor White
Write-Host "- Qdrant URL: $env:QDRANT_URL" -ForegroundColor White
Write-Host ""

Write-Host "Starting Next.js development server..." -ForegroundColor Yellow
npm run dev
