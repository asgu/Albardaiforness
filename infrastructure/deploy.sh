#!/bin/bash

# Albero Deployment Script
# Deploy to: venezia:/var/www/albard

set -e

echo "🚀 Starting deployment to venezia..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVER="venezia"
DEPLOY_PATH="/var/www/albard"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Step 1: Build API
echo -e "${BLUE}📦 Building API...${NC}"
cd api
npm run build
cd ..

# Step 2: Build Frontend
echo -e "${BLUE}📦 Building Frontend...${NC}"
cd frontend
npm run build
cd ..

# Step 3: Create backup on server
echo -e "${BLUE}💾 Creating backup on server...${NC}"
ssh $SERVER "cd $DEPLOY_PATH && tar -czf backups/backup_$TIMESTAMP.tar.gz api/dist frontend/.next || true"

# Step 4: Deploy API
echo -e "${BLUE}🚀 Deploying API...${NC}"
rsync -avz --delete \
  --exclude='node_modules' \
  --exclude='.env' \
  --exclude='*.log' \
  --exclude='.git' \
  --exclude='uploads' \
  ./api/ $SERVER:$DEPLOY_PATH/api/

# Step 5: Deploy Frontend
echo -e "${BLUE}🚀 Deploying Frontend...${NC}"
rsync -avz --delete \
  --exclude='node_modules' \
  --exclude='.env.local' \
  --exclude='*.log' \
  --exclude='.git' \
  ./frontend/ $SERVER:$DEPLOY_PATH/frontend/

# Step 6: Deploy infrastructure configs
echo -e "${BLUE}🚀 Deploying infrastructure configs...${NC}"
rsync -avz ./infrastructure/ $SERVER:$DEPLOY_PATH/infrastructure/

# Step 7: Install dependencies and restart services on server
echo -e "${BLUE}🔧 Installing dependencies and restarting services...${NC}"
ssh $SERVER << 'ENDSSH'
cd /var/www/albard

# Install API dependencies
echo "Installing API dependencies..."
cd api
npm install --production
cd ..

# Install Frontend dependencies
echo "Installing Frontend dependencies..."
cd frontend
npm install --production
cd ..

# Create logs directory if not exists
mkdir -p logs

# Restart PM2 services
echo "Restarting PM2 services..."
pm2 restart albero-api || pm2 start infrastructure/pm2/ecosystem.config.js --only albero-api
pm2 restart albero-frontend || pm2 start infrastructure/pm2/ecosystem.config.js --only albero-frontend

# Save PM2 configuration
pm2 save

echo "✅ Services restarted successfully"
ENDSSH

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Site: https://new.albardaiforness.org${NC}"

# Show PM2 status
echo -e "${BLUE}📊 PM2 Status:${NC}"
ssh $SERVER "pm2 list"

