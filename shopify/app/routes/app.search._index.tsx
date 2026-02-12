import { useEffect, useState } from "react";
import type { LoaderFunctionArgs, HeadersFunction } from "react-router";
import { useLoaderData, useNavigate } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { ROUTES } from "../constants/routes";

const BOOST_KEY_PREFIX = "boost_product_";
const BOOST_TERMS_PREFIX = "boost_terms_";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  // Server can't access sessionStorage; placeholder counts until this is persisted in DB.
  const productBoostsCount = 0;
  const synonymsCount = 0;

  return {
    productBoostsCount,
    synonymsCount,
  };
};

export default function SearchPage() {
  const { productBoostsCount: initialBoostsCount, synonymsCount } =
    useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [clickedSection, setClickedSection] = useState<string | null>(null);
  const [productBoostsCount, setProductBoostsCount] =
    useState<number>(initialBoostsCount);

  useEffect(() => {
    // Compute boosts count from sessionStorage keys used by boosts pages.
    const boosted = new Set<string>();

    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (!key) continue;

        if (key.startsWith(BOOST_KEY_PREFIX)) {
          const productId = key.slice(BOOST_KEY_PREFIX.length);
          if (sessionStorage.getItem(key) === "1") boosted.add(productId);
        }

        if (key.startsWith(BOOST_TERMS_PREFIX)) {
          const productId = key.slice(BOOST_TERMS_PREFIX.length);
          const raw = sessionStorage.getItem(key);
          if (!raw) continue;
          try {
            const parsed = JSON.parse(raw);
            if (
              Array.isArray(parsed) &&
              parsed.some((t) => typeof t === "string" && t.trim().length > 0)
            ) {
              boosted.add(productId);
            }
          } catch {
            // ignore bad JSON
          }
        }
      }
    } catch {
      // sessionStorage may not be available in some environments
    }

    setProductBoostsCount(boosted.size);
  }, []);

  const handleProductBoostsClick = () => {
    setClickedSection("boosts");
    navigate(ROUTES.BOOSTS_PRODUCTS);
  };

  const handleSynonymsClick = () => {
    setClickedSection("synonyms");
    navigate(ROUTES.SYNONYMS);
  };

  return (
    <s-page>
      <s-box paddingBlockEnd="base">
        <s-heading>
          <span style={{ fontSize: "24px", fontWeight: "bold", color: "black" }}>
            Search
          </span>
        </s-heading>
      </s-box>

      <s-box paddingBlockEnd="base">
        <div
          style={{
            backgroundColor: "white",
            border: "1px solid #e1e3e5",
            borderRadius: "20px",
            width: "100%",
            overflow: "hidden",
            transition: "box-shadow 0.3s ease, transform 0.2s ease",
            boxShadow: hoveredSection ? "0 4px 12px rgba(0, 0, 0, 0.1)" : "none",
            transform: clickedSection ? "scale(0.98)" : "scale(1)",
          }}
          onMouseEnter={() => setHoveredSection("card")}
          onMouseLeave={() => setHoveredSection(null)}
        >
          <div
            style={{
              padding: "20px",
              display: "flex",
              alignItems: "flex-start",
              gap: "16px",
              cursor: "pointer",
              transition: "background-color 0.2s ease, transform 0.1s ease",
              backgroundColor:
                hoveredSection === "boosts"
                  ? "#f6f6f7"
                  : clickedSection === "boosts"
                    ? "#f0f0f0"
                    : "transparent",
              transform: clickedSection === "boosts" ? "scale(0.99)" : "scale(1)",
            }}
            onMouseEnter={() => setHoveredSection("boosts")}
            onMouseLeave={() => setHoveredSection(null)}
            onClick={handleProductBoostsClick}
            onMouseDown={() => setClickedSection("boosts")}
            onMouseUp={() => setTimeout(() => setClickedSection(null), 150)}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                width="24"
                height="24"
                fill="#5c5f62"
              >
                <path d="M3 3a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H3Zm1 12V5h2v10H4Zm4 0V8h2v7H8Zm4 0V6h2v9h-2Z" />
              </svg>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ marginBottom: "8px" }}>
                <strong style={{ fontSize: "16px", color: "#202223" }}>
                  Product boosts
                </strong>
              </div>
              <div>
                <span style={{ fontSize: "14px", lineHeight: "1.5", color: "#6d7175" }}>
                  Choose products to promote in your online store&apos;s search results.
                </span>
              </div>
            </div>

            <div style={{ marginLeft: "auto", flexShrink: 0, paddingLeft: "16px" }}>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "500",
                  whiteSpace: "nowrap",
                  color: "#6d7175",
                }}
              >
                {productBoostsCount} product boost
                {productBoostsCount !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <div style={{ height: "1px", backgroundColor: "#e1e3e5", margin: "0 0px" }} />

          <div
            style={{
              padding: "20px",
              display: "flex",
              alignItems: "flex-start",
              gap: "16px",
              cursor: "pointer",
              transition: "background-color 0.2s ease, transform 0.1s ease",
              backgroundColor:
                hoveredSection === "synonyms"
                  ? "#f6f6f7"
                  : clickedSection === "synonyms"
                    ? "#f0f0f0"
                    : "transparent",
              transform:
                clickedSection === "synonyms" ? "scale(0.99)" : "scale(1)",
            }}
            onMouseEnter={() => setHoveredSection("synonyms")}
            onMouseLeave={() => setHoveredSection(null)}
            onClick={handleSynonymsClick}
            onMouseDown={() => setClickedSection("synonyms")}
            onMouseUp={() => setTimeout(() => setClickedSection(null), 150)}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                width="24"
                height="24"
                fill="#5c5f62"
              >
                <path d="M3 2a1 1 0 0 0-1 1v5.586a1 1 0 0 0 .293.707l7 7a1 1 0 0 0 1.414 0l5.586-5.586a1 1 0 0 0 0-1.414l-7-7A1 1 0 0 0 9.586 2H3Zm1 1h6.586l6.293 6.293L10.293 15.293 4 9V3Z" />
                <circle cx="6.5" cy="6.5" r="1.5" fill="#5c5f62" />
              </svg>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ marginBottom: "8px" }}>
                <strong style={{ fontSize: "16px", color: "#202223" }}>
                  Synonyms
                </strong>
              </div>
              <div>
                <span style={{ fontSize: "14px", lineHeight: "1.5", color: "#6d7175" }}>
                  Add synonym groups for products, pages, and articles to help customers find relevant search results on your online store.
                </span>
              </div>
            </div>

            <div style={{ marginLeft: "auto", flexShrink: 0, paddingLeft: "16px" }}>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "500",
                  whiteSpace: "nowrap",
                  color: "#6d7175",
                }}
              >
                {synonymsCount} synonym group{synonymsCount !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      </s-box>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};


