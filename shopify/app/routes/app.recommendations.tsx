import { Outlet } from "react-router";

/**
 * Layout wrapper for /app/recommendations/* routes
 * This allows /app/recommendations and /app/recommendations/:id to render properly
 */
export default function RecommendationsLayout() {
  return <Outlet />;
}
