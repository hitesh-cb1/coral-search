import { useState, useEffect } from "react";
import type { LoaderFunctionArgs, HeadersFunction } from "react-router";
import { Link, useParams, useNavigate } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { useAppBridge } from "@shopify/app-bridge-react";
import { ROUTES, EXTERNAL_LINKS } from "../constants/routes";

// Default filters data (same as in _index)
const DEFAULT_FILTERS = [
  { id: "1", label: "Availability", source: "Availability", type: "Standard" },
  { id: "2", label: "Price", source: "Price", type: "Standard" },
  { id: "3", label: "Category", source: "Category", type: "Standard" },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function FilterDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const shopify = useAppBridge();
  
  const [filter, setFilter] = useState<typeof DEFAULT_FILTERS[0] | null>(null);
  const [filterLabel, setFilterLabel] = useState("");

  // Load filter data
  useEffect(() => {
    // First check if there's a modified version in sessionStorage
    const modifiedFilters = JSON.parse(sessionStorage.getItem('modifiedFilters') || '{}');
    
    // Check default filters first
    let foundFilter = DEFAULT_FILTERS.find(f => f.id === id);
    
    // If it's a default filter, check if it was modified
    if (foundFilter && id && modifiedFilters[id]) {
      foundFilter = { ...foundFilter, label: modifiedFilters[id].label };
    }
    
    // Check custom filters from sessionStorage
    if (!foundFilter) {
      const customFilters = JSON.parse(sessionStorage.getItem('customFilters') || '[]');
      foundFilter = customFilters.find((f: typeof DEFAULT_FILTERS[0]) => f.id === id);
    }
    
    if (foundFilter) {
      setFilter(foundFilter);
      setFilterLabel(foundFilter.label);
    }
  }, [id]);

  const handleSave = () => {
    if (!filterLabel || !filter) {
      shopify.toast.show("Please enter a filter label", { isError: true });
      return;
    }
    
    // Check if it's a custom filter or standard filter
    const customFilters = JSON.parse(sessionStorage.getItem('customFilters') || '[]');
    const customIndex = customFilters.findIndex((f: typeof DEFAULT_FILTERS[0]) => f.id === id);
    
    if (customIndex !== -1) {
      // Update custom filter
      customFilters[customIndex].label = filterLabel;
      sessionStorage.setItem('customFilters', JSON.stringify(customFilters));
    } else {
      // Update standard filter - store modifications separately
      const modifiedFilters = JSON.parse(sessionStorage.getItem('modifiedFilters') || '{}');
      modifiedFilters[id!] = { label: filterLabel };
      sessionStorage.setItem('modifiedFilters', JSON.stringify(modifiedFilters));
    }
    
    shopify.toast.show("Filter updated successfully!");
    navigate(ROUTES.FILTERS);
  };

  const handleRemove = () => {
    if (!filter) return;
    
    // Only allow removing custom filters
    if (filter.type === "Custom") {
      const customFilters = JSON.parse(sessionStorage.getItem('customFilters') || '[]');
      const updatedFilters = customFilters.filter((f: typeof DEFAULT_FILTERS[0]) => f.id !== id);
      sessionStorage.setItem('customFilters', JSON.stringify(updatedFilters));
      shopify.toast.show("Filter removed successfully!");
    } else {
      // For standard filters, just remove the modification
      const modifiedFilters = JSON.parse(sessionStorage.getItem('modifiedFilters') || '{}');
      delete modifiedFilters[id!];
      sessionStorage.setItem('modifiedFilters', JSON.stringify(modifiedFilters));
      shopify.toast.show("Filter reset to default!");
    }
    
    navigate(ROUTES.FILTERS);
  };

  if (!filter) {
    return (
      <s-page>
        <s-box padding="large">
          <s-text>Loading filter...</s-text>
        </s-box>
      </s-page>
    );
  }

  return (
    <s-page>
      {/* Header with Back Arrow and Filter Name */}
      <s-box paddingBlockEnd="large">
        <Link 
          to={ROUTES.FILTERS}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', textDecoration: 'none' }}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 20 20" 
            width="20" 
            height="20"
            fill="#5c5f62"
          >
            <path d="M17 9h-11.586l5.293-5.293a1 1 0 0 0-1.414-1.414l-7 7a1 1 0 0 0 0 1.414l7 7a1 1 0 0 0 1.414-1.414l-5.293-5.293h11.586a1 1 0 1 0 0-2Z"/>
          </svg>
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'black', textTransform: 'capitalize' }}>
            {filter.label}
          </span>
        </Link>
      </s-box>

      {/* Source Section */}
      <s-section>
        <s-box background="base" borderRadius="base" border="base" padding="large">
          <s-grid gap="base">
            {/* Source Label */}
            <s-text color="subdued">
              Source
            </s-text>

            {/* Source Display (Read-only for standard filters) */}
            <s-box 
              padding="small" 
              paddingInline="base"
              background="subdued" 
              borderRadius="base"
            >
              <s-text>
                <span style={{ color: '#6d7175' }}>{filter.type}: </span>
                <strong>{filter.source}</strong>
              </s-text>
            </s-box>
          </s-grid>
        </s-box>
      </s-section>

      {/* Filter Label Section */}
      <s-section>
        <s-box background="base" borderRadius="base" border="base" padding="large">
          <s-grid gap="base">
            <s-text color="subdued">
              Filter label
            </s-text>
            <input
              type="text"
              value={filterLabel}
              onChange={(e) => setFilterLabel(e.target.value)}
              placeholder=""
              style={{
                padding: '10px 12px',
                border: '1px solid #c9cccf',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box'
              }}
            />
            <s-text color="subdued">
              Customers will see this in your store's filters.
            </s-text>
          </s-grid>
        </s-box>
      </s-section>

      {/* Remove and Save Buttons */}
      <s-box paddingBlockStart="base">
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            onClick={handleRemove}
            style={{
              backgroundColor: '#b91c1c',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Remove
          </button>
          <button
            onClick={handleSave}
            disabled={filterLabel === filter.label}
            style={{
              backgroundColor: filterLabel === filter.label ? '#d1d5db' : '#008060',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: filterLabel === filter.label ? 'not-allowed' : 'pointer'
            }}
          >
            Save
          </button>
        </div>
      </s-box>

      {/* Footer Link */}
      <div style={{ textAlign: 'center', width: '100%', marginTop: '20px' }}>
        <s-text>
          Learn more about{" "}
          <a
            href={EXTERNAL_LINKS.SHOPIFY_FILTERS_HELP}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#2c6ecb', textDecoration: 'underline' }}
          >
            filters
          </a>
        </s-text>
      </div>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};

