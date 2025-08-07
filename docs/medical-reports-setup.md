# Medical Report Analysis Setup Guide

## Prerequisites

1. **OpenAI API Key**: Get your API key from [OpenAI](https://platform.openai.com/api-keys)
2. **Qdrant Vector Database**: We'll use Docker to run Qdrant locally

## Quick Setup

### 1. Environment Variables
Create a `.env.local` file in the root directory:

```bash
# Required for Medical Report Analysis
OPENAI_API_KEY=your_openai_api_key_here
QDRANT_URL=http://localhost:6333

# Other existing environment variables...
```

### 2. Start Qdrant Database

**Option A: Using Docker Compose (Recommended)**
```bash
docker-compose -f docker-compose.qdrant.yml up -d
```

**Option B: Using Docker directly**
```bash
docker run -d --name qdrant -p 6333:6333 -p 6334:6334 \
  -v $(pwd)/qdrant_storage:/qdrant/storage \
  qdrant/qdrant:latest
```

### 3. Verify Qdrant is Running

Visit [http://localhost:6333/dashboard](http://localhost:6333/dashboard) to access the Qdrant web UI.

### 4. Start the Application

```bash
npm run dev
```

## How It Works

1. **PDF Upload**: Users upload medical reports in PDF format
2. **Text Extraction**: The system extracts text from the PDF using LangChain's PDF loader
3. **Text Chunking**: The document is split into manageable chunks for processing
4. **Vector Embedding**: Each chunk is converted to embeddings using OpenAI's embedding model
5. **Storage**: Embeddings are stored in Qdrant vector database
6. **Query Processing**: User questions are converted to embeddings and matched against stored content
7. **AI Response**: OpenAI GPT generates human-readable responses based on relevant document chunks

## Features

- ✅ PDF upload and processing
- ✅ Natural language questioning
- ✅ Medical term explanations
- ✅ Test result interpretation
- ✅ Secure document handling
- ✅ Real-time chat interface

## Security Notes

- Uploaded PDFs are temporarily stored and automatically deleted after processing
- Vector embeddings are stored locally in Qdrant
- No medical data is sent to external services except for AI processing
- Always consult healthcare professionals for medical advice

## Troubleshooting

**Qdrant Connection Issues:**
- Ensure Docker is running
- Check if port 6333 is available
- Verify the container is running: `docker ps`

**OpenAI API Issues:**
- Verify your API key is valid
- Check your OpenAI account has sufficient credits
- Ensure the API key has the correct permissions

**PDF Processing Issues:**
- Ensure the uploaded file is a valid PDF
- Check file size is reasonable (< 10MB recommended)
- Verify the PDF contains extractable text (not just images)
