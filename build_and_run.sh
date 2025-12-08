#!/bin/bash

# Get the directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
# Go to project root (parent of docker dir)
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

echo "Building project at $PROJECT_ROOT..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Generate static site
echo "Generating static site..."
npm run generate

# Build the Docker image
echo "Building Docker image..."
docker build -f docker/Dockerfile -t pizagame-static .

# Check if a container with the same name exists and remove it
if [ "$(docker ps -aq -f name=pizagame-site)" ]; then
    echo "Removing existing container..."
    docker rm -f pizagame-site
fi

# Run the Docker container
echo "Starting container on port 8000..."
docker run -d -p 8000:80 --name pizagame-site pizagame-static

echo "Done! Site is running at http://localhost:8000"
