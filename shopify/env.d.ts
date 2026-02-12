/// <reference types="vite/client" />
/// <reference types="@react-router/node" />

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Stripe Configuration
      STRIPE_SECRET_KEY?: string;
      STRIPE_PUBLISHABLE_KEY?: string;
      STRIPE_PRODUCT_ID?: string;
      
      // Shopify Configuration (existing)
      SHOPIFY_API_KEY?: string;
      SHOPIFY_API_SECRET?: string;
      SHOPIFY_APP_URL?: string;
      SCOPES?: string;
      SHOP_CUSTOM_DOMAIN?: string;
      
      // Backend Configuration (existing)
      BACKEND_URL?: string;
      VITE_BACKEND_URL?: string;
    }
  }
}

export {};
