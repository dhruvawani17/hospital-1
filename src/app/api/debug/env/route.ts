import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasGoogleApiKey: !!process.env.GOOGLE_API_KEY,
    hasQdrantUrl: !!process.env.QDRANT_URL,
    hasQdrantApiKey: !!process.env.QDRANT_API_KEY,
    googleApiKeyLength: process.env.GOOGLE_API_KEY?.length || 0,
    qdrantUrl: process.env.QDRANT_URL ? 'Set' : 'Not Set',
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
}
