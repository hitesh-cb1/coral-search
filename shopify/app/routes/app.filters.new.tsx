import { useState } from "react";
import type { LoaderFunctionArgs, HeadersFunction } from "react-router";
import { Link, useNavigate } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { useAppBridge } from "@shopify/app-bridge-react";
import { ROUTES, EXTERNAL_LINKS } from "../constants/routes";

const SOURCE_OPTIONS = [
  { value: "", label: "Select source" },
  { value: "product_type", label: "Product type" },
  { value: "vendor", label: "Vendor" },
  { value: "tag", label: "Tag" },
  { value: "option", label: "Option" },
  { value: "availability", label: "Availability" },
  { value: "price", label: "Price" },
  { value: "category", label: "Category" },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function AddFilterPage() {
  const navigate = useNavigate();
  const shopify = useAppBridge();
  const [source, setSource] = useState("");
  const [filterLabel, setFilterLabel] = useState("");

  const handleSave = () => {
    if (!source) {
      shopify.toast.show("Please select a source", { isError: true });
      return;
    }
    if (!filterLabel) {
      shopify.toast.show("Please enter a filter label", { isError: true });
      return;
    }
    
    const sourceOption = SOURCE_OPTIONS.find(opt => opt.value === source);
    const sourceLabel = sourceOption ? sourceOption.label : source;
    
    const existingFilters = JSON.parse(sessionStorage.getItem('customFilters') || '[]');
    const newFilter = {
      id: Date.now().toString(),
      label: filterLabel,
      source: sourceLabel,
      type: "Custom"
    };
    existingFilters.push(newFilter);
    sessionStorage.setItem('customFilters', JSON.stringify(existingFilters));
    
    shopify.toast.show("Filter saved successfully!");
    navigate(ROUTES.FILTERS);
  };

  return (
    <s-page>
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
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'black', textTransform: 'capitalize' }}>Add filter</span>
        </Link>
      </s-box>

      <s-section>
        <s-box background="base" borderRadius="base" border="base" padding="large">
          <s-grid gap="base">
         
            <s-text>
              <strong>Source</strong>
            </s-text>

            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                padding: '10px 12px',
                border: '1px solid #c9cccf',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: '#fff'
              }}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 20 20" 
                width="20" 
                height="20"
                fill="#8c9196"
              >
                <path fillRule="evenodd" d="M10 0c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10Zm1 16v-5h5v-2h-5v-5h-2v5h-5v2h5v5h2Z" clipRule="evenodd"/>
              </svg>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  fontSize: '14px',
                  color: source ? '#202223' : '#6d7175',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                {SOURCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Label */}
            <s-box paddingBlockStart="base">
              <s-text>
                <strong>Filter label</strong>
              </s-text>
            </s-box>
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

      <s-section>
        <s-box background="base" borderRadius="base" border="base" padding="large">
          <s-grid gap="base">
            <s-text>
              <strong>Values</strong>
            </s-text>

            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                padding: '10px 12px',
                border: '1px solid #c9cccf',
                borderRadius: '8px',
                backgroundColor: '#fafbfb'
              }}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 20 20" 
                width="16" 
                height="16"
                fill="#8c9196"
              >
                <path d="M8 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm9.707 4.293-4.82-4.82a5.968 5.968 0 0 0 1.113-3.473 6 6 0 1 0-6 6 5.968 5.968 0 0 0 3.473-1.113l4.82 4.82a.997.997 0 0 0 1.414 0 .999.999 0 0 0 0-1.414Z"/>
              </svg>
              <input
                type="text"
                placeholder="Search filter values"
                disabled={!source}
                style={{
                  border: 'none',
                  outline: 'none',
                  fontSize: '14px',
                  backgroundColor: 'transparent',
                  flex: 1,
                  color: '#6d7175'
                }}
              />
            </div>

            <s-box paddingBlockStart="large" paddingBlockEnd="large">
              <div style={{ textAlign: 'center' }}>
                
                <div style={{ marginBottom: '16px' }}>
                  <svg width="100" height="80" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="20" y="10" width="60" height="60" rx="8" fill="#f6f6f7" stroke="#e1e3e5" strokeWidth="2"/>
                    <rect x="30" y="25" width="12" height="12" rx="2" fill="#008060" stroke="#008060"/>
                    <path d="M33 31l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <rect x="48" y="28" width="24" height="6" rx="3" fill="#e1e3e5"/>
                    <rect x="30" y="42" width="12" height="12" rx="2" fill="#008060" stroke="#008060"/>
                    <path d="M33 48l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <rect x="48" y="45" width="20" height="6" rx="3" fill="#e1e3e5"/>
                  </svg>
                </div>
                <s-text>
                  <strong>Filter values will show here</strong>
                </s-text>
                <s-box paddingBlockStart="small">
                  <s-text color="subdued">Add a source to see values.</s-text>
                </s-box>
              </div>
            </s-box>
          </s-grid>
        </s-box>
      </s-section>

      {/* Save Button */}
      <s-box paddingBlockStart="base">
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <s-button 
            variant="primary" 
            onClick={handleSave}
            disabled={!source || !filterLabel}
          >
            Save
          </s-button>
        </div>
      </s-box>
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

