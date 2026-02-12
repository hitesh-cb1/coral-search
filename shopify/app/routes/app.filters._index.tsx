import { useState, useEffect } from "react";
import type { LoaderFunctionArgs, HeadersFunction } from "react-router";

import { useLoaderData, useNavigate } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { useAppBridge } from "@shopify/app-bridge-react";
import { ROUTES, EXTERNAL_LINKS } from "../constants/routes";

const DEFAULT_FILTERS = [
  { id: "1", label: "Availability", source: "Availability", type: "Standard" },
  { id: "2", label: "Price", source: "Price", type: "Standard" },
  { id: "3", label: "Category", source: "Category", type: "Standard" },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return { filters: DEFAULT_FILTERS };
};

export default function FiltersPage() {
  const { filters: defaultFilters } = useLoaderData<typeof loader>();
  const [filters, setFilters] = useState(defaultFilters);
  const [selectedFilter, setSelectedFilter] = useState<typeof DEFAULT_FILTERS[0] | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const shopify = useAppBridge();
  const navigate = useNavigate();

  useEffect(() => {
   
    const savedOrder = sessionStorage.getItem('filtersOrder');
    
    const modifiedFilters = JSON.parse(sessionStorage.getItem('modifiedFilters') || '{}');
    

    const updatedDefaultFilters = defaultFilters.map(filter => {
      if (modifiedFilters[filter.id]) {
        return { ...filter, label: modifiedFilters[filter.id].label };
      }
      return filter;
    });
    
    const customFilters = JSON.parse(sessionStorage.getItem('customFilters') || '[]');

    let allFilters = [...updatedDefaultFilters, ...customFilters];

    if (savedOrder) {
      const orderIds = JSON.parse(savedOrder);
      allFilters = orderIds
        .map((id: string) => allFilters.find(f => f.id === id))
        .filter(Boolean) as typeof allFilters;
     
      const newFilters = allFilters.filter(f => !orderIds.includes(f.id));
      allFilters = [...allFilters, ...newFilters];
    }
    
    setFilters(allFilters);
  }, [defaultFilters]);


  const handleFilterClick = (filter: typeof DEFAULT_FILTERS[0]) => {
    setSelectedFilter(filter);
    navigate(`/app/filters/${filter.id}`);
  };

  const handleAddFilter = () => {
    console.log("Navigating to:", ROUTES.FILTERS_NEW);
    navigate(ROUTES.FILTERS_NEW);
  };


  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newFilters = [...filters];
    const [draggedItem] = newFilters.splice(draggedIndex, 1);
    newFilters.splice(dropIndex, 0, draggedItem);
    
    setFilters(newFilters);
    

    const orderIds = newFilters.map(f => f.id);
    sessionStorage.setItem('filtersOrder', JSON.stringify(orderIds));
    
    shopify.toast.show("Filter order updated!");
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <s-page>
      <s-box paddingBlockEnd="base">
        <s-stack >
          <s-grid gridTemplateColumns="1fr auto" gap="base" alignItems="center">
            <s-heading>
              <span style={{ fontSize: '30px', fontWeight: 'bold', color: "black", textTransform: "capitalize" }}>Filters </span>
            </s-heading>
            <s-stack direction="inline" gap="small">
              <s-button variant="secondary">View</s-button>
              <button 
                onClick={handleAddFilter}
                style={{
                  backgroundColor: '#008060',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Add filter
              </button>
            </s-stack>
          </s-grid>
        </s-stack>
      </s-box>

      {/* Filters Section */}
      <s-section>
        {/* Filters Table */}
        <s-box background="base" borderRadius="base" border="base">
          <s-box padding="base">
            <s-grid gridTemplateColumns="1fr 1fr 1fr" gap="base" alignItems="center">
              <s-text color="subdued">
                <strong>Label</strong>
              </s-text>
              <s-text color="subdued">
                <strong>Source</strong>
              </s-text>
              <s-text color="subdued">
                <strong>Type</strong>
              </s-text>
            </s-grid>
          </s-box>

          <s-divider />

          {filters.map((filter, index) => (
            <div 
              key={filter.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              style={{
                opacity: draggedIndex === index ? 0.5 : 1,
                borderTop: dragOverIndex === index ? '2px solid #008060' : 'none',
                transition: 'opacity 0.2s ease'
              }}
            >
              <div
                onClick={() => handleFilterClick(filter)}
                style={{ 
                  cursor: 'pointer',
                  backgroundColor: selectedFilter?.id === filter.id ? '#f6f6f7' : 'transparent',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f6f6f7'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedFilter?.id === filter.id ? '#f6f6f7' : 'transparent'}
              >
                <s-box padding="base" paddingBlock="small">
                  <s-grid gridTemplateColumns="1fr 1fr 1fr" gap="base" alignItems="center">
                    {/* Label with Drag Handle Icon */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 20 20" 
                        width="20" 
                        height="20"
                        fill="#8c9196"
                        style={{ cursor: 'grab', flexShrink: 0 }}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <path d="M7.5 4.5c-.552 0-1 .448-1 1v.5c0 .552.448 1 1 1h.5c.552 0 1-.448 1-1v-.5c0-.552-.448-1-1-1h-.5Z"/>
                        <path d="M7.5 8.75c-.552 0-1 .448-1 1v.5c0 .552.448 1 1 1h.5c.552 0 1-.448 1-1v-.5c0-.552-.448-1-1-1h-.5Z"/>
                        <path d="M6.5 14c0-.552.448-1 1-1h.5c.552 0 1 .448 1 1v.5c0 .552-.448 1-1 1h-.5c-.552 0-1-.448-1-1v-.5Z"/>
                        <path d="M12 4.5c-.552 0-1 .448-1 1v.5c0 .552.448 1 1 1h.5c.552 0 1-.448 1-1v-.5c0-.552-.448-1-1-1h-.5Z"/>
                        <path d="M11 9.75c0-.552.448-1 1-1h.5c.552 0 1 .448 1 1v.5c0 .552-.448 1-1 1h-.5c-.552 0-1-.448-1-1v-.5Z"/>
                        <path d="M12 13c-.552 0-1 .448-1 1v.5c0 .552.448 1 1 1h.5c.552 0 1-.448 1-1v-.5c0-.552-.448-1-1-1h-.5Z"/>
                      </svg>
                      <s-text><strong>{filter.label}</strong></s-text>
                    </div>

                   
                    <s-text color="subdued">{filter.source}</s-text>

                    <s-text color="subdued">{filter.type}</s-text>
                  </s-grid>
                </s-box>
              </div>
              {index < filters.length - 1 && <s-divider />}
            </div>
          ))}
        </s-box>
      </s-section>

      <div style={{ textAlign: 'center', width: '100%', marginTop: '10px' }}>
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
