# Medical Reports Feature - Production Deployment Script

# This script helps deploy the medical reports feature to production
# Run this after setting up your environment variables

echo "🏥 Medical Reports Feature - Production Deployment"
echo "=================================================="

# Check Node.js version
echo "✅ Checking Node.js version..."
node --version

# Check if required dependencies are installed
echo "✅ Checking dependencies..."
npm list @langchain/google-genai @langchain/qdrant @qdrant/js-client-rest 2>/dev/null || echo "⚠️  Some dependencies may be missing. Run: npm install"

# Validate environment variables
echo "✅ Validating environment variables..."
if [ -z "$GOOGLE_API_KEY" ]; then
    echo "❌ GOOGLE_API_KEY is not set"
    exit 1
fi

if [ -z "$QDRANT_URL" ]; then
    echo "❌ QDRANT_URL is not set"
    exit 1
fi

if [ -z "$QDRANT_API_KEY" ]; then
    echo "❌ QDRANT_API_KEY is not set"
    exit 1
fi

echo "✅ Environment variables validated"

# Test health endpoint
echo "✅ Testing system health..."
if command -v curl &> /dev/null; then
    curl -f http://localhost:3000/api/medical-reports/health > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Health check passed"
    else
        echo "⚠️  Health check failed - make sure the server is running"
    fi
else
    echo "⚠️  curl not found - skipping health check"
fi

# Build the application
echo "✅ Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

echo ""
echo "🎉 Medical Reports Feature is ready for production!"
echo ""
echo "📋 Next steps:"
echo "1. Deploy to your hosting platform"
echo "2. Set up monitoring for /api/medical-reports/health"
echo "3. Configure any additional security measures"
echo "4. Test the feature end-to-end in production"
echo ""
echo "📚 Documentation: See MEDICAL_REPORTS_README.md"
echo "🔍 Health Check: https://yourdomain.com/api/medical-reports/health"
echo "🏥 Feature URL: https://yourdomain.com/medical-reports"
