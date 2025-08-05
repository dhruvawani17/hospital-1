'use server';
/**
 * @fileOverview RAG-based Medical Report Analysis using LangChain and OpenAI
 * 
 * This replaces the current medical report analysis with a RAG (Retrieval Augmented Generation) approach
 * based on the pdf-rag-code repository implementation.
 */

import { Document } from '@langchain/core/documents';
import { OpenAIEmbeddings } from '@langchain/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import OpenAI from 'openai';

// In-memory storage for vector stores (per session)
const documentStores = new Map<string, MemoryVectorStore>();

interface RagAnalysisResult {
  summary: string;
  keyFindings: string[];
  reportText: string;
  documentId: string; // Used to store/retrieve the vector store for Q&A
}

interface RagQuestionInput {
  question: string;
  documentId: string;
}

interface RagQuestionResult {
  answer: string;
  sources?: Document[];
}

// Initialize OpenAI client
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not found');
  }
  return new OpenAI({ apiKey });
}

// Initialize OpenAI embeddings
function getEmbeddings() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not found');
  }
  return new OpenAIEmbeddings({
    model: 'text-embedding-3-small',
    apiKey: apiKey,
  });
}

// Process document text into chunks and create vector store
async function processDocument(reportText: string): Promise<{ vectorStore: MemoryVectorStore; documentId: string }> {
  // Create document chunks
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const docs = await textSplitter.createDocuments([reportText]);
  
  // Create embeddings and vector store
  const embeddings = getEmbeddings();
  const vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);
  
  // Generate a unique document ID
  const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Store the vector store for later Q&A
  documentStores.set(documentId, vectorStore);
  
  // Clean up old stores (keep only last 10)
  if (documentStores.size > 10) {
    const keys = Array.from(documentStores.keys());
    const oldestKey = keys[0];
    documentStores.delete(oldestKey);
  }
  
  return { vectorStore, documentId };
}

// Generate summary and key findings using RAG
async function generateAnalysis(vectorStore: MemoryVectorStore, reportText: string): Promise<{ summary: string; keyFindings: string[] }> {
  const client = getOpenAIClient();
  
  // Use retrieval to get relevant chunks for analysis
  const retriever = vectorStore.asRetriever({ k: 5 });
  const relevantDocs = await retriever.invoke('medical report analysis summary key findings test results');
  
  const context = relevantDocs.map(doc => doc.pageContent).join('\n\n');
  
  const ANALYSIS_PROMPT = `
You are a medical AI assistant analyzing a medical report. Based on the provided context, generate:
1. A comprehensive summary of the medical report in plain language
2. Key findings as a list of important observations, test results, and recommendations

Context from medical report:
${context}

Full report text:
${reportText.substring(0, 2000)}...

Instructions:
- Provide a clear, comprehensive summary in plain language
- Extract 3-7 key findings as separate points
- Focus on factual information from the report
- Do NOT provide medical advice beyond what's stated
- Include disclaimers about consulting healthcare providers
- Be empathetic and supportive in tone

Please provide your response in the following JSON format:
{
  "summary": "Clear summary of the medical report...",
  "keyFindings": ["Finding 1", "Finding 2", "Finding 3", ...]
}
`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful medical AI assistant that analyzes medical reports and provides summaries in JSON format.' },
        { role: 'user', content: ANALYSIS_PROMPT }
      ],
      temperature: 0.3,
    });

    const result = response.choices[0]?.message?.content;
    if (!result) {
      throw new Error('No response from OpenAI');
    }

    // Try to parse JSON response
    try {
      const parsed = JSON.parse(result);
      return {
        summary: parsed.summary || 'Medical report analysis completed.',
        keyFindings: Array.isArray(parsed.keyFindings) ? parsed.keyFindings : ['Analysis completed - please consult healthcare provider for interpretation']
      };
    } catch (parseError) {
      // Fallback if JSON parsing fails
      return {
        summary: result.substring(0, 1000),
        keyFindings: ['Analysis completed - please consult healthcare provider for detailed interpretation']
      };
    }

  } catch (error) {
    console.error('OpenAI analysis failed:', error);
    throw new Error('Failed to generate analysis with OpenAI');
  }
}

// RAG-based medical report analysis
export async function analyzeRagMedicalReport(reportText: string): Promise<RagAnalysisResult> {
  try {
    if (!reportText || !reportText.trim()) {
      throw new Error('Report text is required');
    }

    // Process document and create vector store
    const { vectorStore, documentId } = await processDocument(reportText);
    
    // Generate analysis using RAG
    const { summary, keyFindings } = await generateAnalysis(vectorStore, reportText);

    return {
      summary,
      keyFindings,
      reportText,
      documentId
    };

  } catch (error) {
    console.error('RAG medical report analysis failed:', error);
    
    // Provide fallback analysis similar to original system
    const mockFindings: string[] = [];
    const reportLower = reportText.toLowerCase();
    
    if (reportLower.includes('cholesterol')) {
      mockFindings.push('Cholesterol levels noted in the report');
    }
    if (reportLower.includes('blood pressure')) {
      mockFindings.push('Blood pressure measurements documented');
    }
    if (reportLower.includes('glucose')) {
      mockFindings.push('Blood glucose levels recorded');
    }
    if (reportLower.includes('normal')) {
      mockFindings.push('Some values appear to be in normal ranges');
    }
    
    mockFindings.push('RAG analysis unavailable - please consult healthcare provider for interpretation');

    // Generate a fallback document ID for demo purposes
    const fallbackDocId = `fallback_${Date.now()}`;
    
    return {
      summary: error instanceof Error && error.message.includes('API key') 
        ? 'OpenAI API key not configured. This is a demo analysis - please consult your healthcare provider for accurate medical interpretation.'
        : 'Medical report processed. For accurate analysis, please ensure proper configuration and consult your healthcare provider.',
      keyFindings: mockFindings.length > 0 ? mockFindings : [
        'Medical report contains clinical information',
        'Healthcare provider consultation recommended for proper interpretation',
        'This is a demonstration of the RAG medical report analysis feature'
      ],
      reportText,
      documentId: fallbackDocId
    };
  }
}

// RAG-based question answering
export async function answerRagMedicalQuestion(input: RagQuestionInput): Promise<RagQuestionResult> {
  try {
    const { question, documentId } = input;
    
    if (!question || !documentId) {
      throw new Error('Question and document ID are required');
    }

    // Retrieve the vector store for this document
    const vectorStore = documentStores.get(documentId);
    if (!vectorStore) {
      throw new Error('Document not found - please analyze the report first');
    }

    // Use retrieval to get relevant chunks
    const retriever = vectorStore.asRetriever({ k: 3 });
    const relevantDocs = await retriever.invoke(question);
    
    const context = relevantDocs.map(doc => doc.pageContent).join('\n\n');
    
    const client = getOpenAIClient();
    
    const QA_PROMPT = `
You are a medical AI assistant helping patients understand their medical reports. Answer the user's question based ONLY on the information provided in the context from their medical report.

Context from medical report:
${context}

Patient's Question: ${question}

Instructions:
- Answer based ONLY on information available in the provided context
- Use clear, simple language that patients can understand
- If the context doesn't contain information to answer the question, clearly state this
- Do NOT provide medical advice beyond what's in the report
- Encourage consultation with healthcare providers for medical decisions
- Be supportive and empathetic

Please provide a helpful answer based on the medical report context.
`;

    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful medical AI assistant that answers questions about medical reports based on provided context.' },
        { role: 'user', content: QA_PROMPT }
      ],
      temperature: 0.3,
    });

    const answer = response.choices[0]?.message?.content;
    if (!answer) {
      throw new Error('No response from OpenAI');
    }

    return {
      answer,
      sources: relevantDocs
    };

  } catch (error) {
    console.error('RAG question answering failed:', error);
    
    // Provide fallback response
    const question = input.question?.toLowerCase() || '';
    let fallbackAnswer = '';
    
    if (question.includes('concerning') || question.includes('worried')) {
      fallbackAnswer = 'I understand your concerns about your medical report. The best approach is to discuss these results with your healthcare provider who can provide personalized interpretation based on your complete medical history.';
    } else if (question.includes('normal') || question.includes('results')) {
      fallbackAnswer = 'Your report contains various test results. Please consult with your healthcare provider for a complete interpretation of all results in the context of your health.';
    } else {
      fallbackAnswer = 'I understand you have questions about your medical report. For the most accurate medical interpretation, please discuss your specific questions with your healthcare provider.';
    }
    
    if (error instanceof Error && error.message.includes('API key')) {
      fallbackAnswer += '\n\nNote: OpenAI API key not configured. This is a demonstration mode.';
    } else if (error instanceof Error && error.message.includes('Document not found')) {
      fallbackAnswer = 'The document analysis session has expired. Please re-analyze your medical report first, then ask your question.';
    } else {
      fallbackAnswer += '\n\nNote: RAG analysis unavailable. For actual medical consultations, please speak with qualified healthcare professionals.';
    }

    return {
      answer: fallbackAnswer
    };
  }
}