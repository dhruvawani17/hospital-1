import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test environment variables
    const envCheck = {
      googleApiKey: !!process.env.GOOGLE_API_KEY,
      qdrantUrl: !!process.env.QDRANT_URL,
      qdrantApiKey: !!process.env.QDRANT_API_KEY,
      googleApiKeyLength: process.env.GOOGLE_API_KEY?.length || 0,
      qdrantUrl_value: process.env.QDRANT_URL ? 'Set' : 'Not Set',
      nodeEnv: process.env.NODE_ENV,
    };

    // Test Gemini AI connectivity
    let geminiCheck = { status: false, error: null as string | null };
    try {
      const { ChatGoogleGenerativeAI } = await import('@langchain/google-genai');
      const model = new ChatGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_API_KEY,
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
        url: process.env.QDRANT_URL!,
        apiKey: process.env.QDRANT_API_KEY,
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
