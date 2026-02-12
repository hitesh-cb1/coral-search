import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { ROUTES } from "../constants/routes";

// Redirect /search/synonyms/new -> /app/search/synonyms/new
export const loader = async (_args: LoaderFunctionArgs) => {
  return redirect(ROUTES.SYNONYMS_NEW);
};

export default function RedirectSynonymsNew() {
  return null;
}








