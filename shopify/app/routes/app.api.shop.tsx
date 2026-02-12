import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  const response = await admin.graphql(
    `#graphql
      query AppApiShop {
        shop {
          id
          name
          myshopifyDomain
          primaryDomain {
            url
            host
          }
          currencyCode
        }
      }
    `,
  );

  const data = await response.json();

  return Response.json({
    ok: true,
    shop: session.shop,
    shopInfo: data?.data?.shop ?? null,
  });
};

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};


