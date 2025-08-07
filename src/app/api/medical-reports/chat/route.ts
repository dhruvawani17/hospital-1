import { NextRequest, NextResponse } from 'next/server';
import { QdrantVectorStore } from '@langchain/qdrant';
import { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { QdrantClient } from '@qdrant/js-client-rest';
import { RetrievalQAChain } from 'langchain/chains';
import { PromptTemplate } from '@langchain/core/prompts';
import { MEDICAL_REPORTS_CONFIG, API_CONFIG } from '@/lib/medical-reports-config';
import {
  checkRateLimit,
  getClientIP,
  createErrorResponse,
  createSuccessResponse,
  validateEnvironment,
  logActivity,
  sanitizeInput,
  generateSessionId
} from '@/lib/medical-reports-utils';

const QDRANT_URL = API_CONFIG.QDRANT_URL;
const QDRANT_API_KEY = API_CONFIG.QDRANT_API_KEY;

export async function POST(request: NextRequest) {
  const sessionId = generateSessionId();
  const clientIP = getClientIP(request);
  
  try {
    logActivity('chat_request_start', { sessionId, clientIP });
    
    // Rate limiting check
    if (!checkRateLimit(clientIP)) {
      logActivity('chat_rate_limit_exceeded', { sessionId, clientIP }, 'warn');
      return createErrorResponse(
        'Too many requests. Please wait before trying again.',
        429
      );
    }
    
    // Environment validation
    const envCheck = validateEnvironment();
    if (!envCheck.isValid) {
      logActivity('chat_environment_check_failed', { 
        sessionId, 
        missingVars: envCheck.missingVars 
      }, 'error');
      return createErrorResponse(
        'AI service is not configured. Please contact administrator.',
        500
      );
    }

    const { question } = await request.json();

    if (!question || typeof question !== 'string') {
      logActivity('invalid_question', { sessionId }, 'warn');
      return createErrorResponse('No valid question provided', 400);
    }

    // Sanitize and validate input
    const sanitizedQuestion = sanitizeInput(question);
    if (sanitizedQuestion.length === 0) {
      logActivity('empty_question_after_sanitization', { sessionId }, 'warn');
      return createErrorResponse('Question contains invalid characters', 400);
    }

    logActivity('processing_question', { 
      sessionId, 
      questionLength: sanitizedQuestion.length,
      originalLength: question.length
    });

    // Initialize Qdrant client with production configuration
    logActivity('initializing_qdrant_for_chat', { sessionId });
    const clientConfig: any = {
      url: QDRANT_URL,
    };
    
    if (QDRANT_API_KEY) {
      clientConfig.apiKey = QDRANT_API_KEY;
    }
    
    // For cloud instances, ensure proper HTTPS handling
    if (QDRANT_URL.includes('cloud.qdrant.io')) {
      clientConfig.https = true;
    }
    
    const client = new QdrantClient(clientConfig);

    // Check if collection exists
    logActivity('checking_collection_for_chat', { sessionId });
    try {
      await client.getCollection(MEDICAL_REPORTS_CONFIG.COLLECTION_NAME);
    } catch (error) {
      logActivity('collection_not_found', { sessionId }, 'warn');
      return createErrorResponse(
        'No medical documents have been uploaded yet. Please upload a PDF first.',
        404
      );
    }

    // Initialize embeddings
    logActivity('initializing_embeddings_for_chat', { sessionId });
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: API_CONFIG.GOOGLE_API_KEY,
      modelName: MEDICAL_REPORTS_CONFIG.EMBEDDING_MODEL,
    });

    // Initialize vector store
    logActivity('initializing_vector_store_for_chat', { sessionId });
    const vectorStore = new QdrantVectorStore(embeddings, {
      client,
      collectionName: MEDICAL_REPORTS_CONFIG.COLLECTION_NAME,
    });

    // Initialize Gemini chat model
    logActivity('initializing_chat_model', { sessionId });
    const model = new ChatGoogleGenerativeAI({
      apiKey: API_CONFIG.GOOGLE_API_KEY,
      model: MEDICAL_REPORTS_CONFIG.CHAT_MODEL,
      temperature: MEDICAL_REPORTS_CONFIG.TEMPERATURE,
    });

    // Create custom prompt with production-ready template
    const customPrompt = PromptTemplate.fromTemplate(MEDICAL_REPORTS_CONFIG.SYSTEM_PROMPT + `

Context from medical report:
{context}

Question: {question}

Answer:`);

    // Create retrieval QA chain
    logActivity('creating_qa_chain', { sessionId });
    const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever({
      k: 4, // Retrieve top 4 most relevant chunks
    }), {
      prompt: customPrompt,
      returnSourceDocuments: false, // Set to true if you want to return source documents
    });

    // Generate response
    logActivity('generating_response', { sessionId });
    const startTime = Date.now();
    const result = await chain.call({
      query: sanitizedQuestion,
    });
    const responseTime = Date.now() - startTime;

    // Validate and truncate response if necessary
    let response = result.text || 'I apologize, but I could not generate a response to your question.';
    if (response.length > MEDICAL_REPORTS_CONFIG.MAX_RESPONSE_LENGTH) {
      response = response.substring(0, MEDICAL_REPORTS_CONFIG.MAX_RESPONSE_LENGTH) + '...';
    }

    logActivity('response_generated', { 
      sessionId, 
      responseLength: response.length,
      responseTime: `${responseTime}ms`,
      questionLength: sanitizedQuestion.length
    });

    return createSuccessResponse({
      answer: response,
      sessionId,
      responseTime: `${responseTime}ms`,
    });

  } catch (error) {
    logActivity('chat_error', { 
      sessionId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 'error');
    
    return createErrorResponse(
      'An error occurred while processing your question. Please try again.',
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}
