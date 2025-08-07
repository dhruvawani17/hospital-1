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

async function testQdrant() {
  console.log('Testing Qdrant Cloud Connection...');
  console.log('URL:', process.env.QDRANT_URL);
  console.log('Has API Key:', !!process.env.QDRANT_API_KEY);

  try {
    const client = new QdrantClient({
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
      https: true, // Force HTTPS for cloud
      checkCompatibility: false, // Skip version check for cloud
    });

    console.log('\n1. Testing collections endpoint...');
    const collections = await client.getCollections();
    console.log('✅ Collections retrieved:', collections.collections?.length || 0);

    console.log('\n2. Testing collection creation...');
    const collectionName = 'test_collection_' + Date.now();
    try {
      await client.createCollection(collectionName, {
        vectors: { size: 1536, distance: 'Cosine' }
      });
      console.log('✅ Collection created successfully');

      // Clean up
      await client.deleteCollection(collectionName);
      console.log('✅ Test collection cleaned up');
    } catch (error) {
      console.log('❌ Collection test failed:', error.message);
    }

    console.log('\n🎉 Qdrant connection test completed!');
  } catch (error) {
    console.error('❌ Qdrant connection failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Check if your Qdrant URL is correct');
    console.log('2. Verify your API key is valid');
    console.log('3. Ensure your Qdrant cluster is running');
  }
}

testQdrant();
