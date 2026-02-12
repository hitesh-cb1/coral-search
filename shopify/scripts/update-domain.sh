#!/bin/bash

# Script to update shopify.app.coral-bricks-search.toml with production domain
# Usage: ./scripts/update-domain.sh <domain>
# Example: ./scripts/update-domain.sh api.coralbricks.com

TOML_FILE="shopify.app.coral-bricks-search.toml"
TEMP_FILE=$(mktemp)

# Function to update domain in TOML file
update_domain() {
    local domain=$1
    
    if [ -z "$domain" ]; then
        echo "Error: No domain provided"
        echo "Usage: ./scripts/update-domain.sh <domain>"
        echo "Example: ./scripts/update-domain.sh api.coralbricks.com"
        exit 1
    fi
    
    # Remove http:// or https:// if present
    domain=$(echo "$domain" | sed 's|^https\?://||')
    
    # Ensure it starts with https://
    local url="https://${domain}"
    
    echo "Updating TOML file with domain: $url"
    
    # Update application_url
    sed "s|application_url = \".*\"|application_url = \"$url\"|" "$TOML_FILE" > "$TEMP_FILE"
    mv "$TEMP_FILE" "$TOML_FILE"
    
    # Update redirect_urls
    sed "s|redirect_urls = \[|redirect_urls = [|" "$TOML_FILE" > "$TEMP_FILE"
    mv "$TEMP_FILE" "$TOML_FILE"
    
    # Replace any existing callback URL
    sed "s|\"https://[^\"]*/auth/callback\"|\"$url/auth/callback\"|g" "$TOML_FILE" > "$TEMP_FILE"
    mv "$TEMP_FILE" "$TOML_FILE"
    
    echo "✅ TOML file updated successfully!"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Verify SSL is installed: curl $url"
    echo "   2. Deploy config: shopify app deploy"
    echo "   3. Update Shopify Partners Dashboard:"
    echo "      - App URL: $url"
    echo "      - Redirect URL: $url/auth/callback"
    echo "   4. Update server .env: SHOPIFY_APP_URL=$url"
    echo "   5. Restart your app on the server"
}

# Check if domain is provided as argument
if [ $# -eq 1 ]; then
    update_domain "$1"
else
    echo "Usage: ./scripts/update-domain.sh <domain>"
    echo "Example: ./scripts/update-domain.sh api.coralbricks.com"
    exit 1
fi



