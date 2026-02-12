import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { getIndexingStatus, type IndexingStatusResponse } from "../utils/backend.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { session } = await authenticate.admin(request);

    try {
      const status = await getIndexingStatus(session.shop);
      return Response.json(status);
    } catch (error) {
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to get indexing status:', errorMessage);
      
      return Response.json({
        shopDomain: session.shop,
        status: 'idle' as const,
        message: 'Backend server is not reachable. Please check if it is running.',
        error: errorMessage,
      } as IndexingStatusResponse);
    }
  } catch (error) {
    
    console.error('Unexpected error in indexing-status loader:', error);
    return Response.json({
      shopDomain: 'unknown',
      status: 'idle' as const,
      message: 'Unable to check indexing status',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as IndexingStatusResponse);
  }
};


export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};

