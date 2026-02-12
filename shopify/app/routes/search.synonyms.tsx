import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { ROUTES } from "../constants/routes";

// Redirect /search/synonyms -> /app/search/synonyms
export const loader = async (_args: LoaderFunctionArgs) => {
  return redirect(ROUTES.SYNONYMS);
};

export default function RedirectSynonyms() {
  return null;
}








