#!/bin/bash

# Deployment script for product-radar to server 98.84.191.247
# Usage: ./scripts/deploy-to-server.sh [user@]host

set -e

SERVER="${1:-root@98.84.191.247}"
APP_DIR="/opt/product-radar"
CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "🚀 Deploying Product Radar to $SERVER"
echo "======================================"

# Check if .env file exists
if [ ! -f "$CURRENT_DIR/.env" ]; then
    echo "⚠️  Warning: .env file not found. You'll need to create it on the server."
    echo "   Required variables:"
    echo "   - SHOPIFY_API_KEY"
    echo "   - SHOPIFY_API_SECRET"
    echo "   - SCOPES"
    echo "   - SHOPIFY_APP_URL=http://98.84.191.247"
    echo "   - NODE_ENV=production"
    echo "   - DATABASE_URL"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "📦 Step 1: Copying files to server..."
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'build' \
    "$CURRENT_DIR/" "$SERVER:$APP_DIR/"

echo ""
echo "🐳 Step 2: Building and starting Docker container..."
ssh "$SERVER" << 'ENDSSH'
cd /opt/product-radar

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
fi

# Stop and remove existing container if it exists
docker stop product-radar 2>/dev/null || true
docker rm product-radar 2>/dev/null || true

# Build new image
echo "Building Docker image..."
docker build -t product-radar .

# Start container
echo "Starting container..."
docker run -d \
  --name product-radar \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file .env \
  product-radar

echo "✅ Container started!"
docker ps | grep product-radar
ENDSSH

echo ""
echo "🌐 Step 3: Setting up Nginx reverse proxy..."
ssh "$SERVER" << 'ENDSSH'
# Install Nginx if not installed
if ! command -v nginx &> /dev/null; then
    apt update && apt install -y nginx
fi

# Create Nginx config
cat > /etc/nginx/sites-available/product-radar << 'NGINXCONF'
server {
    listen 80;
    server_name 98.84.191.247;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINXCONF

# Enable site
ln -sf /etc/nginx/sites-available/product-radar /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

# Test and restart Nginx
nginx -t && systemctl restart nginx

echo "✅ Nginx configured!"
ENDSSH

echo ""
echo "🔍 Step 4: Verifying deployment..."
ssh "$SERVER" << 'ENDSSH'
echo "Checking container status..."
docker ps | grep product-radar || echo "⚠️  Container not running!"

echo ""
echo "Checking app health..."
sleep 2
curl -s http://localhost:3000 | head -20 || echo "⚠️  App not responding on port 3000"

echo ""
echo "Checking Nginx..."
curl -s http://localhost | head -20 || echo "⚠️  Nginx not responding"
ENDSSH

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Verify the app is accessible at http://98.84.191.247"
echo "2. Check logs if needed: ssh $SERVER 'docker logs product-radar'"
echo "3. Update Shopify Partners Dashboard with the URL"
echo "4. Test the app installation in your Shopify store"



