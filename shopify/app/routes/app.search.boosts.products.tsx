import { useEffect, useMemo, useState } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData, useLocation, useNavigate, useParams } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { ROUTES, getRouteWithParams } from "../constants/routes";

type StoreProduct = {
  id: string;
  numericId: string;
  title: string;
  vendor: string;
  status: string;
  tags: string[];
  productType: string;
  createdAt: string;
  updatedAt: string;
  totalInventory: number;
  imageUrl: string;
};

const BOOST_KEY_PREFIX = "boost_product_";
const BOOST_TERMS_PREFIX = "boost_terms_";

function getNumericIdFromGid(gid: string): string {
  // Example: gid://shopify/Product/7855687008304
  const parts = gid.split("/");
  return parts[parts.length - 1] || gid;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(
    `#graphql
      query BoostProductsIndex($first: Int!) {
        products(first: $first) {
          edges {
            node {
              id
              title
              vendor
              status
              tags
              productType
              createdAt
              updatedAt
              totalInventory
              featuredImage {
                url
              }
            }
          }
        }
      }
    `,
    { variables: { first: 250 } },
  );

  const data = await response.json();

  const products: StoreProduct[] =
    data?.data?.products?.edges?.map(
      (edge: {
        node: {
          id: string;
          title: string;
          vendor: string;
          status: string;
          tags: string[];
          productType: string;
          createdAt: string;
          updatedAt: string;
          totalInventory: number;
          featuredImage: { url: string } | null;
        };
      }) => ({
        id: edge.node.id,
        numericId: getNumericIdFromGid(edge.node.id),
        title: edge.node.title,
        vendor: edge.node.vendor || "",
        status: edge.node.status || "ACTIVE",
        tags: edge.node.tags || [],
        productType: edge.node.productType || "",
        createdAt: edge.node.createdAt,
        updatedAt: edge.node.updatedAt,
        totalInventory: edge.node.totalInventory ?? 0,
        imageUrl: edge.node.featuredImage?.url || "",
      }),
    ) ?? [];

  return { products };
};

type SortField =
  | "product_title"
  | "product_created"
  | "product_updated"
  | "inventory"
  | "product_type"
  | "vendor";

export function BoostProductsIndexPage() {
  const { products } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "boosted">("all");
  const [boostedIds, setBoostedIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [hoveredProductId, setHoveredProductId] = useState<string | null>(null);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [vendorFilter, setVendorFilter] = useState<string>("");
  const [tagFilter, setTagFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [productTypeFilter, setProductTypeFilter] = useState<string>("");
  const [tagSearch, setTagSearch] = useState("");
  const [showProductTypeFilter, setShowProductTypeFilter] = useState(false);
  const [openFilter, setOpenFilter] = useState<
    "vendor" | "tag" | "status" | "productType" | "addFilter" | null
  >(null);
  const [showSort, setShowSort] = useState(false);
  const [sortField, setSortField] = useState<SortField>("product_title");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [termsByProductId, setTermsByProductId] = useState<Record<string, string[]>>(
    {},
  );

  useEffect(() => {
    // Load boosted state from sessionStorage
    const next = new Set<string>();
    for (const p of products) {
      const raw = sessionStorage.getItem(`${BOOST_KEY_PREFIX}${p.id}`);
      if (raw === "1") next.add(p.id);
    }
    setBoostedIds(next);
    // Don't auto-select boosted products; selection should be explicit.
    setSelectedIds(new Set());
  }, [products]);

  useEffect(() => {
    // Load saved search terms per product from sessionStorage.
    const next: Record<string, string[]> = {};
    for (const p of products) {
      const raw = sessionStorage.getItem(`${BOOST_TERMS_PREFIX}${p.id}`);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const cleaned = parsed
            .filter((t) => typeof t === "string")
            .map((t) => t.trim())
            .filter(Boolean);
          if (cleaned.length) next[p.id] = cleaned;
        }
      } catch {
        // ignore
      }
    }
    setTermsByProductId(next);
  }, [products]);

  const vendors = useMemo(() => {
    return Array.from(
      new Set(products.map((p) => p.vendor).filter((v) => v && v.trim())),
    ).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const tags = useMemo(() => {
    const all = products.flatMap((p) => p.tags || []);
    return Array.from(new Set(all))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [products]);

  const productTypes = useMemo(() => {
    return Array.from(
      new Set(products.map((p) => p.productType).filter((t) => t && t.trim())),
    ).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filteredTags = useMemo(() => {
    const q = tagSearch.trim().toLowerCase();
    if (!q) return tags;
    return tags.filter((t) => t.toLowerCase().includes(q));
  }, [tags, tagSearch]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = products;
    if (activeTab === "boosted") {
      // Show products that are boosted OR have saved search terms
      list = list.filter(
        (p) => boostedIds.has(p.id) || (termsByProductId[p.id]?.length ?? 0) > 0,
      );
    }
    if (vendorFilter) {
      list = list.filter((p) => p.vendor === vendorFilter);
    }
    if (tagFilter) {
      list = list.filter((p) => (p.tags || []).includes(tagFilter));
    }
    if (statusFilter) {
      list = list.filter((p) => p.status === statusFilter);
    }
    if (productTypeFilter) {
      list = list.filter((p) => p.productType === productTypeFilter);
    }
    if (!q) return list;
    return list.filter((p) => {
      return (
        p.title.toLowerCase().includes(q) ||
        (p.vendor || "").toLowerCase().includes(q)
      );
    });
  }, [
    products,
    query,
    activeTab,
    boostedIds,
    vendorFilter,
    tagFilter,
    statusFilter,
    productTypeFilter,
    termsByProductId,
  ]);

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    const copy = [...filtered];
    const cmpStr = (a: string, b: string) => a.localeCompare(b) * dir;
    const cmpNum = (a: number, b: number) => (a - b) * dir;
    copy.sort((a, b) => {
      switch (sortField) {
        case "product_title":
          return cmpStr(a.title || "", b.title || "");
        case "vendor":
          return cmpStr(a.vendor || "", b.vendor || "");
        case "product_type":
          return cmpStr(a.productType || "", b.productType || "");
        case "product_created":
          return cmpStr(a.createdAt || "", b.createdAt || "");
        case "product_updated":
          return cmpStr(a.updatedAt || "", b.updatedAt || "");
        case "inventory":
          return cmpNum(a.totalInventory || 0, b.totalInventory || 0);
        default:
          return 0;
      }
    });
    return copy;
  }, [filtered, sortField, sortDir]);

  const allVisibleSelected =
    sorted.length > 0 && sorted.every((p) => selectedIds.has(p.id));

  const toggleSelectAllVisible = () => {
    const next = new Set(selectedIds);
    if (allVisibleSelected) {
      for (const p of sorted) next.delete(p.id);
    } else {
      for (const p of sorted) next.add(p.id);
    }
    setSelectedIds(next);
  };

  const toggleSelected = (productId: string) => {
    const next = new Set(selectedIds);
    if (next.has(productId)) next.delete(productId);
    else next.add(productId);
    setSelectedIds(next);
  };

  const saveBoosts = () => {
    const nextBoosted = new Set<string>(selectedIds);
    for (const p of products) {
      const key = `${BOOST_KEY_PREFIX}${p.id}`;
      if (nextBoosted.has(p.id)) sessionStorage.setItem(key, "1");
      else sessionStorage.removeItem(key);
    }
    setBoostedIds(nextBoosted);
    setActiveTab("boosted");
  };

  const cancelSearch = () => {
    setShowSearch(false);
    setQuery("");
    setVendorFilter("");
    setTagFilter("");
    setStatusFilter("");
    setProductTypeFilter("");
    setTagSearch("");
    setShowProductTypeFilter(false);
    setOpenFilter(null);
  };

  const clearAllFilters = () => {
    setVendorFilter("");
    setTagFilter("");
    setStatusFilter("");
    setProductTypeFilter("");
    setTagSearch("");
    setShowProductTypeFilter(false);
    setOpenFilter(null);
  };

  return (
    <s-page>
      <s-box paddingBlockEnd="base">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="button"
              onClick={() => navigate(ROUTES.SEARCH)}
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
                Product boosts
              </span>
            </s-heading>
          </div>

          <button
            type="button"
            onClick={() => navigate(ROUTES.BOOSTS_PRODUCTS_NEW)}
            style={{
              border: "1px solid #202223",
              borderRadius: 999,
              padding: "6px 12px",
              background: "#202223",
              color: "white",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Create product boost
          </button>
        </div>
      </s-box>

      <s-box paddingBlockEnd="base">
        <div
          style={{
            backgroundColor: "white",
            border: "1px solid #e1e3e5",
            borderRadius: 16,
            padding: 0,
            width: "100%",
          }}
        >
          <div style={{ padding: 12 }}>
            {showSearch ? (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 10,
                    flexWrap: "nowrap",
                  }}
                >
                  <div style={{ position: "relative", flex: 1, minWidth: 260 }}>
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
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Searching in all products"
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        border: "1px solid #e1e3e5",
                        borderRadius: 10,
                        padding: "10px 10px 10px 34px",
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={cancelSearch}
                    style={{
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      color: "#202223",
                      fontWeight: 600,
                      padding: "8px 6px",
                      whiteSpace: "nowrap",
                      minWidth: 60,
                    }}
                  >
                    Cancel
                  </button>

                  <div style={{ position: "relative" }}>
                    <button
                      type="button"
                      onClick={() => setShowSort((v) => !v)}
                      aria-label="Sort"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        border: "1px solid #e1e3e5",
                        background: "white",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        width="18"
                        height="18"
                        fill="#5c5f62"
                      >
                        <path d="M6 3a1 1 0 0 1 1 1v11.586l.793-.793a1 1 0 1 1 1.414 1.414l-2.5 2.5a1 1 0 0 1-1.414 0l-2.5-2.5a1 1 0 1 1 1.414-1.414l.793.793V4a1 1 0 0 1 1-1Zm8 2a1 1 0 0 1 .707.293l2.5 2.5a1 1 0 1 1-1.414 1.414L15 8.414V16a1 1 0 1 1-2 0V8.414l-.793.793a1 1 0 1 1-1.414-1.414l2.5-2.5A1 1 0 0 1 14 5Z" />
                      </svg>
                    </button>
                    {showSort ? (
                      <div
                        style={{
                          position: "absolute",
                          right: 0,
                          top: 38,
                          width: 220,
                          background: "white",
                          border: "1px solid #e1e3e5",
                          borderRadius: 12,
                          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                          padding: 10,
                          zIndex: 10,
                        }}
                      >
                        <div style={{ fontWeight: 700, marginBottom: 8 }}>
                          Sort by
                        </div>
                        {(
                          [
                            ["product_title", "Product title"],
                            ["product_created", "Product created"],
                            ["product_updated", "Product updated"],
                            ["inventory", "Inventory"],
                            ["product_type", "Product type"],
                            ["vendor", "Vendor"],
                          ] as const
                        ).map(([value, label]) => (
                          <label
                            key={value}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "6px 4px",
                              cursor: "pointer",
                            }}
                          >
                            <input
                              type="radio"
                              name="sortField"
                              checked={sortField === value}
                              onChange={() => setSortField(value)}
                            />
                            <span>{label}</span>
                          </label>
                        ))}

                        <div
                          style={{
                            borderTop: "1px solid #e1e3e5",
                            margin: "8px 0",
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setSortDir("asc")}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            border: "none",
                            background: sortDir === "asc" ? "#f6f6f7" : "transparent",
                            borderRadius: 8,
                            padding: "8px 10px",
                            cursor: "pointer",
                            fontWeight: 600,
                          }}
                        >
                          ↑ A–Z
                        </button>
                        <button
                          type="button"
                          onClick={() => setSortDir("desc")}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            border: "none",
                            background:
                              sortDir === "desc" ? "#f6f6f7" : "transparent",
                            borderRadius: 8,
                            padding: "8px 10px",
                            cursor: "pointer",
                            fontWeight: 600,
                          }}
                        >
                          ↓ Z–A
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    flexWrap: "wrap",
                    borderTop: "1px solid #f1f2f3",
                    paddingTop: 10,
                  }}
                >
                  <div style={{ position: "relative" }}>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenFilter((v) => (v === "vendor" ? null : "vendor"))
                      }
                      style={{
                        border: "1px solid #e1e3e5",
                        borderRadius: 999,
                        padding: "6px 10px",
                        background: "white",
                        cursor: "pointer",
                        fontWeight: 500,
                      }}
                    >
                      Product vendor {vendorFilter ? `· ${vendorFilter}` : ""} ▾
                    </button>
                    {openFilter === "vendor" ? (
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 36,
                          width: 220,
                          background: "white",
                          border: "1px solid #e1e3e5",
                          borderRadius: 12,
                          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                          padding: 10,
                          zIndex: 10,
                        }}
                      >
                        {vendors.length === 0 ? (
                          <div style={{ color: "#6d7175" }}>No vendors</div>
                        ) : (
                          vendors.map((v) => (
                            <label
                              key={v}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "6px 4px",
                                cursor: "pointer",
                              }}
                            >
                              <input
                                type="radio"
                                name="vendor"
                                checked={vendorFilter === v}
                                onChange={() => setVendorFilter(v)}
                              />
                              <span>{v}</span>
                            </label>
                          ))
                        )}
                        <button
                          type="button"
                          onClick={() => setVendorFilter("")}
                          style={{
                            marginTop: 8,
                            border: "none",
                            background: "transparent",
                            color: "#6d7175",
                            cursor: "pointer",
                          }}
                        >
                          Clear
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div style={{ position: "relative" }}>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenFilter((v) => (v === "tag" ? null : "tag"))
                      }
                      style={{
                        border: "1px solid #e1e3e5",
                        borderRadius: 999,
                        padding: "6px 10px",
                        background: "white",
                        cursor: "pointer",
                        fontWeight: 500,
                      }}
                    >
                      Tagged with {tagFilter ? `· ${tagFilter}` : ""} ▾
                    </button>
                    {openFilter === "tag" ? (
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 36,
                          width: 240,
                          maxHeight: 260,
                          overflowY: "auto",
                          background: "white",
                          border: "1px solid #e1e3e5",
                          borderRadius: 12,
                          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                          padding: 10,
                          zIndex: 10,
                        }}
                      >
                        <input
                          value={tagSearch}
                          onChange={(e) => setTagSearch(e.target.value)}
                          placeholder="Search tags"
                          style={{
                            width: "100%",
                            border: "1px solid #e1e3e5",
                            borderRadius: 10,
                            padding: "8px 10px",
                            marginBottom: 8,
                          }}
                        />
                        {filteredTags.length === 0 ? (
                          <div style={{ color: "#6d7175" }}>No tags</div>
                        ) : (
                          filteredTags.map((t) => (
                            <label
                              key={t}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "6px 4px",
                                cursor: "pointer",
                              }}
                            >
                              <input
                                type="radio"
                                name="tag"
                                checked={tagFilter === t}
                                onChange={() => setTagFilter(t)}
                              />
                              <span>{t}</span>
                            </label>
                          ))
                        )}
                        <button
                          type="button"
                          onClick={() => setTagFilter("")}
                          style={{
                            marginTop: 8,
                            border: "none",
                            background: "transparent",
                            color: "#6d7175",
                            cursor: "pointer",
                          }}
                        >
                          Clear
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div style={{ position: "relative" }}>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenFilter((v) => (v === "status" ? null : "status"))
                      }
                      style={{
                        border: "1px solid #e1e3e5",
                        borderRadius: 999,
                        padding: "6px 10px",
                        background: "white",
                        cursor: "pointer",
                        fontWeight: 500,
                      }}
                    >
                      Status {statusFilter ? `· ${statusFilter}` : ""} ▾
                    </button>
                    {openFilter === "status" ? (
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 36,
                          width: 220,
                          background: "white",
                          border: "1px solid #e1e3e5",
                          borderRadius: 12,
                          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                          padding: 10,
                          zIndex: 10,
                        }}
                      >
                        {["ACTIVE", "ARCHIVED", "DRAFT"].map((s) => (
                          <label
                            key={s}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "6px 4px",
                              cursor: "pointer",
                            }}
                          >
                            <input
                              type="radio"
                              name="status"
                              checked={statusFilter === s}
                              onChange={() => setStatusFilter(s)}
                            />
                            <span>{s}</span>
                          </label>
                        ))}
                        <button
                          type="button"
                          onClick={() => setStatusFilter("")}
                          style={{
                            marginTop: 8,
                            border: "none",
                            background: "transparent",
                            color: "#6d7175",
                            cursor: "pointer",
                          }}
                        >
                          Clear
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {showProductTypeFilter ? (
                    <div style={{ position: "relative" }}>
                      <button
                        type="button"
                        onClick={() =>
                          setOpenFilter((v) =>
                            v === "productType" ? null : "productType",
                          )
                        }
                        style={{
                          border: "1px solid #e1e3e5",
                          borderRadius: 999,
                          padding: "6px 10px",
                          background: "white",
                          cursor: "pointer",
                          fontWeight: 500,
                        }}
                      >
                        Product type{" "}
                        {productTypeFilter ? `· ${productTypeFilter}` : ""} ▾
                      </button>
                      {openFilter === "productType" ? (
                        <div
                          style={{
                            position: "absolute",
                            left: 0,
                            top: 36,
                            width: 240,
                            maxHeight: 260,
                            overflowY: "auto",
                            background: "white",
                            border: "1px solid #e1e3e5",
                            borderRadius: 12,
                            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                            padding: 10,
                            zIndex: 10,
                          }}
                        >
                          {productTypes.length === 0 ? (
                            <div style={{ color: "#6d7175" }}>No product types</div>
                          ) : (
                            productTypes.map((t) => (
                              <label
                                key={t}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  padding: "6px 4px",
                                  cursor: "pointer",
                                }}
                              >
                                <input
                                  type="radio"
                                  name="productType"
                                  checked={productTypeFilter === t}
                                  onChange={() => setProductTypeFilter(t)}
                                />
                                <span>{t}</span>
                              </label>
                            ))
                          )}
                          <button
                            type="button"
                            onClick={() => setProductTypeFilter("")}
                            style={{
                              marginTop: 8,
                              border: "none",
                              background: "transparent",
                              color: "#6d7175",
                              cursor: "pointer",
                            }}
                          >
                            Clear
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div style={{ position: "relative" }}>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenFilter((v) => (v === "addFilter" ? null : "addFilter"))
                      }
                      style={{
                        border: "1px solid #e1e3e5",
                        borderRadius: 999,
                        padding: "6px 10px",
                        background: "white",
                        cursor: "pointer",
                        fontWeight: 500,
                      }}
                    >
                      Add filter +
                    </button>
                    {openFilter === "addFilter" ? (
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 36,
                          width: 200,
                          background: "white",
                          border: "1px solid #e1e3e5",
                          borderRadius: 12,
                          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                          padding: 8,
                          zIndex: 10,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setShowProductTypeFilter(true);
                            setOpenFilter("productType");
                          }}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            border: "none",
                            background: "transparent",
                            borderRadius: 8,
                            padding: "8px 10px",
                            cursor: "pointer",
                            fontWeight: 500,
                          }}
                        >
                          Product type
                        </button>
                        <button
                          type="button"
                          disabled
                          style={{
                            width: "100%",
                            textAlign: "left",
                            border: "none",
                            background: "transparent",
                            borderRadius: 8,
                            padding: "8px 10px",
                            cursor: "not-allowed",
                            color: "#6d7175",
                            fontWeight: 500,
                          }}
                          title="Not implemented"
                        >
                          Publishing error
                        </button>
                        <button
                          type="button"
                          disabled
                          style={{
                            width: "100%",
                            textAlign: "left",
                            border: "none",
                            background: "transparent",
                            borderRadius: 8,
                            padding: "8px 10px",
                            cursor: "not-allowed",
                            color: "#6d7175",
                            fontWeight: 500,
                          }}
                          title="Not implemented"
                        >
                          Gift card
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {(vendorFilter ||
                    tagFilter ||
                    statusFilter ||
                    productTypeFilter ||
                    showProductTypeFilter) && (
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        color: "#6d7175",
                        padding: "6px 4px",
                        fontWeight: 500,
                      }}
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab("all")}
                    style={{
                      border: "1px solid #e1e3e5",
                      borderRadius: 999,
                      padding: "6px 12px",
                      background: activeTab === "all" ? "#f6f6f7" : "white",
                      cursor: "pointer",
                      fontWeight: 500,
                    }}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("boosted")}
                    style={{
                      border: "1px solid #e1e3e5",
                      borderRadius: 999,
                      padding: "6px 12px",
                      background: activeTab === "boosted" ? "#f6f6f7" : "white",
                      cursor: "pointer",
                      fontWeight: 500,
                    }}
                  >
                    Boosts
                  </button>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => setShowSearch(true)}
                    aria-label="Search"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      border: "1px solid #e1e3e5",
                      background: "white",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
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
                  </button>

                  <div style={{ position: "relative" }}>
                    <button
                      type="button"
                      onClick={() => setShowSort((v) => !v)}
                      aria-label="Sort"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        border: "1px solid #e1e3e5",
                        background: "white",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        width="18"
                        height="18"
                        fill="#5c5f62"
                      >
                        <path d="M6 3a1 1 0 0 1 1 1v11.586l.793-.793a1 1 0 1 1 1.414 1.414l-2.5 2.5a1 1 0 0 1-1.414 0l-2.5-2.5a1 1 0 1 1 1.414-1.414l.793.793V4a1 1 0 0 1 1-1Zm8 2a1 1 0 0 1 .707.293l2.5 2.5a1 1 0 1 1-1.414 1.414L15 8.414V16a1 1 0 1 1-2 0V8.414l-.793.793a1 1 0 1 1-1.414-1.414l2.5-2.5A1 1 0 0 1 14 5Z" />
                      </svg>
                    </button>
                    {showSort ? (
                      <div
                        style={{
                          position: "absolute",
                          right: 0,
                          top: 38,
                          width: 220,
                          background: "white",
                          border: "1px solid #e1e3e5",
                          borderRadius: 12,
                          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                          padding: 10,
                          zIndex: 10,
                        }}
                      >
                        <div style={{ fontWeight: 700, marginBottom: 8 }}>
                          Sort by
                        </div>
                        {(
                          [
                            ["product_title", "Product title"],
                            ["product_created", "Product created"],
                            ["product_updated", "Product updated"],
                            ["inventory", "Inventory"],
                            ["product_type", "Product type"],
                            ["vendor", "Vendor"],
                          ] as const
                        ).map(([value, label]) => (
                          <label
                            key={value}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "6px 4px",
                              cursor: "pointer",
                            }}
                          >
                            <input
                              type="radio"
                              name="sortField"
                              checked={sortField === value}
                              onChange={() => setSortField(value)}
                            />
                            <span>{label}</span>
                          </label>
                        ))}

                        <div
                          style={{
                            borderTop: "1px solid #e1e3e5",
                            margin: "8px 0",
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setSortDir("asc")}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            border: "none",
                            background: sortDir === "asc" ? "#f6f6f7" : "transparent",
                            borderRadius: 8,
                            padding: "8px 10px",
                            cursor: "pointer",
                            fontWeight: 600,
                          }}
                        >
                          ↑ A–Z
                        </button>
                        <button
                          type="button"
                          onClick={() => setSortDir("desc")}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            border: "none",
                            background:
                              sortDir === "desc" ? "#f6f6f7" : "transparent",
                            borderRadius: 8,
                            padding: "8px 10px",
                            cursor: "pointer",
                            fontWeight: 600,
                          }}
                        >
                          ↓ Z–A
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e1e3e5" }}>
                  {activeTab === "all" ? (
                    <th
                      style={{
                        textAlign: "left",
                        padding: "10px 10px 10px 8px",
                        width: 28,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleSelectAllVisible}
                        aria-label="Select all visible products"
                        style={{ width: 18, height: 18 }}
                      />
                    </th>
                  ) : null}
                  <th style={{ textAlign: "left", padding: "10px 8px" }}>
                    Products
                  </th>
                  <th style={{ textAlign: "left", padding: "10px 8px" }}>
                    Search terms
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((p) => {
                  const selected = selectedIds.has(p.id);
                  const boosted = boostedIds.has(p.id);
                  const titleUnderlined =
                    hoveredProductId === p.id || activeProductId === p.id;
                  const terms = termsByProductId[p.id] || [];
                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: "1px solid #f1f2f3",
                        background:
                          activeTab === "all" && selected ? "#f6f6f7" : "transparent",
                        cursor: "pointer",
                      }}
                      onMouseEnter={() => setHoveredProductId(p.id)}
                      onMouseLeave={() => setHoveredProductId(null)}
                      onClick={() => {
                        setActiveProductId(p.id);
                        navigate(
                          getRouteWithParams(ROUTES.BOOSTS_PRODUCTS_ID, {
                            id: p.numericId,
                          }),
                        );
                      }}
                    >
                      {activeTab === "all" ? (
                        <td
                          style={{
                            padding: "10px 10px 10px 8px",
                            width: 28,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleSelected(p.id)}
                            aria-label={`Select ${p.title}`}
                            onClick={(e) => e.stopPropagation()}
                            style={{ width: 18, height: 18 }}
                          />
                        </td>
                      ) : null}
                      <td style={{ padding: "10px 8px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            minWidth: 260,
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
                          <div
                            style={{
                              fontWeight: 600,
                              color: "#202223",
                              textDecoration: titleUnderlined ? "underline" : "none",
                              textUnderlineOffset: 3,
                              cursor: "pointer",
                            }}
                          >
                            {p.title}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "10px 8px" }}>
                        {terms.length > 0 ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              padding: "2px 10px",
                              borderRadius: 999,
                              border: "1px solid #e1e3e5",
                              background: "#f6f6f7",
                              color: "#202223",
                              fontWeight: 700,
                              fontSize: 12,
                              lineHeight: "20px",
                              whiteSpace: "nowrap",
                            }}
                            title={terms.join(", ")}
                          >
                            {terms[0]}
                            {terms.length > 1 ? ` +${terms.length - 1}` : ""}
                          </span>
                        ) : boosted ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
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
                        ) : (
                          <span style={{ color: "#6d7175" }}></span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {sorted.length === 0 ? (
                  <tr>
                    <td
                      colSpan={activeTab === "all" ? 3 : 2}
                      style={{ padding: 16, color: "#6d7175" }}
                    >
                      No products found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </s-box>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};

/**
 * Layout wrapper so /app/search/boosts/products/:id can render via <Outlet />.
 * fs-routes treats `app.search.boosts.products.$id.tsx` as a child route.
 */
export default function BoostProductsLayout() {
  const params = useParams();
  const location = useLocation();
  // Allow child routes like /new and /:id to render
  if (params.id || location.pathname.endsWith("/new")) return <Outlet />;
  return <BoostProductsIndexPage />;
}


