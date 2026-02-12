/**
 * Centralized Routes/Endpoints
 * Import and use these constants instead of hardcoding paths
 */

export const ROUTES = {
  // Main App Routes
  HOME: "/app",
  
  // Search Routes
  SEARCH: "/app/search",
  BOOSTS_PRODUCTS: "/app/search/boosts/products",
  BOOSTS_PRODUCTS_NEW: "/app/search/boosts/products/new",
  BOOSTS_PRODUCTS_ID: "/app/search/boosts/products/:id",
  SYNONYMS: "/app/search/synonyms",
  SYNONYMS_NEW: "/app/search/synonyms/new",
  // Filter Routes
  FILTERS: "/app/filters",
  FILTERS_NEW: "/app/filters/new",
  FILTERS_DETAIL: "/app/filters/:id",
  
  // Recommendations Routes
  RECOMMENDATIONS: "/app/recommendations",
  RECOMMENDATIONS_NEW: "/app/recommendations/new",
  RECOMMENDATIONS_DETAIL: "/app/recommendations/:id",
  
  // Additional Routes
  ADDITIONAL: "/app/additional",
  
  // Billing Routes
  BILLING: "/app/billing",
  
  // Auth Routes
  AUTH_LOGIN: "/auth/login",
} as const;

// Type for route keys
export type RouteKey = keyof typeof ROUTES;

// Type for route values
export type Route = typeof ROUTES[RouteKey];

/**
 * Helper function to get route with params
 * Example: getRoute(ROUTES.FILTERS_EDIT, { id: '123' }) => '/app/filters/123/edit'
 */
export const getRouteWithParams = (
  route: string,
  params: Record<string, string>
): string => {
  let result = route;
  Object.entries(params).forEach(([key, value]) => {
    result = result.replace(`:${key}`, value);
  });
  return result;
};

// External Links
export const EXTERNAL_LINKS = {
  SHOPIFY_FILTERS_HELP: "https://help.shopify.com/en/manual/online-store/search-and-discovery/filters",
  SHOPIFY_SEARCH_HELP: "https://help.shopify.com/en/manual/online-store/search-and-discovery",
  SHOPIFY_DOCS: "https://shopify.dev/docs",
} as const;

