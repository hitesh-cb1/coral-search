import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { ROUTES } from "../constants/routes";

// Redirect /search/boosts/products -> /app/search/boosts/products
export const loader = async (_args: LoaderFunctionArgs) => {
  return redirect(ROUTES.BOOSTS_PRODUCTS);
};

export default function RedirectBoostProducts() {
  return null;
}


