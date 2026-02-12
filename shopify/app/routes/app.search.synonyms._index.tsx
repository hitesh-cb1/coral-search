import { useEffect, useMemo, useState, useRef } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useLocation, useNavigate, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { EXTERNAL_LINKS, ROUTES } from "../constants/routes";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return {};
};

type SynonymGroup = {
  key: string;
  title: string;
  synonyms: string[];
  isNew: boolean;
  timestamp: number;
};

type SortField = "title" | "updated";
type SortDirection = "asc" | "desc";

export default function SynonymsIndexPage() {
  useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const location = useLocation();
  const [allSynonymGroups, setAllSynonymGroups] = useState<SynonymGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSort, setShowSort] = useState(false);
  const [sortField, setSortField] = useState<SortField>("title");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const sortRef = useRef<HTMLDivElement>(null);

  const illustrationSrc =
    "https://cdn.shopify.com/s/files/1/0981/6843/9074/files/synonyms-Bov3pHiL.svg?v=1768299454";

  useEffect(() => {
    // Load all saved synonym groups from sessionStorage
    const groups: SynonymGroup[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith("synonym_group_")) {
        try {
          const value = sessionStorage.getItem(key);
          if (value) {
            const parsed = JSON.parse(value);
            const timestamp = parseInt(key.replace("synonym_group_", "")) || 0;
            groups.push({
              key,
              title: parsed.title || "",
              synonyms: parsed.synonyms || [],
              isNew: parsed.isNew || false,
              timestamp,
            });
          }
        } catch {
          // ignore invalid entries
        }
      }
    }
    setAllSynonymGroups(groups);
  }, [location.pathname]);

  // Filter and sort synonym groups
  const synonymGroups = useMemo(() => {
    let filtered = [...allSynonymGroups];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(
        (group) =>
          group.title.toLowerCase().includes(query) ||
          group.synonyms.some((syn) => syn.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortField === "title") {
        const aTitle = (a.title || "Untitled").toLowerCase();
        const bTitle = (b.title || "Untitled").toLowerCase();
        comparison = aTitle.localeCompare(bTitle);
      } else if (sortField === "updated") {
        comparison = a.timestamp - b.timestamp;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [allSynonymGroups, searchQuery, sortField, sortDirection]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      if (showSort && sortRef.current && !sortRef.current.contains(target)) {
        setShowSort(false);
      }
    };

    if (showSort) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showSort]);

  const hasGroups = allSynonymGroups.length > 0;

  return (
    <s-page>
      <s-box paddingBlockEnd="base">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
                Synonyms
              </span>
            </s-heading>
          </div>
          {hasGroups && (
            <button
              type="button"
              onClick={() => navigate("new")}
              style={{
                border: "1px solid #202223",
                borderRadius: 10,
                padding: "8px 14px",
                background: "#202223",
                color: "white",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              Create synonym group
            </button>
          )}
        </div>
      </s-box>

      <s-box paddingBlockEnd="base">
        <div style={{ maxWidth: 760, margin: "0 auto", position: "relative" }}>
          {hasGroups ? (
            <div
              style={{
                background: "white",
                border: "1px solid #e1e3e5",
                borderRadius: 14,
                overflow: "hidden",
              }}
            >
              {/* Search/Filter Bar */}
              <div
                style={{
                  padding: 16,
                  borderBottom: "1px solid #e1e3e5",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    flex: 1,
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    width="16"
                    height="16"
                    fill="#6d7175"
                  >
                    <path d="M8.5 3a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 8.5a6.5 6.5 0 1 1 11.436 4.23l3.387 3.387a.75.75 0 1 1-1.06 1.06l-3.386-3.387A6.5 6.5 0 0 1 2 8.5Z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      border: "none",
                      outline: "none",
                      flex: 1,
                      fontSize: 14,
                      color: "#202223",
                    }}
                  />
                </div>
                <div>
                  {/* Sort Button */}
                  <div ref={sortRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSort(!showSort);
                      }}
                      style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        padding: 4,
                        display: "flex",
                        alignItems: "center",
                      }}
                      aria-label="Sort"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        width="16"
                        height="16"
                        fill="#6d7175"
                      >
                        <path d="M5.293 7.293a1 1 0 0 1 1.414 0L10 10.586l3.293-3.293a1 1 0 1 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 0-1.414Z" />
                      </svg>
                    </button>
                    {showSort && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          position: "absolute",
                          right: 0,
                          top: 40,
                          background: "white",
                          border: "1px solid #e1e3e5",
                          borderRadius: 12,
                          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                          padding: 8,
                          minWidth: 200,
                          zIndex: 100,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#202223",
                            padding: "8px 10px",
                            borderBottom: "1px solid #e1e3e5",
                            marginBottom: 4,
                          }}
                        >
                          Sort by
                        </div>
                        <div style={{ padding: "4px 0" }}>
                          <label
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "6px 10px",
                              cursor: "pointer",
                              fontSize: 13,
                            }}
                          >
                            <input
                              type="radio"
                              name="sortField"
                              value="title"
                              checked={sortField === "title"}
                              onChange={() => setSortField("title")}
                              style={{ cursor: "pointer" }}
                            />
                            <span style={{ color: "#202223" }}>Group title</span>
                          </label>
                          <label
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "6px 10px",
                              cursor: "pointer",
                              fontSize: 13,
                            }}
                          >
                            <input
                              type="radio"
                              name="sortField"
                              value="updated"
                              checked={sortField === "updated"}
                              onChange={() => setSortField("updated")}
                              style={{ cursor: "pointer" }}
                            />
                            <span style={{ color: "#202223" }}>Group updated</span>
                          </label>
                        </div>
                        <div
                          style={{
                            borderTop: "1px solid #e1e3e5",
                            marginTop: 4,
                            paddingTop: 4,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setSortDirection("asc");
                              setShowSort(false);
                            }}
                            style={{
                              width: "100%",
                              textAlign: "left",
                              border: "none",
                              background:
                                sortDirection === "asc" ? "#f6f6f7" : "transparent",
                              borderRadius: 8,
                              padding: "6px 10px",
                              cursor: "pointer",
                              fontSize: 13,
                              color: "#202223",
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                            onMouseEnter={(e) => {
                              if (sortDirection !== "asc") {
                                e.currentTarget.style.backgroundColor = "#f6f6f7";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (sortDirection !== "asc") {
                                e.currentTarget.style.backgroundColor = "transparent";
                              }
                            }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              width="12"
                              height="12"
                              fill="#6d7175"
                            >
                              <path d="M5.293 7.293a1 1 0 0 1 1.414 0L10 10.586l3.293-3.293a1 1 0 1 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 0-1.414Z" />
                            </svg>
                            A-Z
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSortDirection("desc");
                              setShowSort(false);
                            }}
                            style={{
                              width: "100%",
                              textAlign: "left",
                              border: "none",
                              background:
                                sortDirection === "desc" ? "#f6f6f7" : "transparent",
                              borderRadius: 8,
                              padding: "6px 10px",
                              cursor: "pointer",
                              fontSize: 13,
                              color: "#202223",
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                            onMouseEnter={(e) => {
                              if (sortDirection !== "desc") {
                                e.currentTarget.style.backgroundColor = "#f6f6f7";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (sortDirection !== "desc") {
                                e.currentTarget.style.backgroundColor = "transparent";
                              }
                            }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              width="12"
                              height="12"
                              fill="#6d7175"
                            >
                              <path d="M14.707 12.707a1 1 0 0 1-1.414 0L10 9.414l-3.293 3.293a1 1 0 0 1-1.414-1.414l4-4a1 1 0 0 1 1.414 0l4 4a1 1 0 0 1 0 1.414Z" />
                            </svg>
                            Z-A
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Table Header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "40px 1fr 1fr",
                  gap: 16,
                  padding: "12px 16px",
                  borderBottom: "1px solid #e1e3e5",
                  backgroundColor: "#f6f6f7",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#202223",
                }}
              >
                <div>
                  <input type="checkbox" />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  Synonym group title
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    width="12"
                    height="12"
                    fill="#6d7175"
                  >
                    <path d="M5.293 7.293a1 1 0 0 1 1.414 0L10 10.586l3.293-3.293a1 1 0 1 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 0-1.414Z" />
                  </svg>
                </div>
                <div>Synonyms</div>
              </div>

              {/* Table Rows */}
              {synonymGroups.map((group) => (
                <div
                  key={group.key}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "40px 1fr 1fr",
                    gap: 16,
                    padding: "12px 16px",
                    borderBottom: "1px solid #e1e3e5",
                    fontSize: 14,
                    color: "#202223",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                  }}
                  onClick={(e) => {
                    // Don't navigate if clicking the checkbox
                    if ((e.target as HTMLElement).tagName === "INPUT") return;
                    navigate(`new?edit=${encodeURIComponent(group.key)}`);
                  }}
                  onMouseEnter={(e) => {
                    const target = e.currentTarget;
                    target.style.backgroundColor = "#f6f6f7";
                    const titleElement = target.querySelector('[data-title]') as HTMLElement;
                    if (titleElement) {
                      titleElement.style.textDecoration = "underline";
                      titleElement.style.color = "#202223";
                    }
                  }}
                  onMouseLeave={(e) => {
                    const target = e.currentTarget;
                    target.style.backgroundColor = "transparent";
                    const titleElement = target.querySelector('[data-title]') as HTMLElement;
                    if (titleElement) {
                      titleElement.style.textDecoration = "none";
                      titleElement.style.color = "#2c6ecb";
                    }
                  }}
                >
                  <div 
                    style={{ display: "flex", alignItems: "center" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input type="checkbox" />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      data-title
                      style={{
                        color: "#2c6ecb",
                        textDecoration: "none",
                        fontSize: 14,
                        cursor: "pointer",
                      }}
                    >
                      {group.title || "Untitled"}
                    </span>
                  </div>
                  <div style={{ color: "#202223" }}>
                    {group.synonyms.join(" ")}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                background: "white",
                border: "1px solid #e1e3e5",
                borderRadius: 14,
                padding: 24,
                textAlign: "center",
              }}
            >
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                <img
                  src={illustrationSrc}
                  alt=""
                  width={292}
                  height={200}
                  style={{ maxWidth: "100%", height: "auto" }}
                />
              </div>

              <div style={{ fontWeight: 700, color: "#202223", marginBottom: 8 }}>
                Add synonyms for products, pages, and articles
              </div>
              <div style={{ color: "#6d7175", fontSize: 13, marginBottom: 16 }}>
                Terms your customers are using to search on your online store don&apos;t always
                match how you describe them. Create synonym groups to help customers find
                relevant results.
              </div>

              <button
                type="button"
                onClick={() => navigate("new")}
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
                Create synonym group
              </button>
            </div>
          )}

          <div style={{ textAlign: "center", marginTop: 14, fontSize: 13 }}>
            <span style={{ color: "#6d7175" }}>Learn more about </span>
            <a
              href={EXTERNAL_LINKS.SHOPIFY_SEARCH_HELP}
              target="_blank"
              rel="noreferrer"
              style={{ color: "#2c6ecb", textDecoration: "none" }}
            >
              synonyms
            </a>
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


