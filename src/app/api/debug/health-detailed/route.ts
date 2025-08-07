import { NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/medical-reports-config';

export async function GET() {
  try {
    // Test environment variables
    const envCheck = {
      googleApiKey: !!API_CONFIG.GOOGLE_API_KEY,
      qdrantUrl: !!API_CONFIG.QDRANT_URL,
      qdrantApiKey: !!API_CONFIG.QDRANT_API_KEY,
      googleApiKeyLength: API_CONFIG.GOOGLE_API_KEY?.length || 0,
      qdrantUrl_value: API_CONFIG.QDRANT_URL ? 'Set' : 'Not Set',
      nodeEnv: process.env.NODE_ENV,
      source: 'hardcoded_in_code',
    };

    // Test Gemini AI connectivity
    let geminiCheck = { status: false, error: null as string | null };
    try {
      const { ChatGoogleGenerativeAI } = await import('@langchain/google-genai');
      const model = new ChatGoogleGenerativeAI({
        apiKey: API_CONFIG.GOOGLE_API_KEY,
        model: 'gemini-1.5-flash',
      });
      await model.invoke('test');
      geminiCheck.status = true;
    } catch (error) {
      geminiCheck.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Test Qdrant connectivity
    let qdrantCheck = { status: false, error: null as string | null };
    try {
      const { QdrantClient } = await import('@qdrant/js-client-rest');
      const client = new QdrantClient({
        url: API_CONFIG.QDRANT_URL,
        apiKey: API_CONFIG.QDRANT_API_KEY,
      });
      await client.getCollections();
      qdrantCheck.status = true;
    } catch (error) {
      qdrantCheck.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return NextResponse.json({
      environment: envCheck,
      gemini: geminiCheck,
      qdrant: qdrantCheck,
      timestamp: new Date().toISOString(),
      platform: process.platform,
      runtime: 'nodejs',
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
