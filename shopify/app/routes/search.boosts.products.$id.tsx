import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { ROUTES, getRouteWithParams } from "../constants/routes";

// Redirect /search/boosts/products/:id -> /app/search/boosts/products/:id
export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id ?? "";
  return redirect(getRouteWithParams(ROUTES.BOOSTS_PRODUCTS_ID, { id }));
};

export default function RedirectBoostProductDetail() {
  return null;
}


