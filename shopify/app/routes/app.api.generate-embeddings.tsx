import type { ActionFunctionArgs, HeadersFunction } from "react-router";
import { authenticate } from "../shopify.server";
import { generateEmbeddings } from "../utils/backend.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  
  const url = new URL(request.url);
  const shop = url.searchParams.get('shop') || session.shop;

  try {
    const result = await generateEmbeddings(shop);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Indexing triggered successfully',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error triggering indexing:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to trigger indexing',
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

