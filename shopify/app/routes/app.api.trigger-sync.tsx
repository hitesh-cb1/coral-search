import type { ActionFunctionArgs, HeadersFunction } from "react-router";
import { authenticate } from "../shopify.server";
import { syncShopProducts, registerShopWithBackend } from "../utils/backend.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  
  const url = new URL(request.url);
  const shop = url.searchParams.get('shop') || session.shop;

  try {
    
    if (session.accessToken) {
      await registerShopWithBackend(session.shop, session.accessToken);
    }
   
    const result = await syncShopProducts(shop);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Sync triggered successfully',
      productsImported: result.productsImported,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error triggering sync:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to trigger sync',
        message: error instanceof Error ? error.message : 'Unknown error'
      }), 
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};

