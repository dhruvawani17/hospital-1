import { NextResponse } from 'next/server';
import { performHealthCheck } from '@/lib/medical-reports-utils';
import { MEDICAL_REPORTS_CONFIG, API_CONFIG } from '@/lib/medical-reports-config';

export async function GET() {
  try {
    // Perform comprehensive health check
    const healthStatus = await performHealthCheck();
    
    const response = {
      ...healthStatus,
      version: '1.0.0',
      feature: 'Medical Reports AI Analysis',
      configuration: {
        maxFileSize: `${MEDICAL_REPORTS_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`,
        maxChunksPerDocument: MEDICAL_REPORTS_CONFIG.MAX_CHUNKS_PER_DOCUMENT,
        rateLimitPerMinute: MEDICAL_REPORTS_CONFIG.RATE_LIMIT_REQUESTS_PER_MINUTE,
        embeddingModel: MEDICAL_REPORTS_CONFIG.EMBEDDING_MODEL,
        chatModel: MEDICAL_REPORTS_CONFIG.CHAT_MODEL,
        vectorDimension: MEDICAL_REPORTS_CONFIG.VECTOR_DIMENSION,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        platform: process.platform,
        hasGoogleApiKey: !!API_CONFIG.GOOGLE_API_KEY,
        hasQdrantUrl: !!API_CONFIG.QDRANT_URL,
        hasQdrantApiKey: !!API_CONFIG.QDRANT_API_KEY,
      },
    };

    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    return NextResponse.json(response, { status: statusCode });
    
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
