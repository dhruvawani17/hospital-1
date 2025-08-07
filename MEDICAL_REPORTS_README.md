# Medical Reports AI Analysis Feature

## 🏥 Overview

This feature adds AI-powered medical report analysis to the hospital website, allowing patients and healthcare professionals to upload PDF medical reports and get intelligent analysis through a chat interface.

## ✨ Features

- **PDF Upload & Processing**: Upload medical reports in PDF format (up to 10MB)
- **AI-Powered Analysis**: Uses Google Gemini AI for intelligent document analysis
- **Vector Search**: Qdrant cloud database for semantic document search
- **Natural Language Chat**: Ask questions about uploaded medical reports
- **Rate Limiting**: Production-ready rate limiting to prevent abuse
- **Health Monitoring**: Real-time system health checks
- **Security**: Input sanitization and validation
- **Error Handling**: Comprehensive error handling and logging

## 🚀 Technology Stack

- **AI Model**: Google Gemini (gemini-1.5-flash) for chat, embedding-001 for embeddings
- **Vector Database**: Qdrant Cloud for document storage and retrieval
- **Framework**: Next.js 15 with TypeScript
- **Document Processing**: LangChain with PDF processing capabilities
- **UI Components**: shadcn/ui components with Tailwind CSS

## 📁 File Structure

```
src/
├── app/
│   ├── medical-reports/
│   │   └── page.tsx                    # Main medical reports page
│   └── api/medical-reports/
│       ├── upload/route.ts             # PDF upload and processing API
│       ├── chat/route.ts               # AI chat API
│       └── health/route.ts             # System health check API
├── components/medical-reports/
│   └── MedicalReportsClient.tsx        # Main client component
└── lib/
    ├── medical-reports-config.ts       # Production configuration
    └── medical-reports-utils.ts        # Utility functions
```

## ⚙️ Configuration

### Environment Variables

```bash
# Required - Google Gemini AI API Key
GOOGLE_API_KEY=your_gemini_api_key_here

# Required - Qdrant Vector Database
QDRANT_URL=https://your-qdrant-instance.cloud.qdrant.io
QDRANT_API_KEY=your_qdrant_api_key_here

# Optional - Production Configuration
MAX_PDF_SIZE=10485760                   # 10MB default
MAX_CHUNKS_PER_DOCUMENT=500             # Chunk limit per document
RATE_LIMIT_REQUESTS_PER_MINUTE=10       # Rate limiting
```

### System Requirements

- **File Size Limit**: 10MB per PDF
- **File Type**: PDF only
- **Rate Limiting**: 10 requests per minute per IP
- **Vector Dimensions**: 768 (Gemini embeddings)
- **Chunk Size**: 1000 characters with 200 overlap

## 🔧 API Endpoints

### Upload PDF
```
POST /api/medical-reports/upload
Content-Type: multipart/form-data

Body: FormData with 'pdf' file field
```

### Chat with Document
```
POST /api/medical-reports/chat
Content-Type: application/json

Body: { "question": "Your question about the medical report" }
```

### Health Check
```
GET /api/medical-reports/health

Response: System health status and configuration
```

## 🛡️ Security Features

- **Input Sanitization**: All user inputs are sanitized
- **File Validation**: Strict PDF file type and size validation
- **Rate Limiting**: IP-based rate limiting to prevent abuse
- **Error Handling**: Secure error messages without exposing system details
- **Session Tracking**: Unique session IDs for request tracking

## 📊 Monitoring & Logging

All activities are logged with structured logging including:
- Upload attempts and results
- Chat interactions and response times
- Rate limit violations
- System errors and health status
- Performance metrics

## 🔍 Health Monitoring

The system includes comprehensive health checks for:
- ✅ Environment variables validation
- ✅ Google Gemini AI connectivity
- ✅ Qdrant database connectivity
- ✅ System configuration validation

Access health status: `http://localhost:3000/api/medical-reports/health`

## 🚀 Usage

### For Users

1. **Navigate** to `/medical-reports` on the website
2. **Upload** a PDF medical report (up to 10MB)
3. **Wait** for processing (usually 10-30 seconds)
4. **Ask questions** about your medical report in natural language
5. **Get AI-powered** explanations and analysis

### For Developers

1. **Configure** environment variables in `.env.local`
2. **Start** the development server: `npm run dev`
3. **Test** the health endpoint: `GET /api/medical-reports/health`
4. **Monitor** logs for system activity and errors

## 🎯 Production Considerations

### Performance
- Chunked document processing for large files
- Rate limiting to prevent system overload
- Efficient vector storage and retrieval
- Response caching where appropriate

### Scalability
- Horizontal scaling ready
- Stateless API design
- Cloud-based vector database
- Session-based tracking

### Reliability
- Comprehensive error handling
- Automatic retry mechanisms
- Health monitoring and alerting
- Graceful degradation

## 🔄 Integration

The medical reports feature is fully integrated with:
- **Navigation**: Accessible from main navigation menu
- **Homepage**: Featured on the homepage with description
- **Translations**: Multi-language support ready
- **UI Theme**: Consistent with hospital website design

## 📝 Error Handling

The system handles various error scenarios:
- Invalid file types or sizes
- Network connectivity issues
- AI service unavailability
- Rate limit violations
- Processing failures

All errors are logged and user-friendly messages are displayed.

## 🚀 Deployment Checklist

- [ ] Environment variables configured
- [ ] Qdrant collection created with correct dimensions (768)
- [ ] Google Gemini API key validated
- [ ] Health check endpoint returning healthy status
- [ ] Rate limiting tested
- [ ] File upload validation tested
- [ ] AI responses validated for medical context

## 📚 Additional Resources

- [Google Gemini AI Documentation](https://ai.google.dev/)
- [Qdrant Vector Database Docs](https://qdrant.tech/documentation/)
- [LangChain Documentation](https://js.langchain.com/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

## 🆘 Support

For technical issues:
1. Check system health at `/api/medical-reports/health`
2. Review application logs for errors
3. Verify environment variable configuration
4. Test individual API endpoints

For medical content concerns:
- This system provides information analysis only
- Always recommend consulting healthcare professionals
- Do not provide medical diagnoses or treatment advice
