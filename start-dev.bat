@echo off
echo Starting HealthFirst Connect Development Server...
echo.
echo Environment:
echo - OpenAI API Key: %OPENAI_API_KEY:~0,20%...
echo - Qdrant URL: %QDRANT_URL%
echo.
npm run dev
