#!/bin/sh

# Usage: ./push-to-dockerhub.sh [tag] <dockerhub-username>
# Example: ./push-to-dockerhub.sh v1.0.0 johndoe

# get version from package.json
VERSION=$(jq -r '.version' package.json)

set -e

if [ -z "$2" ]; then
  DOCKERHUB_USER="gmcouto"
  echo "No Docker Hub username provided. Defaulting to 'gmcouto'."
else
  DOCKERHUB_USER=$2
fi
TAG=${1:-$VERSION}
echo "Using tag: $TAG"
BUILDER=desktop-linux
PLATFORM="linux/amd64"
IMAGE_NAME=mediaddrr

# Build the image

NEXT_TELEMETRY_DISABLED=1 bun run build --debug --no-lint

echo "Building Docker image..."
docker build --progress=plain --builder $BUILDER --platform $PLATFORM -t $IMAGE_NAME .

echo "Tagging image as $DOCKERHUB_USER/$IMAGE_NAME:$TAG ..."
docker tag $IMAGE_NAME $DOCKERHUB_USER/$IMAGE_NAME:$TAG

echo "Pushing image to Docker Hub..."
docker push $DOCKERHUB_USER/$IMAGE_NAME:$TAG

echo "Done!"

echo "Usage: $0 [dockerhub-username] [tag]" 