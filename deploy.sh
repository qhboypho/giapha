#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Get current git branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [ "$BRANCH" != "master-tc" ]; then
  echo "Error: You must be on the 'master-tc' branch to deploy. Current branch is: $BRANCH"
  exit 1
fi

echo "Building frontend..."
npm run build

echo "Deploying to Cloudflare Pages..."
# Deploys dist folder to the project 'giapha-tc'
npx wrangler pages deploy dist --project-name giapha-tc --branch master-tc

echo "Pushing code to GitHub origin master-tc..."
git push origin master-tc

echo "Deployment and Push completed successfully!"
