// Medical Reports Feature Configuration
// Production-ready configuration for the AI-powered medical reports analysis

// HARDCODED API KEYS - FOR TESTING ONLY
const HARDCODED_GOOGLE_API_KEY = 'AIzaSyBCpZoV9403JiGqgWN9s5qKWXy5eB7DHW4';
const HARDCODED_QDRANT_URL = 'https://b898dbbc-9a7e-4aa3-adbd-a6d6434289cb.eu-central-1-0.aws.cloud.qdrant.io';
const HARDCODED_QDRANT_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.lOjORKpFdPM55ulkCPbboM3QJ6-PsTvrSYyzAewf-UU';

export const MEDICAL_REPORTS_CONFIG = {
  // File upload constraints
  MAX_FILE_SIZE: parseInt(process.env.MAX_PDF_SIZE || '10485760'), // 10MB default
  ALLOWED_FILE_TYPES: ['application/pdf'],
  MAX_CHUNKS_PER_DOCUMENT: parseInt(process.env.MAX_CHUNKS_PER_DOCUMENT || '500'),
  
  // Text processing configuration
  CHUNK_SIZE: 1000,
  CHUNK_OVERLAP: 200,
  
  // AI model configuration
  EMBEDDING_MODEL: 'embedding-001',
  CHAT_MODEL: 'gemini-1.5-flash',
  
  // Vector database configuration
  COLLECTION_NAME: 'medical_reports',
  VECTOR_DIMENSION: 768, // Gemini embedding dimension
  DISTANCE_METRIC: 'Cosine' as const,
  
  // Rate limiting
  RATE_LIMIT_REQUESTS_PER_MINUTE: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE || '10'),
  
  // Response configuration
  MAX_RESPONSE_LENGTH: 2000,
  TEMPERATURE: 0.3, // Lower temperature for more consistent medical responses
  
  // Error messages
  ERROR_MESSAGES: {
    NO_API_KEY: 'AI service is not configured. Please contact administrator.',
    FILE_TOO_LARGE: 'File size exceeds the maximum limit of 10MB.',
    INVALID_FILE_TYPE: 'Only PDF files are supported.',
    PROCESSING_FAILED: 'Failed to process the document. Please try again.',
    NO_CONTENT: 'No readable content found in the document.',
    RATE_LIMIT_EXCEEDED: 'Too many requests. Please wait before trying again.',
    NETWORK_ERROR: 'Network error occurred. Please check your connection.',
  },
  
  // Success messages
  SUCCESS_MESSAGES: {
    UPLOAD_SUCCESS: 'Document processed successfully and ready for analysis.',
    ANALYSIS_READY: 'AI analysis is ready. You can now ask questions about your document.',
  },
  
  // Medical AI prompt configuration
  SYSTEM_PROMPT: `You are a professional medical document analysis assistant. Your role is to:

1. Analyze medical reports, lab results, imaging reports, and clinical documents
2. Provide accurate, clear explanations of medical terminology and findings
3. Help users understand their medical information
4. Maintain professional medical language while being accessible

IMPORTANT GUIDELINES:
- Always clarify that you are an AI assistant, not a medical professional
- Encourage users to consult healthcare providers for medical advice
- Focus on explaining information present in the documents
- Do not provide medical diagnoses or treatment recommendations
- Maintain patient confidentiality and data security
- Be precise and factual in your responses

When analyzing documents, structure your responses with:
- Clear explanations of medical terms
- Summary of key findings
- Relevant context about procedures or tests
- Recommendations to discuss findings with healthcare providers`,

  // Validation patterns
  VALIDATION: {
    FILE_NAME_PATTERN: /^[a-zA-Z0-9._-]+\.pdf$/i,
    SAFE_TEXT_PATTERN: /^[\w\s.,;:!?()-]+$/,
  },
} as const;

// Type definitions for configuration
export type MedicalReportsConfig = typeof MEDICAL_REPORTS_CONFIG;
export type ErrorMessage = keyof typeof MEDICAL_REPORTS_CONFIG.ERROR_MESSAGES;
export type SuccessMessage = keyof typeof MEDICAL_REPORTS_CONFIG.SUCCESS_MESSAGES;

// Utility functions
export const validateFileSize = (size: number): boolean => {
  return size <= MEDICAL_REPORTS_CONFIG.MAX_FILE_SIZE;
};

export const validateFileType = (type: string): boolean => {
  return MEDICAL_REPORTS_CONFIG.ALLOWED_FILE_TYPES.includes(type as any);
};

export const sanitizeFileName = (fileName: string): string => {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
};

export const getErrorMessage = (key: ErrorMessage): string => {
  return MEDICAL_REPORTS_CONFIG.ERROR_MESSAGES[key];
};

export const getSuccessMessage = (key: SuccessMessage): string => {
  return MEDICAL_REPORTS_CONFIG.SUCCESS_MESSAGES[key];
};

// Hardcoded API configuration
export const API_CONFIG = {
  GOOGLE_API_KEY: HARDCODED_GOOGLE_API_KEY,
  QDRANT_URL: HARDCODED_QDRANT_URL,
  QDRANT_API_KEY: HARDCODED_QDRANT_API_KEY,
};
