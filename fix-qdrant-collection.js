const { QdrantClient } = require('@qdrant/js-client-rest');
require('dotenv').config({ path: '.env.local' });

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;
const COLLECTION_NAME = 'medical_reports';

async function fixQdrantCollection() {
  try {
    console.log('🔧 Fixing Qdrant collection for Gemini embeddings (768 dimensions)...');
    
    // Initialize Qdrant client
    const clientConfig = {
      url: QDRANT_URL,
    };
    
    if (QDRANT_API_KEY) {
      clientConfig.apiKey = QDRANT_API_KEY;
    }
    
    // For cloud instances, ensure proper HTTPS handling
    if (QDRANT_URL.includes('cloud.qdrant.io')) {
      clientConfig.https = true;
    }
    
    console.log('Connecting to Qdrant:', { url: QDRANT_URL, hasApiKey: !!QDRANT_API_KEY });
    const client = new QdrantClient(clientConfig);

    // Check if collection exists
    console.log('Checking existing collection...');
    try {
      const collection = await client.getCollection(COLLECTION_NAME);
      console.log('Found existing collection:', {
        name: collection.name,
        vectorSize: collection.config.params.vectors.size,
        distance: collection.config.params.vectors.distance
      });
      
      if (collection.config.params.vectors.size === 1536) {
        console.log('❌ Collection has wrong dimensions (1536 - OpenAI), deleting...');
        await client.deleteCollection(COLLECTION_NAME);
        console.log('✅ Old collection deleted');
      } else if (collection.config.params.vectors.size === 768) {
        console.log('✅ Collection already has correct dimensions (768 - Gemini)');
        return;
      }
    } catch (error) {
      console.log('No existing collection found');
    }

    // Create new collection with correct dimensions
    console.log('Creating new collection with 768 dimensions for Gemini...');
    await client.createCollection(COLLECTION_NAME, {
      vectors: {
        size: 768, // Gemini embedding dimension
        distance: 'Cosine',
      },
    });
    
    console.log('✅ Collection created successfully!');
    
    // Verify the collection
    const newCollection = await client.getCollection(COLLECTION_NAME);
    console.log('Verified collection:', {
      name: newCollection.name,
      vectorSize: newCollection.config.params.vectors.size,
      distance: newCollection.config.params.vectors.distance
    });
    
    console.log('🎉 Collection is now ready for Gemini embeddings!');
    
  } catch (error) {
    console.error('❌ Error fixing collection:', error);
    process.exit(1);
  }
}

fixQdrantCollection();
