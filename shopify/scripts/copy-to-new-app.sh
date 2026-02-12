#!/bin/bash

# ProductRadar → New App Copy Script
# Usage: ./scripts/copy-to-new-app.sh <new-app-directory>

set -e

if [ -z "$1" ]; then
    echo "❌ Error: Please provide the new app directory path"
    echo "Usage: ./scripts/copy-to-new-app.sh <new-app-directory>"
    echo "Example: ./scripts/copy-to-new-app.sh ../shopify-app-ai"
    exit 1
fi

NEW_APP_DIR="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "📦 ProductRadar → New App Copy Script"
echo "======================================"
echo "Source: $PROJECT_ROOT"
echo "Destination: $NEW_APP_DIR"
echo ""

# Check if destination exists
if [ ! -d "$NEW_APP_DIR" ]; then
    echo "⚠️  Warning: Destination directory doesn't exist"
    read -p "Create it? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        mkdir -p "$NEW_APP_DIR"
        echo "✅ Created directory: $NEW_APP_DIR"
    else
        echo "❌ Aborted"
        exit 1
    fi
fi

cd "$PROJECT_ROOT"

echo "📋 Copying files..."

# Copy essential directories
echo "  → app/"
cp -r app "$NEW_APP_DIR/" 2>/dev/null || echo "    ⚠️  app/ already exists or error"

echo "  → prisma/"
cp -r prisma "$NEW_APP_DIR/" 2>/dev/null || echo "    ⚠️  prisma/ already exists or error"

echo "  → extensions/"
cp -r extensions "$NEW_APP_DIR/" 2>/dev/null || echo "    ⚠️  extensions/ already exists or error"

echo "  → public/"
cp -r public "$NEW_APP_DIR/" 2>/dev/null || echo "    ⚠️  public/ already exists or error"

echo "  → scripts/"
cp -r scripts "$NEW_APP_DIR/" 2>/dev/null || echo "    ⚠️  scripts/ already exists or error"

# Copy config files
echo "  → package.json"
cp package.json "$NEW_APP_DIR/" 2>/dev/null || echo "    ⚠️  package.json copy failed"

echo "  → tsconfig.json"
cp tsconfig.json "$NEW_APP_DIR/" 2>/dev/null || echo "    ⚠️  tsconfig.json copy failed"

echo "  → vite.config.ts"
cp vite.config.ts "$NEW_APP_DIR/" 2>/dev/null || echo "    ⚠️  tsconfig.json copy failed"

echo "  → env.d.ts"
cp env.d.ts "$NEW_APP_DIR/" 2>/dev/null || echo "    ⚠️  env.d.ts copy failed"

# Optional files
if [ -f "Dockerfile" ]; then
    echo "  → Dockerfile"
    cp Dockerfile "$NEW_APP_DIR/" 2>/dev/null || true
fi

if [ -f "shopify.web.toml" ]; then
    echo "  → shopify.web.toml"
    cp shopify.web.toml "$NEW_APP_DIR/" 2>/dev/null || true
fi

# Remove database file if copied (should create fresh)
if [ -f "$NEW_APP_DIR/prisma/dev.sqlite" ]; then
    echo "  🗑️  Removing old database (will be recreated)"
    rm "$NEW_APP_DIR/prisma/dev.sqlite" 2>/dev/null || true
fi

echo ""
echo "✅ Files copied successfully!"
echo ""
echo "📝 Next Steps:"
echo "=============="
echo "1. cd $NEW_APP_DIR"
echo "2. Update shopify.app.toml:"
echo "   - Change 'name' to your new app name"
echo "   - Verify 'scopes' and 'webhooks' are correct"
echo "3. Create .env file with new app credentials:"
echo "   SHOPIFY_API_KEY=<from-partners-dashboard>"
echo "   SHOPIFY_API_SECRET=<from-partners-dashboard>"
echo "   SCOPES=write_products,read_orders,read_customers"
echo "4. Install dependencies:"
echo "   npm install"
echo "5. Setup database:"
echo "   npx prisma generate"
echo "   npx prisma migrate deploy"
echo "6. Run the app:"
echo "   shopify app dev --store=coral-brics-ai.myshopify.com"
echo ""
echo "📖 See MIGRATION-GUIDE.md for detailed instructions"

