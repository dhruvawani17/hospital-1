@echo off
echo 🏥 Medical Reports Feature - Production Deployment
echo ==================================================

REM Check Node.js version
echo ✅ Checking Node.js version...
node --version

REM Check if required dependencies are installed
echo ✅ Checking dependencies...
npm list @langchain/google-genai @langchain/qdrant @qdrant/js-client-rest >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Some dependencies may be missing. Run: npm install
)

REM Validate environment variables
echo ✅ Validating environment variables...
if not defined GOOGLE_API_KEY (
    echo ❌ GOOGLE_API_KEY is not set
    exit /b 1
)

if not defined QDRANT_URL (
    echo ❌ QDRANT_URL is not set
    exit /b 1
)

if not defined QDRANT_API_KEY (
    echo ❌ QDRANT_API_KEY is not set
    exit /b 1
)

echo ✅ Environment variables validated

REM Build the application
echo ✅ Building application...
npm run build

if errorlevel 1 (
    echo ❌ Build failed
    exit /b 1
)

echo ✅ Build successful
echo.
echo 🎉 Medical Reports Feature is ready for production!
echo.
echo 📋 Next steps:
echo 1. Deploy to your hosting platform
echo 2. Set up monitoring for /api/medical-reports/health
echo 3. Configure any additional security measures
echo 4. Test the feature end-to-end in production
echo.
echo 📚 Documentation: See MEDICAL_REPORTS_README.md
echo 🔍 Health Check: https://yourdomain.com/api/medical-reports/health
echo 🏥 Feature URL: https://yourdomain.com/medical-reports

pause
