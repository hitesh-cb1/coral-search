import type { LoaderFunctionArgs } from "react-router";

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

/**
 * Public API endpoint for Shopify search using rank fusion
 * Route: /api/public/shopify/{shop}/search
 * 
 * Query parameters:
 * - q: search query string
 * - limit: number of results to return (default: 20)
 * - offset: pagination offset (default: 0)
 * 
 * Note: This endpoint uses the /search-fusion backend endpoint which automatically uses rank fusion.
 */
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { shop } = params;
  
  if (!shop) {
    return new Response(
      JSON.stringify({ error: "Shop parameter is required" }),
      { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("q") || "";
  const limit = parseInt(url.searchParams.get("limit") || "20", 10);
  const offset = parseInt(url.searchParams.get("offset") || "0", 10);

  if (!query) {
    return new Response(
      JSON.stringify({ 
        shopDomain: shop,
        query: "",
        total: 0,
        limit,
        offset,
        results: []
      }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  try {
    // Decode the shop domain (it comes URL encoded)
    const decodedShop = decodeURIComponent(shop);
    
    // Build backend search-fusion URL (automatically uses rank fusion)
    const backendSearchUrl = new URL(`${BACKEND_URL}/shopify/${encodeURIComponent(decodedShop)}/search-fusion`);
    backendSearchUrl.searchParams.set("q", query);
    backendSearchUrl.searchParams.set("limit", limit.toString());
    backendSearchUrl.searchParams.set("offset", offset.toString());

    const response = await fetch(backendSearchUrl.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend search API error: ${response.status} - ${errorText}`);
      
      return new Response(
        JSON.stringify({ 
          error: "Search failed",
          message: errorText,
          shopDomain: decodedShop,
          query,
        }),
        { 
          status: response.status,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const data = await response.json();
    
    // Return the response in the expected format
    return new Response(
      JSON.stringify(data),
      { 
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET",
          "Access-Control-Allow-Headers": "Content-Type",
        }
      }
    );
  } catch (error) {
    console.error("Error calling backend search API:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        shopDomain: shop,
        query,
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};

