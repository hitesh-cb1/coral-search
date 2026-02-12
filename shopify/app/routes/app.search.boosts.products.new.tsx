import { useMemo, useState } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { ROUTES } from "../constants/routes";

type StoreProduct = {
  id: string;
  title: string;
  imageUrl: string;
};

const BOOST_KEY_PREFIX = "boost_product_";
const BOOST_TERMS_PREFIX = "boost_terms_";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  // Minimal product data for the "Browse" list (placeholder; can be replaced with a real picker)
  const response = await admin.graphql(
    `#graphql
      query BoostNewProducts($first: Int!) {
        products(first: $first) {
          edges {
            node {
              id
              title
              featuredImage {
                url
              }
            }
          }
        }
      }
    `,
    { variables: { first: 50 } },
  );

  const data: any = await response.json();
  const products: StoreProduct[] =
    data?.data?.products?.edges?.map((e: any) => ({
      id: e.node.id,
      title: e.node.title,
      imageUrl: e.node.featuredImage?.url || "",
    })) ?? [];

  return { products };
};

export default function BoostCreatePage() {
  const { products } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const [productQuery, setProductQuery] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [showBrowseModal, setShowBrowseModal] = useState(false);
  const [browseQuery, setBrowseQuery] = useState("");
  const [draftSelectedProductIds, setDraftSelectedProductIds] = useState<string[]>(
    [],
  );

  const [termInput, setTermInput] = useState("");
  const [terms, setTerms] = useState<string[]>([]);

  const filteredProducts = useMemo(() => {
    const q = browseQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.title.toLowerCase().includes(q));
  }, [products, browseQuery]);

  const selectedProducts = useMemo(() => {
    const set = new Set(selectedProductIds);
    return products.filter((p) => set.has(p.id));
  }, [products, selectedProductIds]);

  const canSave = selectedProductIds.length > 0 && terms.length > 0;

  const addTerm = () => {
    const t = termInput.trim();
    if (!t) return;
    if (t.length > 100) return;
    if (terms.includes(t)) {
      setTermInput("");
      return;
    }
    setTerms([...terms, t]);
    setTermInput("");
  };

  const removeTerm = (t: string) => {
    setTerms(terms.filter((x) => x !== t));
  };

  const toggleSelect = (id: string) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter((x) => x !== id));
    } else {
      setSelectedProductIds([...selectedProductIds, id]);
    }
  };

  const toggleDraftSelect = (id: string) => {
    if (draftSelectedProductIds.includes(id)) {
      setDraftSelectedProductIds(draftSelectedProductIds.filter((x) => x !== id));
    } else {
      setDraftSelectedProductIds([...draftSelectedProductIds, id]);
    }
  };

  const save = () => {
    // Persist to sessionStorage so the boosts list can render the badge in "Search terms"
    const cleanedTerms = terms
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && t !== "New");

    for (const productId of selectedProductIds) {
      sessionStorage.setItem(`${BOOST_KEY_PREFIX}${productId}`, "1");
      sessionStorage.setItem(
        `${BOOST_TERMS_PREFIX}${productId}`,
        JSON.stringify(cleanedTerms),
      );
    }
    navigate(ROUTES.BOOSTS_PRODUCTS);
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
              Create new boost
            </span>
          </s-heading>
        </div>
      </s-box>

      <s-box paddingBlockEnd="base">
        <div style={{ maxWidth: 760, margin: "0 auto", display: "grid", gap: 12 }}>
          <div
            style={{
              background: "white",
              border: "1px solid #e1e3e5",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Add products to boost</div>

            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                flexWrap: "nowrap",
              }}
            >
              <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    position: "absolute",
                    left: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#5c5f62",
                    pointerEvents: "none",
                    display: "inline-flex",
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    width="18"
                    height="18"
                    fill="#5c5f62"
                  >
                    <path d="M8.5 2a6.5 6.5 0 1 0 3.955 11.66l3.693 3.694a1 1 0 0 0 1.414-1.414l-3.694-3.693A6.5 6.5 0 0 0 8.5 2Zm-4.5 6.5a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0Z" />
                  </svg>
                </span>
                <input
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  placeholder="Search products"
                  style={{
                    width: "92%",
                    border: "1px solid #c9cccf",
                    borderRadius: 8,
                    padding: "10px 10px 10px 34px",
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setDraftSelectedProductIds(selectedProductIds);
                  setBrowseQuery("");
                  setShowBrowseModal(true);
                }}
                style={{
                  border: "1px solid #c9cccf",
                  borderRadius: 8,
                  padding: "9px 12px",
                  background: "white",
                  cursor: "pointer",
                  fontWeight: 700,
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                }}
              >
                Browse
              </button>
            </div>

            {selectedProducts.length > 0 ? (
              <div
                style={{
                  marginTop: 12,
                  borderTop: "1px solid #f1f2f3",
                  paddingTop: 12,
                  display: "grid",
                  gap: 8,
                }}
              >
                {selectedProducts.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 6px",
                      borderRadius: 8,
                      background: "#f6f6f7",
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        border: "1px solid #e1e3e5",
                        background: "#fafbfb",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <span style={{ color: "#6d7175" }}> </span>
                      )}
                    </div>
                    <div style={{ fontWeight: 600, color: "#202223", flex: 1 }}>
                      {p.title}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedProductIds(selectedProductIds.filter((x) => x !== p.id))}
                      aria-label={`Remove ${p.title}`}
                      style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        color: "#6d7175",
                        fontWeight: 900,
                        fontSize: 16,
                        lineHeight: "20px",
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
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

            <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
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

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={save}
              disabled={!canSave}
              style={{
                border: "1px solid #c9cccf",
                borderRadius: 10,
                padding: "8px 14px",
                background: canSave ? "#202223" : "#f1f2f3",
                color: canSave ? "white" : "#6d7175",
                cursor: canSave ? "pointer" : "not-allowed",
                fontWeight: 700,
              }}
            >
              Save
            </button>
          </div>
        </div>
      </s-box>

      {showBrowseModal ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(32,34,35,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            zIndex: 1000,
          }}
          onClick={() => setShowBrowseModal(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 560,
              background: "white",
              borderRadius: 14,
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "14px 16px",
                borderBottom: "1px solid #e1e3e5",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div style={{ fontWeight: 700, color: "#202223" }}>Add products</div>
              <button
                type="button"
                onClick={() => setShowBrowseModal(false)}
                aria-label="Close"
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  color: "#6d7175",
                  fontWeight: 900,
                  fontSize: 18,
                  lineHeight: "18px",
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: 16, borderBottom: "1px solid #f1f2f3" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ position: "relative", flex: 1 }}>
                  <span
                    style={{
                      position: "absolute",
                      left: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#5c5f62",
                      pointerEvents: "none",
                      display: "inline-flex",
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      width="18"
                      height="18"
                      fill="#5c5f62"
                    >
                      <path d="M8.5 2a6.5 6.5 0 1 0 3.955 11.66l3.693 3.694a1 1 0 0 0 1.414-1.414l-3.694-3.693A6.5 6.5 0 0 0 8.5 2Zm-4.5 6.5a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0Z" />
                    </svg>
                  </span>
                  <input
                    value={browseQuery}
                    onChange={(e) => setBrowseQuery(e.target.value)}
                    placeholder="Search products"
                    style={{
                      width: "100%",
                      border: "1px solid #c9cccf",
                      borderRadius: 8,
                      padding: "10px 10px 10px 34px",
                    }}
                  />
                </div>
              </div>
              <div style={{ marginTop: 10 }}>
                <button
                  type="button"
                  disabled
                  style={{
                    border: "1px dashed #e1e3e5",
                    borderRadius: 999,
                    padding: "6px 10px",
                    background: "white",
                    cursor: "not-allowed",
                    fontWeight: 600,
                    color: "#6d7175",
                  }}
                >
                  Add filter +
                </button>
              </div>
            </div>

            <div style={{ maxHeight: 420, overflow: "auto" }}>
              {filteredProducts.map((p) => {
                const checked = draftSelectedProductIds.includes(p.id);
                return (
                  <label
                    key={p.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 16px",
                      borderBottom: "1px solid #f1f2f3",
                      cursor: "pointer",
                      background: checked ? "#f6f6f7" : "white",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleDraftSelect(p.id)}
                    />
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        border: "1px solid #e1e3e5",
                        background: "#fafbfb",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt=""
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <span style={{ color: "#6d7175" }}> </span>
                      )}
                    </div>
                    <div style={{ fontWeight: 600, color: "#202223" }}>{p.title}</div>
                  </label>
                );
              })}
            </div>

            <div
              style={{
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div style={{ color: "#6d7175", fontSize: 13 }}>
                {draftSelectedProductIds.length}/25 products selected
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowBrowseModal(false)}
                  style={{
                    border: "1px solid #c9cccf",
                    borderRadius: 8,
                    padding: "8px 12px",
                    background: "white",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={draftSelectedProductIds.length === 0}
                  onClick={() => {
                    setSelectedProductIds(draftSelectedProductIds);
                    setShowBrowseModal(false);
                  }}
                  style={{
                    border: "1px solid #c9cccf",
                    borderRadius: 8,
                    padding: "8px 12px",
                    background:
                      draftSelectedProductIds.length === 0 ? "#f1f2f3" : "#202223",
                    color: draftSelectedProductIds.length === 0 ? "#6d7175" : "white",
                    cursor: draftSelectedProductIds.length === 0 ? "not-allowed" : "pointer",
                    fontWeight: 700,
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};


