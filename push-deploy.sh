#!/bin/bash

# Push and Deploy Script
# Usage: ./push-deploy.sh "commit message"

set -e

echo "🔄 Starting push and deploy..."

# Check if commit message provided
if [ -z "$1" ]; then
    echo "❌ Error: Please provide a commit message"
    echo "Usage: ./push-deploy.sh \"your commit message\""
    exit 1
fi

COMMIT_MESSAGE="$1"

echo ""
echo "📝 Committing changes..."
git add .
git commit -m "$COMMIT_MESSAGE" || echo "ℹ️  No changes to commit"

echo ""
echo "⬆️  Pushing to GitHub..."
git push origin main

echo ""
echo "🚀 Deploying to server..."
./infrastructure/deploy.sh

echo ""
echo "✅ Push and deploy completed successfully!"
echo "🌐 Site: https://new.albardaiforness.org"

