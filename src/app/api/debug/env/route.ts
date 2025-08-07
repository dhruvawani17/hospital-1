import { NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/medical-reports-config';

export async function GET() {
  return NextResponse.json({
    hasGoogleApiKey: !!API_CONFIG.GOOGLE_API_KEY,
    hasQdrantUrl: !!API_CONFIG.QDRANT_URL,
    hasQdrantApiKey: !!API_CONFIG.QDRANT_API_KEY,
    googleApiKeyLength: API_CONFIG.GOOGLE_API_KEY?.length || 0,
    qdrantUrl: API_CONFIG.QDRANT_URL ? 'Set' : 'Not Set',
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    source: 'hardcoded_in_code',
  });
}
