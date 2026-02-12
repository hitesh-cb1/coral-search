import { useState, useEffect } from "react";
import type { LoaderFunctionArgs, HeadersFunction } from "react-router";
import { useLoaderData, useNavigate } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { useAppBridge } from "@shopify/app-bridge-react";
import { ROUTES } from "../constants/routes";

interface Product {
  id: string;
  name: string;
  image: string;
  vendor?: string;
  tags?: string[];
  status?: string;
  complementary: string;
  related: string;
  complementaryProducts?: { id: string; title: string; image: string; price: string }[];
  relatedProducts?: { id: string; title: string; image: string; price: string }[];
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { admin } = await authenticate.admin(request);
    
    // Fetch products from Shopify Admin API
    const response = await admin.graphql(
      `#graphql
        query getProducts {
          products(first: 50) {
            edges {
              node {
                id
                title
                vendor
                tags
                status
                featuredImage {
                  url
                }
              }
            }
          }
        }
      `
    );

    if (!response.ok) {
      console.error("GraphQL response not OK:", response.status, response.statusText);
      throw new Response("Failed to fetch products from Shopify", { status: response.status });
    }

    const data = await response.json();
    

    if (data.errors) {
      console.error("GraphQL errors:", data.errors);
      throw new Response(`GraphQL Error: ${data.errors.map((e: any) => e.message).join(", ")}`, { status: 500 });
    }

    if (!data.data || !data.data.products || !data.data.products.edges) {
      console.warn("No products data in response:", data);
      return { products: [], vendors: [], tags: [] };
    }
    
    // Transform products data
    const products: Product[] = data.data.products.edges.map((edge: { node: { id: string; title: string; vendor: string; tags: string[]; status: string; featuredImage: { url: string } | null } }) => ({
      id: edge.node.id,
      name: edge.node.title,
      image: edge.node.featuredImage?.url || "",
      vendor: edge.node.vendor || "",
      tags: edge.node.tags || [],
      status: edge.node.status || "ACTIVE",
      complementary: "No products",
      related: "No products"
    }));

    const vendors = Array.from(new Set(products.map(p => p.vendor).filter(Boolean))) as string[];
    const allTags = Array.from(new Set(products.flatMap(p => p.tags || [])));

    return { products, vendors, tags: allTags };
  } catch (error) {
    console.error("Error in recommendations loader:", error);
    if (error instanceof Response) {
      throw error;
    }
    
    return { products: [], vendors: [], tags: [] };
  }
};

export default function RecommendationsPage() {
  const { products: storeProducts, vendors, tags } = useLoaderData<typeof loader>();
  const [products, setProducts] = useState<Product[]>(storeProducts);
  const [activeTab, setActiveTab] = useState<"all" | "custom">("all");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<string>("");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const shopify = useAppBridge();
  const navigate = useNavigate();

  // Update products when loader data changes and load saved recommendations
  useEffect(() => {
    // Load saved recommendations from sessionStorage
    const updatedProducts = storeProducts.map(product => {
      const saved = sessionStorage.getItem(`recommendations_${product.id}`);
      if (saved) {
        const data = JSON.parse(saved);
        const complementaryCount = data.complementary?.length || 0;
        const relatedCount = data.related?.length || 0;
        return {
          ...product,
          complementary: complementaryCount > 0 ? `${complementaryCount} product${complementaryCount > 1 ? 's' : ''}` : "No products",
          related: relatedCount > 0 ? `${relatedCount} product${relatedCount > 1 ? 's' : ''}` : "No products",
          complementaryProducts: data.complementary || [],
          relatedProducts: data.related || []
        };
      }
      return product;
    });
    setProducts(updatedProducts);
  }, [storeProducts]);

  // Handle select all checkbox
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.id));
    }
    setSelectAll(!selectAll);
  };

  // Handle individual checkbox
  const handleSelectProduct = (productId: string) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
    } else {
      setSelectedProducts([...selectedProducts, productId]);
    }
  };

  // Handle add recommendations
  const handleAddRecommendations = () => {
    navigate(ROUTES.RECOMMENDATIONS_NEW);
  };

  // Handle product row click - navigate to edit recommendations page
  const handleProductClick = (product: Product) => {
    // URL encode the product ID for the route
    const encodedId = encodeURIComponent(product.id);
    navigate(`/app/recommendations/${encodedId}`);
  };

  // Filter products based on active tab, search query, and filters
  const filteredProducts = (activeTab === "custom" 
    ? products.filter(p => 
        (p.complementaryProducts && p.complementaryProducts.length > 0) || 
        (p.relatedProducts && p.relatedProducts.length > 0)
      )
    : products
  ).filter(p => {
    // Search filter
    const matchesSearch = searchQuery === "" || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    // Vendor filter
    const matchesVendor = selectedVendor === "" || p.vendor === selectedVendor;
    // Tag filter
    const matchesTag = selectedTag === "" || (p.tags && p.tags.includes(selectedTag));
    // Status filter
    const matchesStatus = selectedStatus === "" || p.status === selectedStatus;
    
    return matchesSearch && matchesVendor && matchesTag && matchesStatus;
  });

  return (
    <s-page>
      {/* Header */}
      <s-box paddingBlockEnd="base">
        <s-grid gridTemplateColumns="1fr auto" gap="base" alignItems="center">
          <s-heading>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'black' }}>
              Product recommendations
            </span>
          </s-heading>
          <button 
            onClick={handleAddRecommendations}
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
            Add recommendations
          </button>
        </s-grid>
      </s-box>

      {/* Tabs and Search/Filter Icons */}
      <s-box paddingBlockEnd="small">
        <s-grid gridTemplateColumns="1fr auto" gap="base" alignItems="center">
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0' }}>
            <button
              onClick={() => setActiveTab("all")}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '500',
                border: '1px solid #c9cccf',
                borderRadius: '8px 0 0 8px',
                backgroundColor: activeTab === "all" ? '#f6f6f7' : 'white',
                color: activeTab === "all" ? '#202223' : '#6d7175',
                cursor: 'pointer'
              }}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab("custom")}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '500',
                border: '1px solid #c9cccf',
                borderLeft: 'none',
                borderRadius: '0 8px 8px 0',
                backgroundColor: activeTab === "custom" ? '#f6f6f7' : 'white',
                color: activeTab === "custom" ? '#202223' : '#6d7175',
                cursor: 'pointer'
              }}
            >
              Custom
            </button>
          </div>

          {/* Search and Filter Icons */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Search Icon */}
            <button
              onClick={() => setShowSearchInput(!showSearchInput)}
              style={{
                padding: '8px',
                border: '1px solid #c9cccf',
                borderRadius: '8px',
                backgroundColor: showSearchInput ? '#f6f6f7' : 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20" fill="#5c5f62">
                <path d="M8 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm9.707 4.293-4.82-4.82a5.968 5.968 0 0 0 1.113-3.473 6 6 0 1 0-6 6 5.968 5.968 0 0 0 3.473-1.113l4.82 4.82a.997.997 0 0 0 1.414 0 .999.999 0 0 0 0-1.414Z"/>
              </svg>
            </button>
            
            {/* Filter Icon */}
            <button
              style={{
                padding: '8px',
                border: '1px solid #c9cccf',
                borderRadius: '8px',
                backgroundColor: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20" fill="#5c5f62">
                <path d="M3 4h14v2H3V4Zm2 5h10v2H5V9Zm2 5h6v2H7v-2Z"/>
              </svg>
            </button>
            {/* Sort Icon */}
            <button
              style={{
                padding: '8px',
                border: '1px solid #c9cccf',
                borderRadius: '8px',
                backgroundColor: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20" fill="#5c5f62">
                <path d="M7 3v10.586l-2.293-2.293-1.414 1.414 4 4a1 1 0 0 0 1.414 0l4-4-1.414-1.414L9 13.586V3H7Zm10.707 3.293-4-4a1 1 0 0 0-1.414 0l-4 4 1.414 1.414L12 5.414V16h2V5.414l2.293 2.293 1.414-1.414Z"/>
              </svg>
            </button>
          </div>
        </s-grid>
      </s-box>

      {/* Search Input - Full Width */}
      {showSearchInput && (
        <div style={{ width: '100%', marginBottom: '16px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            padding: '10px 12px',
            border: '1px solid #c9cccf',
            borderRadius: '8px',
            backgroundColor: 'white',
            width: '100%'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="16" height="16" fill="#8c9196">
              <path d="M8 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm9.707 4.293-4.82-4.82a5.968 5.968 0 0 0 1.113-3.473 6 6 0 1 0-6 6 5.968 5.968 0 0 0 3.473-1.113l4.82 4.82a.997.997 0 0 0 1.414 0 .999.999 0 0 0 0-1.414Z"/>
            </svg>
            <input
              type="text"
              placeholder="Searching in all products"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              style={{
                border: 'none',
                outline: 'none',
                fontSize: '14px',
                flex: 1,
                backgroundColor: 'transparent'
              }}
            />
            <button
              onClick={() => {
                setShowSearchInput(false);
                setSearchQuery("");
              }}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="16" height="16" fill="#8c9196">
                <path d="M10 8.586L2.929 1.515 1.515 2.929 8.586 10l-7.071 7.071 1.414 1.414L10 11.414l7.071 7.071 1.414-1.414L11.414 10l7.071-7.071-1.414-1.414L10 8.586Z"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Filters Section - Full Width */}
      <div style={{ width: '100%', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', width: '100%' }}>
          {/* Product vendor filter */}
          <div style={{ position: 'relative' }}>
            <select
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              style={{
                padding: '8px 32px 8px 12px',
                border: '1px solid #c9cccf',
                borderRadius: '8px',
                backgroundColor: 'white',
                fontSize: '14px',
                color: selectedVendor ? '#202223' : '#6d7175',
                cursor: 'pointer',
                appearance: 'none',
                minWidth: '150px'
              }}
            >
              <option value="">Product vendor</option>
              {vendors.map((vendor) => (
                <option key={vendor} value={vendor}>
                  {vendor}
                </option>
              ))}
            </select>
            <div style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="16" height="16" fill="#5c5f62">
                <path d="M5.293 7.293a1 1 0 0 1 1.414 0L10 10.586l3.293-3.293a1 1 0 1 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 0-1.414Z"/>
              </svg>
            </div>
          </div>

          {/* Tagged with filter */}
          <div style={{ position: 'relative' }}>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              style={{
                padding: '8px 32px 8px 12px',
                border: '1px solid #c9cccf',
                borderRadius: '8px',
                backgroundColor: 'white',
                fontSize: '14px',
                color: selectedTag ? '#202223' : '#6d7175',
                cursor: 'pointer',
                appearance: 'none',
                minWidth: '150px'
              }}
            >
              <option value="">Tagged with</option>
              {tags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
            <div style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="16" height="16" fill="#5c5f62">
                <path d="M5.293 7.293a1 1 0 0 1 1.414 0L10 10.586l3.293-3.293a1 1 0 1 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 0-1.414Z"/>
              </svg>
            </div>
          </div>

          {/* Status filter */}
          <div style={{ position: 'relative' }}>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                padding: '8px 32px 8px 12px',
                border: '1px solid #c9cccf',
                borderRadius: '8px',
                backgroundColor: 'white',
                fontSize: '14px',
                color: selectedStatus ? '#202223' : '#6d7175',
                cursor: 'pointer',
                appearance: 'none',
                minWidth: '150px'
              }}
            >
              <option value="">Status</option>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
              <option value="DRAFT">Draft</option>
            </select>
            <div style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="16" height="16" fill="#5c5f62">
                <path d="M5.293 7.293a1 1 0 0 1 1.414 0L10 10.586l3.293-3.293a1 1 0 1 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 0-1.414Z"/>
              </svg>
            </div>
          </div>

          {/* Add filter button */}
          <button
            style={{
              padding: '8px 12px',
              border: '1px solid #c9cccf',
              borderRadius: '8px',
              backgroundColor: 'white',
              fontSize: '14px',
              color: '#202223',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>Add filter</span>
            <span style={{ fontSize: '16px', lineHeight: '1' }}>+</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div style={{ width: '100%' }}>
      <s-section>
        <s-box background="base" borderRadius="base" border="base">
          {/* Table Header */}
          <s-box padding="base" paddingBlock="small">
            <s-grid gridTemplateColumns="40px 1fr 1fr 1fr" gap="base" alignItems="center">
              {/* Select All Checkbox */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
              </div>
              {/* Products Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <s-text color="subdued">
                  <strong>Products</strong>
                </s-text>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="12" height="12" fill="#8c9196">
                  <path d="M10 17a1 1 0 0 1-.707-.293l-6-6a1 1 0 1 1 1.414-1.414L10 14.586l5.293-5.293a1 1 0 1 1 1.414 1.414l-6 6A1 1 0 0 1 10 17Z"/>
                </svg>
              </div>
              {/* Complementary Products Header */}
              <s-text color="subdued">
                <strong>Complementary products</strong>
              </s-text>
              {/* Related Products Header */}
              <s-text color="subdued">
                <strong>Related products</strong>
              </s-text>
            </s-grid>
          </s-box>

          <s-divider />

          {/* Table Rows */}
          {filteredProducts.map((product, index) => (
            <div key={product.id}>
              <div
                onClick={() => handleProductClick(product)}
                style={{ 
                  cursor: 'pointer',
                  backgroundColor: 'transparent',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f6f6f7'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <s-box padding="base" paddingBlock="small">
                  <s-grid gridTemplateColumns="40px 1fr 1fr 1fr" gap="base" alignItems="center">
                    {/* Checkbox */}
                    <div 
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => handleSelectProduct(product.id)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                    </div>
                    {/* Product Name with Image */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {/* Product Image */}
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '4px',
                          backgroundColor: '#f6f6f7',
                          border: '1px solid #e1e3e5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden'
                        }}
                      >
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={product.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20" fill="#8c9196">
                            <path d="M2.5 4A1.5 1.5 0 0 1 4 2.5h12A1.5 1.5 0 0 1 17.5 4v12a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 16V4Zm2 9.94 2.72-2.72a.75.75 0 0 1 1.06 0l2.22 2.22 3.72-3.72a.75.75 0 0 1 1.06 0l1.22 1.22V4a.5.5 0 0 0-.5-.5H4a.5.5 0 0 0-.5.5v9.94Zm0 1.5V16a.5.5 0 0 0 .5.5h12a.5.5 0 0 0 .5-.5v-2.44l-1.72-1.72-3.72 3.72a.75.75 0 0 1-1.06 0L8.78 13.34l-3.22 3.22-.06-.12ZM12 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"/>
                          </svg>
                        )}
                      </div>
                      <s-text><strong>{product.name}</strong></s-text>
                    </div>
                    {/* Complementary Products */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {product.complementaryProducts && product.complementaryProducts.length > 0 ? (
                        <>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {product.complementaryProducts.slice(0, 3).map((cp, idx) => (
                              <div
                                key={cp.id}
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '4px',
                                  backgroundColor: '#f6f6f7',
                                  border: '1px solid #e1e3e5',
                                  overflow: 'hidden',
                                  marginLeft: idx > 0 ? '-8px' : '0',
                                  position: 'relative',
                                  zIndex: 3 - idx
                                }}
                                title={cp.title}
                              >
                                {cp.image ? (
                                  <img src={cp.image} alt={cp.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="16" height="16" fill="#8c9196" style={{ margin: '6px' }}>
                                    <path d="M2.5 4A1.5 1.5 0 0 1 4 2.5h12A1.5 1.5 0 0 1 17.5 4v12a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 16V4Z"/>
                                  </svg>
                                )}
                              </div>
                            ))}
                          </div>
                          {product.complementaryProducts.length > 3 && (
                            <s-text color="subdued">+{product.complementaryProducts.length - 3}</s-text>
                          )}
                        </>
                      ) : (
                        <s-text color="subdued">{product.complementary}</s-text>
                      )}
                    </div>
                    {/* Related Products */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {product.relatedProducts && product.relatedProducts.length > 0 ? (
                        <>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {product.relatedProducts.slice(0, 3).map((rp, idx) => (
                              <div
                                key={rp.id}
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '4px',
                                  backgroundColor: '#f6f6f7',
                                  border: '1px solid #e1e3e5',
                                  overflow: 'hidden',
                                  marginLeft: idx > 0 ? '-8px' : '0',
                                  position: 'relative',
                                  zIndex: 3 - idx
                                }}
                                title={rp.title}
                              >
                                {rp.image ? (
                                  <img src={rp.image} alt={rp.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="16" height="16" fill="#8c9196" style={{ margin: '6px' }}>
                                    <path d="M2.5 4A1.5 1.5 0 0 1 4 2.5h12A1.5 1.5 0 0 1 17.5 4v12a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 16V4Z"/>
                                  </svg>
                                )}
                              </div>
                            ))}
                          </div>
                          {product.relatedProducts.length > 3 && (
                            <s-text color="subdued">+{product.relatedProducts.length - 3}</s-text>
                          )}
                        </>
                      ) : (
                        <s-text color="subdued">{product.related}</s-text>
                      )}
                    </div>
                  </s-grid>
                </s-box>
              </div>
              {index < filteredProducts.length - 1 && <s-divider />}
            </div>
          ))}

          {/* Empty State */}
          {filteredProducts.length === 0 && (
            <s-box padding="large">
              <div style={{ textAlign: 'center' }}>
                <s-text color="subdued">No products found</s-text>
              </div>
            </s-box>
          )}
        </s-box>
      </s-section>
      </div>

      {/* Footer Link */}
      <div style={{ textAlign: 'center', width: '100%', marginTop: '20px' }}>
        <s-text>
          Learn more about{" "}
          <a
            href="https://help.shopify.com/en/manual/online-store/search-and-discovery/product-recommendations"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#2c6ecb', textDecoration: 'underline' }}
          >
            product recommendations
          </a>
        </s-text>
      </div>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
