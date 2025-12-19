#!/bin/bash

# Albero API Deployment Script
# Deploy to venezia:/var/www/albard

set -e

echo "🚀 Starting deployment process..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
REMOTE_HOST="venezia"
REMOTE_PATH="/var/www/albard/api"
LOCAL_PATH="."

echo -e "${YELLOW}📦 Building project...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful${NC}"

echo -e "${YELLOW}📤 Syncing files to server...${NC}"

rsync -avz --progress \
    --exclude='node_modules' \
    --exclude='.env' \
    --exclude='.env.example' \
    --exclude='*.log' \
    --exclude='.git' \
    --exclude='.gitignore' \
    --exclude='uploads' \
    --exclude='scripts' \
    --exclude='src' \
    --exclude='tsconfig.json' \
    --exclude='.DS_Store' \
    -e ssh \
    ${LOCAL_PATH}/ ${REMOTE_HOST}:${REMOTE_PATH}/

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Rsync failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Files synced${NC}"

echo -e "${YELLOW}🔧 Installing dependencies on server...${NC}"

ssh ${REMOTE_HOST} << 'ENDSSH'
cd /var/www/albard/api
npm install --production

if [ $? -ne 0 ]; then
    echo "❌ npm install failed!"
    exit 1
fi

echo "✅ Dependencies installed"

# Restart PM2 process
if command -v pm2 &> /dev/null; then
    echo "🔄 Restarting PM2 process..."
    pm2 restart albard-api || pm2 start dist/index.js --name albard-api
    echo "✅ PM2 process restarted"
else
    echo "⚠️  PM2 not found, skipping process restart"
fi

ENDSSH

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Server setup failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}🎉 API is now running on ${REMOTE_HOST}${NC}"

