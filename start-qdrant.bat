@echo off
echo Starting Qdrant Vector Database...
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

echo Checking if Qdrant is already running...
docker ps | findstr qdrant >nul 2>&1
if %errorlevel% equ 0 (
    echo Qdrant is already running!
    echo.
    echo You can access the Qdrant dashboard at: http://localhost:6333/dashboard
    pause
    exit /b 0
)

echo Starting Qdrant container...
docker run -d --name qdrant -p 6333:6333 -p 6334:6334 -v qdrant_storage:/qdrant/storage qdrant/qdrant:latest

if %errorlevel% equ 0 (
    echo.
    echo ✅ Qdrant started successfully!
    echo.
    echo Dashboard: http://localhost:6333/dashboard
    echo API Endpoint: http://localhost:6333
    echo.
    echo To stop Qdrant, run: docker stop qdrant
    echo To remove Qdrant, run: docker rm qdrant
) else (
    echo.
    echo ❌ Failed to start Qdrant. Please check Docker logs.
)

pause
