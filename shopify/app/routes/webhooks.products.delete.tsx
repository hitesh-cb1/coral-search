import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { shop, topic, payload } = await authenticate.webhook(request);
    console.log(`🔔 Received ${topic} webhook for ${shop}`);

    const product = payload as any;
    // Extract product ID - Shopify delete webhooks may have different structures
    const productId = product.id || product.admin_graphql_api_id || product.product_id;
    console.log(`🗑️ Product deleted: ${productId}`);
    console.log(`📦 Delete payload:`, JSON.stringify(product, null, 2));

    // Notify backend about product deletion
    const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
    try {
      // Send in same format as create/update webhooks for consistency
      const response = await fetch(`${BACKEND_URL}/shopify/${shop}/webhook/product`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: 'product:deleted',
          shopDomain: shop,
          product: product, // Send full payload like create/update webhooks
          shopifyProductId: productId, // Also include explicit ID for backend convenience
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Backend webhook failed: ${response.status} - ${errorText}`);
      } else {
        const responseData = await response.json().catch(() => null);
        console.log(`✅ Backend notified about product deletion`, responseData);
      }
    } catch (error) {
      console.error('❌ Failed to notify backend about product deletion:', error);
    }

    return new Response();
  } catch (error) {
    console.error('❌ Webhook authentication failed:', error);
    return new Response('Webhook authentication failed', { status: 400 });
  }
};

