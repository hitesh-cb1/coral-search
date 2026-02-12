import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { shop, topic, payload } = await authenticate.webhook(request);
    console.log(`🔔 Received ${topic} webhook for ${shop}`);

    const product = payload as any;
    console.log(`📦 Product updated: ${product.id} - ${product.title}`);

    // Notify backend about product update
    const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
    try {
      const response = await fetch(`${BACKEND_URL}/shopify/${shop}/webhook/product`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: 'product:updated',
          shopDomain: shop,
          product: product,
        }),
      });

      if (!response.ok) {
        console.error(`❌ Backend webhook failed: ${response.status}`);
      } else {
        console.log(`✅ Backend notified about product update`);
      }
    } catch (error) {
      console.error('❌ Failed to notify backend about product update:', error);
    }

    return new Response();
  } catch (error) {
    console.error('❌ Webhook authentication failed:', error);
    return new Response('Webhook authentication failed', { status: 400 });
  }
};




