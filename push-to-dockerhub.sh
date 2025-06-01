#!/bin/sh

# Usage: ./push-to-dockerhub.sh <dockerhub-username> [tag]
# Example: ./push-to-dockerhub.sh johndoe v1.0.0

set -e

if [ -z "$1" ]; then
  DOCKERHUB_USER="gmcouto"
  echo "No Docker Hub username provided. Defaulting to 'gmcouto'."
else
  DOCKERHUB_USER=$1
fi
TAG=${2:-latest}
BUILDER=desktop-linux
PLATFORM="linux/amd64"
IMAGE_NAME=mediaddrr

# Build the image

echo "Building Docker image..."
docker build --progress=plain --builder $BUILDER --platform $PLATFORM -t $IMAGE_NAME .

echo "Tagging image as $DOCKERHUB_USER/$IMAGE_NAME:$TAG ..."
docker tag $IMAGE_NAME $DOCKERHUB_USER/$IMAGE_NAME:$TAG

echo "Pushing image to Docker Hub..."
docker push $DOCKERHUB_USER/$IMAGE_NAME:$TAG

echo "Done!"

echo "Usage: $0 [dockerhub-username] [tag]" 