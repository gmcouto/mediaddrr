#!/bin/sh

# Script to tag the 0.4.0 version as latest and push to Docker Hub

set -e

DOCKERHUB_USER="gmcouto"
IMAGE_NAME="mediaddrr"
VERSION=$(jq -r '.version' package.json)

echo "Pulling $DOCKERHUB_USER/$IMAGE_NAME:$VERSION..."
docker pull $DOCKERHUB_USER/$IMAGE_NAME:$VERSION

echo "Tagging $DOCKERHUB_USER/$IMAGE_NAME:$VERSION as $DOCKERHUB_USER/$IMAGE_NAME:latest..."
docker tag $DOCKERHUB_USER/$IMAGE_NAME:$VERSION $DOCKERHUB_USER/$IMAGE_NAME:latest

echo "Pushing $DOCKERHUB_USER/$IMAGE_NAME:latest to Docker Hub..."
docker push $DOCKERHUB_USER/$IMAGE_NAME:latest

echo "Done! The latest tag now points to version $VERSION"

