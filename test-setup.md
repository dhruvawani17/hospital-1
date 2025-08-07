# Medical Reports Feature Test Script

## Quick Setup Test

1. **Check if Docker is running:**
   ```bash
   docker --version
   ```

2. **Start Qdrant database:**
   ```bash
   docker-compose -f docker-compose.qdrant.yml up -d
   ```

3. **Verify Qdrant is running:**
   ```bash
   curl http://localhost:6333/health
   ```
   Should return: `{"status":"ok"}`

4. **Check the health endpoint:**
   Navigate to: http://localhost:9002/api/medical-reports/health

5. **Test the feature:**
   - Go to http://localhost:9002/medical-reports
   - Upload a PDF file
   - Ask questions about the content

## Troubleshooting

### Common Issues:

**Docker not found:**
- Install Docker Desktop from https://www.docker.com/products/docker-desktop/

**Port 6333 already in use:**
```bash
# Stop existing Qdrant
docker stop qdrant
docker rm qdrant

# Or find what's using the port
netstat -ano | findstr :6333
```

**API Key issues:**
- Verify `.env.local` has correct OpenAI API key
- Test API key: https://platform.openai.com/playground

**PDF processing fails:**
- Ensure PDF contains text (not just images)
- Try with a smaller PDF file first
- Check browser console for detailed error messages

### Environment Variables Check:
```bash
# In PowerShell
Get-Content .env.local
```

Should contain:
```
OPENAI_API_KEY=sk-or-v1-...
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=eyJhbGciOiJ...
```

### Quick Test Commands:

```bash
# Test OpenAI API
curl -H "Authorization: Bearer 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" https://api.openai.com/v1/models

# Test Qdrant
curl http://localhost:6333/collections

# Test Next.js API
curl http://localhost:9002/api/medical-reports/health
```
