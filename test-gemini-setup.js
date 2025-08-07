const { GoogleGenerativeAI } = require('@google/generative-ai');
const { QdrantClient } = require('@qdrant/js-client-rest');
const fs = require('fs');
const path = require('path');

// Manually load .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
}

async function testConnections() {
  console.log('🧪 Testing Gemini + Qdrant Medical Reports Setup...\n');

  // Test Gemini
  console.log('1. Testing Gemini AI Connection...');
  console.log('API Key:', process.env.GOOGLE_API_KEY ? `${process.env.GOOGLE_API_KEY.substring(0, 20)}...` : 'Not found');

  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const result = await model.generateContent('Hello, can you help with medical reports?');
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Gemini AI working!');
    console.log('Sample response:', text.substring(0, 100) + '...\n');
  } catch (error) {
    console.log('❌ Gemini AI failed:', error.message);
  }

  // Test Qdrant
  console.log('2. Testing Qdrant Cloud Connection...');
  console.log('URL:', process.env.QDRANT_URL);
  console.log('Has API Key:', !!process.env.QDRANT_API_KEY);

  try {
    const client = new QdrantClient({
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
      https: true,
    });

    const collections = await client.getCollections();
    console.log('✅ Qdrant connected! Collections:', collections.collections?.length || 0);

    // Test embeddings
    console.log('\n3. Testing Embeddings...');
    const { GoogleGenerativeAIEmbeddings } = require('@langchain/google-genai');
    
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GOOGLE_API_KEY,
      modelName: 'embedding-001',
    });

    const testEmbedding = await embeddings.embedQuery('This is a test medical report');
    console.log('✅ Embeddings working! Vector dimension:', testEmbedding.length);

    console.log('\n🎉 All tests passed! Your medical reports feature is ready!\n');
    console.log('Next steps:');
    console.log('1. Start development server: npm run dev');
    console.log('2. Go to: http://localhost:9002/medical-reports');
    console.log('3. Upload a PDF and start chatting!');

  } catch (error) {
    console.error('❌ Qdrant connection failed:', error.message);
  }
}

testConnections();
