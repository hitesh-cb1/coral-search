import { useEffect, useMemo, useState } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { ROUTES } from "../constants/routes";

type BoostedProduct = {
  id: string;
  title: string;
  imageUrl: string;
  price: string;
};

const BOOST_KEY_PREFIX = "boost_product_";
const BOOST_TERMS_PREFIX = "boost_terms_";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  if (!params.id) {
    throw new Response("Missing product id", { status: 400 });
  }

  /**
   * Route param is typically numeric product id (e.g. 7855687008304),
   * but depending on navigation it might be a full GID or an encoded GID.
   * Shopify Admin GraphQL requires a GID for product(id:).
   */
  const raw = decodeURIComponent(params.id);
  let productId: string;
  if (raw.startsWith("gid://")) {
    productId = raw;
  } else if (/^\d+$/.test(raw)) {
    productId = `gid://shopify/Product/${raw}`;
  } else {
    const m = raw.match(/(\d+)\s*$/);
    productId = m ? `gid://shopify/Product/${m[1]}` : `gid://shopify/Product/${raw}`;
  }

  const response = await admin.graphql(
    `#graphql
      query BoostProductDetail($id: ID!) {
        product(id: $id) {
          id
          title
          featuredImage {
            url
          }
          variants(first: 1) {
            nodes {
              price
            }
          }
        }
      }
    `,
    { variables: { id: productId } },
  );

  const data: any = await response.json();
  const p = data?.data?.product;

  // Always render the UI. If Shopify can't load the product, fall back to id.
  const product: BoostedProduct = p
    ? {
        id: p.id,
        title: p.title,
        imageUrl: p.featuredImage?.url || "",
        price: p.variants?.nodes?.[0]?.price ? `₹${p.variants.nodes[0].price}` : "",
      }
    : {
        id: productId,
        title: `Product ${raw}`,
        imageUrl: "",
        price: "",
      };

  return { product };
};

export default function BoostEditPage() {
  const { product } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const storageKey = useMemo(() => `${BOOST_TERMS_PREFIX}${product.id}`, [product.id]);

  const [termInput, setTermInput] = useState("");
  const [terms, setTerms] = useState<string[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) {
      setTerms([]);
      setHasSaved(false);
      setIsDirty(false);
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const cleaned = parsed
          .filter((t) => typeof t === "string")
          .map((t) => t.trim())
          .filter((t) => t.length > 0 && t !== "New");
        setTerms(cleaned);
        setHasSaved(cleaned.length > 0);
      } else {
        setTerms([]);
        setHasSaved(false);
      }
    } catch {
      setTerms([]);
      setHasSaved(false);
    }
    setIsDirty(false);
  }, [storageKey]);

  const addTerm = () => {
    const nextTerm = termInput.trim();
    if (!nextTerm) return;
    if (nextTerm.length > 100) return;
    if (nextTerm === "New") {
      setTermInput("");
      return;
    }
    if (terms.includes(nextTerm)) {
      setTermInput("");
      return;
    }
    setTerms([...terms, nextTerm]);
    setIsDirty(true);
    setTermInput("");
  };

  const removeTerm = (t: string) => {
    setTerms(terms.filter((x) => x !== t));
    setIsDirty(true);
  };

  const save = () => {
    const cleaned = terms.map((t) => t.trim()).filter((t) => t.length > 0 && t !== "New");
    sessionStorage.setItem(storageKey, JSON.stringify(cleaned));
    // Mark as boosted so it appears under Boosts tab in the list page
    sessionStorage.setItem(`${BOOST_KEY_PREFIX}${product.id}`, "1");
    setTerms(cleaned);
    setHasSaved(cleaned.length > 0);
    setIsDirty(false);
  };

  const deleteAllTerms = () => {
    sessionStorage.removeItem(storageKey);
    // Removing terms also removes boost flag for this product
    sessionStorage.removeItem(`${BOOST_KEY_PREFIX}${product.id}`);
    setTerms([]);
    setHasSaved(false);
    setIsDirty(false);
    setTermInput("");
  };

  return (
    <s-page>
      <s-box paddingBlockEnd="base">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            type="button"
            onClick={() => navigate(ROUTES.BOOSTS_PRODUCTS)}
            aria-label="Back"
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              padding: 8,
              borderRadius: 8,
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              width="20"
              height="20"
              fill="#202223"
            >
              <path d="M7.707 14.707a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 0-1.414l4-4a1 1 0 1 1 1.414 1.414L5.414 9H17a1 1 0 1 1 0 2H5.414l2.293 2.293a1 1 0 0 1 0 1.414Z" />
            </svg>
          </button>
          <s-heading>
            <span style={{ fontSize: 20, fontWeight: 700, color: "#202223" }}>
              Edit boost
            </span>
          </s-heading>
        </div>
      </s-box>

      <s-box paddingBlockEnd="base">
        <div
          style={{
            maxWidth: 760,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div
            style={{
              background: "white",
              border: "1px solid #e1e3e5",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Boosted product</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  border: "1px solid #e1e3e5",
                  background: "#fafbfb",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <span style={{ color: "#6d7175" }}> </span>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <div style={{ fontWeight: 700, color: "#202223" }}>
                  {product.title}
                </div>
                {product.price ? (
                  <div style={{ color: "#6d7175", fontSize: 13 }}>{product.price}</div>
                ) : null}
              </div>
            </div>
          </div>

          <div
            style={{
              background: "white",
              border: "1px solid #e1e3e5",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Add search terms</div>
            <div style={{ color: "#6d7175", fontSize: 13, marginBottom: 12 }}>
              Boosted products are displayed on the search results page when customers
              search for these terms.
            </div>

            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
              Search term
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <input
                  value={termInput}
                  onChange={(e) => setTermInput(e.target.value)}
                  placeholder="Eg. Hat"
                  maxLength={100}
                  style={{
                    width: "90%",
                    border: "1px solid #c9cccf",
                    borderRadius: 8,
                    padding: "10px 54px 10px 10px",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#6d7175",
                    fontSize: 12,
                  }}
                >
                  {termInput.length}/100
                </div>
              </div>
              <button
                type="button"
                onClick={addTerm}
                style={{
                  border: "1px solid #c9cccf",
                  borderRadius: 8,
                  padding: "9px 12px",
                  background: "white",
                  cursor: "pointer",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                Add
              </button>
            </div>

            <div
              style={{
                marginTop: 12,
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              {/* Show an "unsaved" badge when changes have been made but not saved yet.
                  Keep it out of the way once real term badges exist. */}
              {isDirty && terms.length === 0 ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "2px 10px",
                    borderRadius: 999,
                    border: "1px solid #e1e3e5",
                    background: "#f6f6f7",
                    color: "#202223",
                    fontWeight: 700,
                    fontSize: 12,
                    lineHeight: "20px",
                  }}
                >
                  New
                </span>
              ) : null}

              {terms.map((t) => (
                <span
                  key={t}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "2px 10px",
                    borderRadius: 999,
                    border: "1px solid #e1e3e5",
                    background: "#f6f6f7",
                    color: "#202223",
                    fontWeight: 700,
                    fontSize: 12,
                    lineHeight: "20px",
                  }}
                >
                  {t}
                  <button
                    type="button"
                    onClick={() => removeTerm(t)}
                    aria-label={`Remove ${t}`}
                    style={{
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      color: "#6d7175",
                      fontWeight: 900,
                      lineHeight: "20px",
                      padding: 0,
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            {hasSaved && !isDirty ? (
              <button
                type="button"
                onClick={deleteAllTerms}
                style={{
                  border: "1px solid #d72c0d",
                  borderRadius: 10,
                  padding: "8px 14px",
                  background: "#d72c0d",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Delete
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                save();
              }}
              disabled={!isDirty}
              style={{
                border: "1px solid #c9cccf",
                borderRadius: 10,
                padding: "8px 14px",
                background: !isDirty ? "#f1f2f3" : "#202223",
                color: !isDirty ? "#6d7175" : "white",
                cursor: !isDirty ? "not-allowed" : "pointer",
                fontWeight: 700,
              }}
            >
              Save
            </button>
          </div>
        </div>
      </s-box>
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};


