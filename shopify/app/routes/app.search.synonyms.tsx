import { Outlet } from "react-router";

/**
 * Layout route for /app/search/synonyms/*
 * Needed so child routes like /new can render via <Outlet />.
 */
export default function SynonymsLayout() {
  return <Outlet />;
}


