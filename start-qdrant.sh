#!/bin/bash

echo "Starting Qdrant Vector Database..."
echo

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker first."
    exit 1
fi

echo "Checking if Qdrant is already running..."
if docker ps | grep -q qdrant; then
    echo "Qdrant is already running!"
    echo
    echo "You can access the Qdrant dashboard at: http://localhost:6333/dashboard"
    exit 0
fi

echo "Starting Qdrant container..."
docker run -d --name qdrant -p 6333:6333 -p 6334:6334 -v qdrant_storage:/qdrant/storage qdrant/qdrant:latest

if [ $? -eq 0 ]; then
    echo
    echo "✅ Qdrant started successfully!"
    echo
    echo "Dashboard: http://localhost:6333/dashboard"
    echo "API Endpoint: http://localhost:6333"
    echo
    echo "To stop Qdrant, run: docker stop qdrant"
    echo "To remove Qdrant, run: docker rm qdrant"
else
    echo
    echo "❌ Failed to start Qdrant. Please check Docker logs."
fi
