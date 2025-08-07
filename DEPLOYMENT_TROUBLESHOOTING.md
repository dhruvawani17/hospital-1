# Medical Reports Feature - Deployment Troubleshooting Guide

## 🚨 Common Deployment Issues & Solutions

### Issue: "System Setup Required" with all services showing ❌

This typically indicates environment variable or network configuration issues in production.

## 📋 Step-by-Step Troubleshooting

### 1. Environment Variables Check

**For Vercel Deployment:**
```bash
# Go to Vercel Dashboard > Project > Settings > Environment Variables
# Add these variables:

GOOGLE_API_KEY=AIzaSyBBS18I7nOqVBvrmalSZzl0oo0YGxqGLlQ
QDRANT_URL=https://b898dbbc-9a7e-4aa3-adbd-a6d6434289cb.eu-central-1-0.aws.cloud.qdrant.io
QDRANT_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.lOjORKpFdPM55ulkCPbboM3QJ6-PsTvrSYyzAewf-UU
```

**For Netlify Deployment:**
```bash
# Go to Netlify Dashboard > Site > Environment Variables
# Add the same variables as above
```

**For Other Platforms:**
- Ensure environment variables are set in your deployment platform
- Variables must be available to the Node.js runtime

### 2. Test Environment Variables in Production

Add this temporary API endpoint to test if env vars are available:

**Create:** `src/app/api/debug/env/route.ts`
```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasGoogleApiKey: !!process.env.GOOGLE_API_KEY,
    hasQdrantUrl: !!process.env.QDRANT_URL,
    hasQdrantApiKey: !!process.env.QDRANT_API_KEY,
    googleApiKeyLength: process.env.GOOGLE_API_KEY?.length || 0,
    qdrantUrl: process.env.QDRANT_URL ? 'Set' : 'Not Set',
  });
}
```

**Test:** `https://your-domain.com/api/debug/env`

### 3. Network Connectivity Issues

**Test Qdrant Connectivity:**
```bash
# Test from your deployment platform's console if available
curl -H "api-key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.lOjORKpFdPM55ulkCPbboM3QJ6-PsTvrSYyzAewf-UU" \
     https://b898dbbc-9a7e-4aa3-adbd-a6d6434289cb.eu-central-1-0.aws.cloud.qdrant.io/collections
```

**Test Gemini AI Connectivity:**
```bash
# Test API key from deployment environment
curl -H "Content-Type: application/json" \
     -d '{"contents":[{"parts":[{"text":"test"}]}]}' \
     "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=AIzaSyBBS18I7nOqVBvrmalSZzl0oo0YGxqGLlQ"
```

### 4. Platform-Specific Issues

**Vercel:**
- Function timeout: Increase in `vercel.json`
- Cold starts: May cause initial health check failures
- Edge runtime: Ensure using Node.js runtime

**Netlify:**
- Function timeout: Check netlify.toml configuration
- Build errors: Check build logs for missing dependencies

**Other Platforms:**
- Docker: Ensure environment variables are passed to container
- Server deployment: Check firewall and network access

### 5. Quick Fixes

**Option 1: Increase Health Check Timeout**
Add to your health check:
```typescript
// Add timeout handling
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
```

**Option 2: Graceful Degradation**
Update health check to be less strict:
```typescript
// Allow partial health status
const isPartiallyHealthy = healthStatus.services.environment && 
  (healthStatus.services.gemini || healthStatus.services.qdrant);
```

**Option 3: Environment-Specific Configuration**
```typescript
// Add NODE_ENV check
const isProduction = process.env.NODE_ENV === 'production';
const skipHealthChecks = process.env.SKIP_HEALTH_CHECKS === 'true';
```

### 6. Debug Health Check Response

Add this temporary endpoint to see detailed health check info:

**Create:** `src/app/api/debug/health-detailed/route.ts`
```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test each service individually
    const envCheck = {
      googleApiKey: !!process.env.GOOGLE_API_KEY,
      qdrantUrl: !!process.env.QDRANT_URL,
      qdrantApiKey: !!process.env.QDRANT_API_KEY,
    };

    let geminiCheck = { status: false, error: null };
    try {
      const { ChatGoogleGenerativeAI } = await import('@langchain/google-genai');
      const model = new ChatGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_API_KEY,
        model: 'gemini-1.5-flash',
      });
      await model.invoke('test');
      geminiCheck.status = true;
    } catch (error) {
      geminiCheck.error = error.message;
    }

    let qdrantCheck = { status: false, error: null };
    try {
      const { QdrantClient } = await import('@qdrant/js-client-rest');
      const client = new QdrantClient({
        url: process.env.QDRANT_URL,
        apiKey: process.env.QDRANT_API_KEY,
      });
      await client.getCollections();
      qdrantCheck.status = true;
    } catch (error) {
      qdrantCheck.error = error.message;
    }

    return NextResponse.json({
      environment: envCheck,
      gemini: geminiCheck,
      qdrant: qdrantCheck,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
```

### 7. Common Error Messages & Solutions

**"Cannot read properties of undefined"**
- Environment variables not set
- Wrong variable names

**"Network request failed"**
- Firewall blocking outbound requests
- API endpoints unreachable from deployment platform

**"Invalid API key"**
- API key incorrect or expired
- API key not properly set in environment

**"Timeout"**
- Network latency too high
- Service temporarily unavailable

### 8. Deployment Platform Commands

**Vercel:**
```bash
# Check environment variables
vercel env ls

# Add environment variables
vercel env add GOOGLE_API_KEY
vercel env add QDRANT_URL
vercel env add QDRANT_API_KEY

# Redeploy
vercel --prod
```

**Netlify:**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Check environment variables
netlify env:list

# Add environment variables
netlify env:set GOOGLE_API_KEY "your-key-here"
netlify env:set QDRANT_URL "your-url-here"
netlify env:set QDRANT_API_KEY "your-key-here"
```

### 9. Emergency Bypass

If all else fails, temporarily disable health checks:

**Add to environment variables:**
```bash
DISABLE_HEALTH_CHECKS=true
```

**Update client component:**
```typescript
// In MedicalReportsClient.tsx
const healthCheck = process.env.DISABLE_HEALTH_CHECKS === 'true' 
  ? { status: 'healthy', services: { environment: true, gemini: true, qdrant: true } }
  : actualHealthCheck;
```

## 🔄 Recommended Deployment Flow

1. **Local Test**: Ensure everything works locally first
2. **Environment Setup**: Set all environment variables in deployment platform
3. **Deploy**: Deploy to staging/preview first
4. **Health Check**: Test `/api/medical-reports/health` endpoint
5. **Debug**: Use debug endpoints if issues arise
6. **Production**: Deploy to production once health checks pass

## 📞 Getting Help

If issues persist:
1. Check deployment platform logs
2. Test individual API endpoints
3. Verify network connectivity from deployment platform
4. Contact deployment platform support if needed

Remember to remove debug endpoints before final production deployment!
