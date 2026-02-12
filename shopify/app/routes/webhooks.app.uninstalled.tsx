import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    console.log(`🔔 Webhook received: ${request.method} ${request.url}`);
    console.log(`🔔 Headers:`, Object.fromEntries(request.headers.entries()));
    
    const { shop, session, topic } = await authenticate.webhook(request);

    console.log(`✅ Received ${topic} webhook for ${shop}`);

    try {
      const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
      await fetch(`${BACKEND_URL}/shopify/${shop}/uninstall`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log(`✅ Backend notified about uninstallation for ${shop}`);
    } catch (error) {
      console.error('❌ Failed to notify backend about uninstallation:', error);
    }

    if (session) {
      await db.session.deleteMany({ where: { shop } });
      console.log(`🗑️ Deleted all sessions for shop: ${shop}`);
    }

    return new Response();
  } catch (error) {
    console.error('❌ Webhook authentication failed:', error);
    console.error('❌ Error details:', (error as Error).message);
    return new Response('Webhook authentication failed', { status: 400 });
  }
};
