import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";

import { authenticate, registerWebhooks, sessionStorage } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  await registerWebhooks({ session });

  try {
    const existingSessions = await sessionStorage.findSessionsByShop(session.shop);
    if (existingSessions.length > 1) {
      for (const oldSession of existingSessions) {
        if (oldSession.id !== session.id) {
          await sessionStorage.deleteSession(oldSession.id);
        }
      }
    }
  } catch (error) {
    console.error('Failed to clean up old sessions:', error);
  }
  // Removed registerShopWithBackend - data will only be synced when button is clicked

  return { 
    apiKey: process.env.SHOPIFY_API_KEY || "",
    shop: session.shop,
  };
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    <AppProvider embedded apiKey={apiKey}>
      <s-app-nav>
        <s-link href="/app/search">Search</s-link>
        <s-link href="/app/filters">Filters</s-link>
        <s-link href="/app/billing">Billing</s-link>
        <s-link href="/app/analytics">Analytics</s-link>
      </s-app-nav>
      
      {/* Show content - no sync status check on page load */}
      <Outlet />
    </AppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
