// Medical Reports Production Utilities
// Utility functions for production-ready medical reports feature

import { NextResponse } from 'next/server';
import { MEDICAL_REPORTS_CONFIG, getErrorMessage } from './medical-reports-config';

// Rate limiting map to track requests per IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiting middleware for medical reports API
 */
export function checkRateLimit(clientIP: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = MEDICAL_REPORTS_CONFIG.RATE_LIMIT_REQUESTS_PER_MINUTE;

  const clientData = rateLimitMap.get(clientIP);
  
  if (!clientData || now > clientData.resetTime) {
    // Reset or initialize rate limit for this IP
    rateLimitMap.set(clientIP, {
      count: 1,
      resetTime: now + windowMs
    });
    return true;
  }

  if (clientData.count >= maxRequests) {
    return false; // Rate limit exceeded
  }

  // Increment request count
  clientData.count++;
  return true;
}

/**
 * Get client IP address from request headers
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const clientIP = request.headers.get('x-client-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  return realIP || clientIP || '127.0.0.1';
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  message: string,
  status: number = 500,
  details?: string
): NextResponse {
  const response = {
    success: false,
    error: message,
    ...(details && { details }),
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(response, { status });
}

/**
 * Create standardized success response
 */
export function createSuccessResponse(
  data: any,
  message?: string
): NextResponse {
  const response = {
    success: true,
    ...(message && { message }),
    ...data,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(response);
}

/**
 * Validate environment variables
 */
export function validateEnvironment(): { isValid: boolean; missingVars: string[] } {
  const requiredVars = ['GOOGLE_API_KEY', 'QDRANT_URL'];
  const missingVars: string[] = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  return {
    isValid: missingVars.length === 0,
    missingVars,
  };
}

/**
 * Log medical reports activity (production-safe logging)
 */
export function logActivity(
  action: string,
  details: Record<string, any>,
  level: 'info' | 'warn' | 'error' = 'info'
) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    service: 'medical-reports',
    action,
    level,
    ...details,
  };

  // In production, you might want to send this to a logging service
  if (level === 'error') {
    console.error('MEDICAL_REPORTS_ERROR:', JSON.stringify(logEntry, null, 2));
  } else if (level === 'warn') {
    console.warn('MEDICAL_REPORTS_WARNING:', JSON.stringify(logEntry, null, 2));
  } else {
    console.info('MEDICAL_REPORTS_INFO:', JSON.stringify(logEntry, null, 2));
  }
}

/**
 * Clean up temporary files safely
 */
export async function cleanupTempFile(filePath: string): Promise<void> {
  try {
    const fs = await import('fs');
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logActivity('temp_file_cleanup', { filePath, status: 'success' });
    }
  } catch (error) {
    logActivity('temp_file_cleanup', { 
      filePath, 
      status: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 'error');
  }
}

/**
 * Sanitize user input for security
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>\"']/g, '') // Remove potential XSS characters
    .substring(0, 1000); // Limit length
}

/**
 * Generate unique session ID for tracking
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Health check for all services
 */
export async function performHealthCheck(): Promise<{
  status: 'healthy' | 'unhealthy';
  services: Record<string, boolean>;
  timestamp: string;
}> {
  const services: Record<string, boolean> = {};
  
  // Check environment variables
  const envCheck = validateEnvironment();
  services.environment = envCheck.isValid;
  
  // Check Gemini AI connection
  try {
    const { ChatGoogleGenerativeAI } = await import('@langchain/google-genai');
    const model = new ChatGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
      model: MEDICAL_REPORTS_CONFIG.CHAT_MODEL,
    });
    await model.invoke('Health check');
    services.gemini = true;
  } catch {
    services.gemini = false;
  }
  
  // Check Qdrant connection
  try {
    const { QdrantClient } = await import('@qdrant/js-client-rest');
    const client = new QdrantClient({
      url: process.env.QDRANT_URL!,
      apiKey: process.env.QDRANT_API_KEY,
    });
    await client.getCollections();
    services.qdrant = true;
  } catch {
    services.qdrant = false;
  }
  
  const allHealthy = Object.values(services).every(status => status);
  
  return {
    status: allHealthy ? 'healthy' : 'unhealthy',
    services,
    timestamp: new Date().toISOString(),
  };
}
