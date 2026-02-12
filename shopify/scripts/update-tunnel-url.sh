#!/bin/bash

# Script to update shopify.app.toml with the current Cloudflare tunnel URL
# This script extracts the URL from shopify app dev output and updates the TOML file

TOML_FILE="shopify.app.toml"
TEMP_FILE=$(mktemp)

# Function to update URL in TOML file
update_toml_url() {
    local new_url=$1
    
    if [ -z "$new_url" ]; then
        echo "Error: No URL provided"
        exit 1
    fi
    
    echo "Updating TOML file with URL: $new_url"
    
    # Update application_url
    sed "s|application_url = \".*\"|application_url = \"$new_url\"|" "$TOML_FILE" > "$TEMP_FILE"
    mv "$TEMP_FILE" "$TOML_FILE"
    
    # Update redirect_urls
    # Normalize formatting in case the file contains an escaped bracket sequence from past edits.
    sed "s|redirect_urls = \[|redirect_urls = [|" "$TOML_FILE" > "$TEMP_FILE"
    mv "$TEMP_FILE" "$TOML_FILE"

    # Replace any existing https callback URL (Cloudflare, ngrok, etc) with the new URL.
    sed "s|\"https://[^\"]*/auth/callback\"|\"$new_url/auth/callback\"|g" "$TOML_FILE" > "$TEMP_FILE"
    mv "$TEMP_FILE" "$TOML_FILE"
    
    echo "✅ TOML file updated successfully!"
    echo "📝 Please manually update the Shopify Partners dashboard:"
    echo "   1. Go to https://partners.shopify.com"
    echo "   2. Open your app → App setup"
    echo "   3. Update App URL: $new_url"
    echo "   4. Update Allowed redirection URL: $new_url/auth/callback"
}

# Check if URL is provided as argument
if [ $# -eq 1 ]; then
    update_toml_url "$1"
else
    echo "Usage: ./scripts/update-tunnel-url.sh <tunnel-url>"
    echo "Example: ./scripts/update-tunnel-url.sh https://example.trycloudflare.com"
    exit 1
fi



