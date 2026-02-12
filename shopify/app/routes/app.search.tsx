import { Outlet } from "react-router";

/**
 * Layout wrapper for /app/search/* routes
 * This allows /app/search and /app/search/boosts/products to render properly.
 */
export default function SearchLayout() {
  return <Outlet />;
}
