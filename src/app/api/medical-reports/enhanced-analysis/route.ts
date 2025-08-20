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

interface EnhancedAnalysisResponse {
  sections: {
    title: string;
    content: string;
    type: 'summary' | 'findings' | 'recommendations' | 'terminology' | 'metrics';
    priority: 'high' | 'medium' | 'low';
    icon?: string;
  }[];
  rawResponse: string;
  confidence: number;
  processingTime: string;
}

function parseEnhancedResponse(rawResponse: string): EnhancedAnalysisResponse['sections'] {
  const sections: EnhancedAnalysisResponse['sections'] = [];
  const lines = rawResponse.split('\n');
  
  let currentSection: any = null;
  let currentContent: string[] = [];
  
  const sectionMappings = {
    'EXECUTIVE SUMMARY': { type: 'summary', priority: 'high', icon: '📋' },
    'KEY FINDINGS': { type: 'findings', priority: 'high', icon: '🔍' },
    'MEDICAL TERMINOLOGY EXPLAINED': { type: 'terminology', priority: 'medium', icon: '📚' },
    'TERMINOLOGY': { type: 'terminology', priority: 'medium', icon: '📚' },
    'RECOMMENDATIONS': { type: 'recommendations', priority: 'high', icon: '💡' },
    'IMPORTANT NOTES': { type: 'metrics', priority: 'medium', icon: '⚠️' },
    'CLINICAL NOTES': { type: 'findings', priority: 'medium', icon: '🏥' },
    'SUMMARY': { type: 'summary', priority: 'high', icon: '📋' },
    'ANALYSIS': { type: 'findings', priority: 'high', icon: '🔬' }
  };
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Check if line is a section header (## format or **bold** format)
    if (trimmedLine.startsWith('##') || (trimmedLine.startsWith('**') && trimmedLine.endsWith('**'))) {
      // Save previous section
      if (currentSection && currentContent.length > 0) {
        sections.push({
          ...currentSection,
          content: currentContent.join('\n').trim()
        });
      }
      
      // Start new section
      let sectionTitle = trimmedLine.replace(/^##\s*/, '').replace(/^\*\*/, '').replace(/\*\*$/, '').trim().toUpperCase();
      const mapping = sectionMappings[sectionTitle as keyof typeof sectionMappings];
      
      if (mapping) {
        currentSection = {
          title: sectionTitle.charAt(0) + sectionTitle.slice(1).toLowerCase().replace(/_/g, ' '),
          type: mapping.type,
          priority: mapping.priority,
          icon: mapping.icon
        };
        currentContent = [];
      } else {
        // Generic section
        currentSection = {
          title: sectionTitle.charAt(0) + sectionTitle.slice(1).toLowerCase().replace(/_/g, ' '),
          type: 'findings',
          priority: 'medium',
          icon: '📄'
        };
        currentContent = [];
      }
    } else if (currentSection && trimmedLine) {
      currentContent.push(trimmedLine);
    }
  }
  
  // Add final section
  if (currentSection && currentContent.length > 0) {
    sections.push({
      ...currentSection,
      content: currentContent.join('\n').trim()
    });
  }
  
  // If no structured sections found, try to create sections from content
  if (sections.length === 0) {
    const paragraphs = rawResponse.split('\n\n').filter(p => p.trim());
    
    if (paragraphs.length > 0) {
      // Create a summary section from first paragraph
      sections.push({
        title: 'Medical Analysis Summary',
        content: paragraphs[0].trim(),
        type: 'summary',
        priority: 'high',
        icon: '📋'
      });
      
      // If there are more paragraphs, add them as findings
      if (paragraphs.length > 1) {
        sections.push({
          title: 'Detailed Analysis',
          content: paragraphs.slice(1).join('\n\n').trim(),
          type: 'findings',
          priority: 'high',
          icon: '🔍'
        });
      }
    } else {
      // Fallback - single section with all content
      sections.push({
        title: 'Medical Analysis',
        content: rawResponse,
        type: 'findings',
        priority: 'high',
        icon: '🏥'
      });
    }
  }
  
  return sections;
}

export async function POST(request: NextRequest) {
  const sessionId = generateSessionId();
  const clientIP = getClientIP(request);
  
  try {
    logActivity('enhanced_analysis_request_start', { sessionId, clientIP });
    
    // Rate limiting check
    if (!checkRateLimit(clientIP)) {
      logActivity('enhanced_analysis_rate_limit_exceeded', { sessionId, clientIP }, 'warn');
      return createErrorResponse(
        'Too many requests. Please wait before trying again.',
        429
      );
    }
    
    // Environment validation
    const envCheck = validateEnvironment();
    if (!envCheck.isValid) {
      logActivity('enhanced_analysis_environment_check_failed', { 
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

    logActivity('processing_enhanced_analysis', { 
      sessionId, 
      questionLength: sanitizedQuestion.length
    });

    // Initialize Qdrant client for context retrieval
    const clientConfig: any = {
      url: QDRANT_URL,
    };
    
    if (QDRANT_API_KEY) {
      clientConfig.apiKey = QDRANT_API_KEY;
    }
    
    if (QDRANT_URL.includes('cloud.qdrant.io')) {
      clientConfig.https = true;
    }
    
    const client = new QdrantClient(clientConfig);

    // Check if collection exists
    try {
      await client.getCollection(MEDICAL_REPORTS_CONFIG.COLLECTION_NAME);
    } catch (error) {
      logActivity('collection_not_found', { sessionId }, 'warn');
      return createErrorResponse(
        'No medical documents have been uploaded yet. Please upload a PDF first.',
        404
      );
    }

    // Get relevant context from vector store
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: API_CONFIG.GOOGLE_API_KEY,
      modelName: MEDICAL_REPORTS_CONFIG.EMBEDDING_MODEL,
    });

    const vectorStore = new QdrantVectorStore(embeddings, {
      client,
      collectionName: MEDICAL_REPORTS_CONFIG.COLLECTION_NAME,
    });

    // Initialize enhanced Gemini model
    const model = new ChatGoogleGenerativeAI({
      apiKey: API_CONFIG.GOOGLE_API_KEY,
      model: MEDICAL_REPORTS_CONFIG.CHAT_MODEL,
      temperature: 0.2, // Lower temperature for more structured output
    });

    // Enhanced prompt template with better structure
    const enhancedPrompt = PromptTemplate.fromTemplate(`
You are a professional medical document analysis assistant with expertise in creating well-structured, comprehensive medical report analyses.

Your task is to analyze the provided medical report context and create a detailed, professionally formatted analysis.

Medical Report Context:
{context}

Question/Request: {question}

Please provide your analysis in the following EXACT structured format:

## EXECUTIVE SUMMARY
[Provide a clear, concise overview of the most important findings, no more than 3-4 sentences]

## KEY FINDINGS
[List the most significant medical findings with clear explanations:
- Use bullet points for each major finding
- Include normal ranges where applicable
- Explain clinical significance
- Highlight any abnormal values or concerning results]

## MEDICAL TERMINOLOGY EXPLAINED
[Define and explain any complex medical terms, abbreviations, or concepts mentioned:
- Provide clear, patient-friendly definitions
- Explain the purpose and significance of tests
- Include relevant background information]

## RECOMMENDATIONS
[Provide actionable recommendations based on the findings:
- Next steps for patient care
- Follow-up requirements
- Lifestyle modifications if applicable
- When to consult healthcare providers]

## IMPORTANT NOTES
[Include crucial disclaimers and important considerations:
- Emphasize the need for professional medical consultation
- Mention any limitations of the analysis
- Include relevant warnings or precautions]

FORMATTING GUIDELINES:
- Use clear headings with ## format
- Use bullet points (-) for lists
- Keep language professional but accessible
- Ensure each section is substantial and informative
- Maintain medical accuracy while being understandable

Analysis:`);

    // Create retrieval QA chain with enhanced configuration
    const startTime = Date.now();
    const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever({
      k: 6, // Retrieve more context for comprehensive analysis
    }), {
      prompt: enhancedPrompt,
      returnSourceDocuments: false,
    });

    const result = await chain.call({
      query: sanitizedQuestion,
    });
    
    const responseTime = Date.now() - startTime;
    let enhancedResponse = result.text || 'Could not generate enhanced analysis.';

    // Ensure response has proper structure if it doesn't
    if (!enhancedResponse.includes('## EXECUTIVE SUMMARY') && !enhancedResponse.includes('## KEY FINDINGS')) {
      enhancedResponse = `## EXECUTIVE SUMMARY
${enhancedResponse.substring(0, 200)}...

## KEY FINDINGS
${enhancedResponse}

## IMPORTANT NOTES
This analysis is generated by AI and should not replace professional medical consultation. Please discuss these findings with qualified healthcare providers.`;
    }

    // Parse the enhanced response into structured sections
    const sections = parseEnhancedResponse(enhancedResponse);

    const analysisResponse: EnhancedAnalysisResponse = {
      sections,
      rawResponse: enhancedResponse,
      confidence: 0.87, // Slightly higher confidence for structured output
      processingTime: `${responseTime}ms`
    };

    logActivity('enhanced_analysis_generated', { 
      sessionId, 
      sectionsCount: sections.length,
      responseTime: `${responseTime}ms`,
      confidence: analysisResponse.confidence
    });

    return createSuccessResponse(analysisResponse);

  } catch (error) {
    logActivity('enhanced_analysis_error', { 
      sessionId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 'error');
    
    return createErrorResponse(
      'An error occurred while processing your enhanced analysis. Please try again.',
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}
