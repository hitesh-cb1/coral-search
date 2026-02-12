(() => {
  const roots = document.querySelectorAll("[data-pradar-search]");
  if (!roots.length) return;

  function debounce(fn, wait) {
    let t;
    return (...args) => {
      window.clearTimeout(t);
      t = window.setTimeout(() => fn(...args), wait);
    };
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function highlight(query, text) {
    const q = String(query || "").trim();
    if (!q) return escapeHtml(text);
    const idx = String(text).toLowerCase().indexOf(q.toLowerCase());
    if (idx < 0) return escapeHtml(text);
    const before = escapeHtml(text.slice(0, idx));
    const match = escapeHtml(text.slice(idx, idx + q.length));
    const after = escapeHtml(text.slice(idx + q.length));
    return `${before}<strong>${match}</strong>${after}`;
  }

  function iconSvg() {
    return `
      <svg class="pradar-search__icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
        <path fill="currentColor" d="M8.5 2a6.5 6.5 0 1 0 3.955 11.66l3.693 3.694a1 1 0 0 0 1.414-1.414l-3.694-3.693A6.5 6.5 0 0 0 8.5 2Zm-4.5 6.5a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0Z" />
      </svg>
    `;
  }

  roots.forEach((root) => {
    const form = root.querySelector("form");
    const input = root.querySelector('input[name="q"]');
    const suggestions = root.querySelector(".pradar-search__suggestions");
    const results = root.querySelector(".pradar-search__results");
    const loading = root.querySelector(".pradar-search__loading");
    if (!form || !input || !suggestions) return;

    // Get configuration from data attributes
    const shopDomain = root.getAttribute("data-shop-domain") || "";
    const backendUrl = root.getAttribute("data-backend-url") || "http://localhost:3000";
    
    // Build the OpenSearch API endpoint
    const getSearchApiUrl = (query, limit = 20, offset = 0) => {
      const baseUrl = backendUrl.replace(/\/$/, ""); // Remove trailing slash
      const encodedShop = encodeURIComponent(shopDomain);
      const encodedQuery = encodeURIComponent(query);
      return `${baseUrl}/api/public/shopify/${encodedShop}/search?q=${encodedQuery}&limit=${limit}&offset=${offset}`;
    };

    let items = [];
    let activeIndex = -1;
    let isLoading = false;

    function showLoading() {
      if (loading) {
        loading.hidden = false;
        isLoading = true;
      }
    }

    function hideLoading() {
      if (loading) {
        loading.hidden = true;
        isLoading = false;
      }
    }

    function close() {
      items = [];
      activeIndex = -1;
      suggestions.innerHTML = "";
      suggestions.hidden = true;
      input.setAttribute("aria-expanded", "false");
      // Hide results when closing suggestions
      if (results) {
        results.hidden = true;
      }
    }

    function open() {
      suggestions.hidden = false;
      input.setAttribute("aria-expanded", "true");
    }

    function showError(message) {
      if (suggestions) {
        suggestions.innerHTML = `<div class="pradar-search__error">${escapeHtml(message)}</div>`;
        open();
      }
    }

    function render(query) {
      if (!items.length) {
        suggestions.innerHTML = `<div class="pradar-search__empty">No suggestions</div>`;
        open();
        return;
      }

      suggestions.innerHTML = items
        .map((it, idx) => {
          const selected = idx === activeIndex ? ' aria-selected="true"' : "";
          if (it.type === "product") {
            return `
              <div class="pradar-search__suggestion pradar-search__suggestion--product" role="option"${selected} data-idx="${idx}">
                <img class="pradar-search__thumb" src="${escapeHtml(it.image || "")}" alt="" />
                <div class="pradar-search__suggestionText">${highlight(query, it.title || "")}</div>
              </div>
            `;
          }
          return `
            <div class="pradar-search__suggestion" role="option"${selected} data-idx="${idx}">
              ${iconSvg()}
              <div class="pradar-search__suggestionText">${highlight(query, it.text || "")}</div>
            </div>
          `;
        })
        .join("");
      open();
    }

    async function fetchSuggestions(query) {
      const q = String(query || "").trim();
      if (!q) {
        close();
        return;
      }

      if (!shopDomain) {
        console.warn("[Product Radar] Shop domain not configured");
        close();
        return;
      }

      try {
        const apiUrl = getSearchApiUrl(q, 8, 0);
        
        const res = await fetch(apiUrl, {
          headers: { 
            Accept: "application/json",
            "Content-Type": "application/json"
          },
        });

        if (!res.ok) {
          throw new Error(`API request failed: ${res.status} ${res.statusText}`);
        }

        const json = await res.json();
        
        // Parse OpenSearch API response
        // Format: { shopDomain, query, total, limit, offset, results: [{ id, title, handle, images, variants, score, ... }] }
        const searchResults = json?.results || [];

        // Build items: query suggestion first, then products
        const next = [{ type: "query", text: q, value: q }];
        for (const p of searchResults) {
          // Extract product data from API response
          const productUrl = p?.handle ? `/products/${p.handle}` : "#";
          const productImage = p?.images?.[0] || p?.image || "";
          const productTitle = p?.title || "";

          next.push({
            type: "product",
            title: productTitle,
            url: productUrl,
            image: productImage,
          });
        }

        items = next;
        activeIndex = -1;
        render(q);
      } catch (error) {
        console.error("[Product Radar] Error fetching suggestions:", error);
        showError("Unable to load search suggestions. Please try again.");
      }
    }

    async function performFullSearch(query) {
      const q = String(query || "").trim();
      if (!q) {
        return;
      }

      if (!shopDomain) {
        console.warn("[Product Radar] Shop domain not configured");
        return;
      }

      // Hide results container initially
      if (results) {
        results.hidden = true;
      }

      showLoading();
      
      try {
        const apiUrl = getSearchApiUrl(q, 20, 0);
        
        const res = await fetch(apiUrl, {
          headers: { 
            Accept: "application/json",
            "Content-Type": "application/json"
          },
        });

        if (!res.ok) {
          throw new Error(`API request failed: ${res.status} ${res.statusText}`);
        }

        const json = await res.json();
        const searchResults = json?.results || [];
        const total = json?.total || 0;

        hideLoading();
        displaySearchResults(searchResults, q, total);
      } catch (error) {
        console.error("[Product Radar] Error performing search:", error);
        hideLoading();
        if (results) {
          results.innerHTML = `<div class="pradar-search__error">Unable to load search results. Please try again.</div>`;
          results.hidden = false;
        }
      }
    }

    function displaySearchResults(searchResults, query, total) {
      if (!results) return;

      if (searchResults.length === 0) {
        results.innerHTML = `
          <div class="pradar-search__empty">
            <p>No products found for "${escapeHtml(query)}"</p>
          </div>
        `;
        results.hidden = false;
        return;
      }

      const productsHtml = searchResults
        .map((item) => {
          // Product data is directly in the item (not nested in product property)
          const productUrl = item?.handle ? `/products/${item.handle}` : "#";
          const productImage = item?.images?.[0] || item?.image || "";
          const productTitle = item?.title || "";
          const productVendor = item?.vendor || "";
          const productPrice = item?.variants?.[0]?.price 
            ? `$${parseFloat(item.variants[0].price).toFixed(2)}` 
            : "";
          const productDescription = item?.description 
            ? item.description.replace(/<[^>]*>/g, "").substring(0, 100) + "..." 
            : "";
          const score = item?.score 
            ? `<span class="pradar-search__score" title="Relevance score">${(item.score * 100).toFixed(0)}% match</span>` 
            : "";

          return `
            <div class="pradar-search__result-item">
              <a href="${escapeHtml(productUrl)}" class="pradar-search__result-link">
                <div class="pradar-search__result-image-wrapper">
                  ${productImage 
                    ? `<img src="${escapeHtml(productImage)}" alt="${escapeHtml(productTitle)}" class="pradar-search__result-image" />` 
                    : `<div class="pradar-search__result-image-placeholder">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <rect x="3" y="3" width="18" height="18" rx="2" stroke-width="2"/>
                          <path d="M9 9h6v6H9z" stroke-width="2"/>
                        </svg>
                      </div>`}
                </div>
                <div class="pradar-search__result-content">
                  ${productVendor ? `<p class="pradar-search__result-vendor">${escapeHtml(productVendor)}</p>` : ""}
                  <h3 class="pradar-search__result-title">${highlight(query, productTitle)}</h3>
                  ${productDescription ? `<p class="pradar-search__result-description">${escapeHtml(productDescription)}</p>` : ""}
                  <div class="pradar-search__result-footer">
                    ${productPrice ? `<p class="pradar-search__result-price">${escapeHtml(productPrice)}</p>` : ""}
                    ${score}
                  </div>
                </div>
              </a>
            </div>
          `;
        })
        .join("");

      results.innerHTML = `
        <div class="pradar-search__results-header">
          <p>Found ${total} result${total !== 1 ? "s" : ""} for "${escapeHtml(query)}"</p>
        </div>
        <div class="pradar-search__results-grid">
          ${productsHtml}
        </div>
      `;
      results.hidden = false;
    }

    const debouncedFetch = debounce(fetchSuggestions, 120);

    suggestions.addEventListener("mousedown", (e) => {
      // Prevent blur closing before click
      e.preventDefault();
    });

    suggestions.addEventListener("click", (e) => {
      const el = e.target.closest("[data-idx]");
      if (!el) return;
      const idx = Number(el.getAttribute("data-idx"));
      const it = items[idx];
      if (!it) return;

      if (it.type === "product" && it.url) {
        window.location.href = it.url;
        return;
      }

      if (it.value) {
        input.value = it.value;
        form.requestSubmit();
      }
    });

    input.addEventListener("input", () => {
      debouncedFetch(input.value);
    });

    input.addEventListener("focus", () => {
      if (String(input.value || "").trim()) debouncedFetch(input.value);
    });

    input.addEventListener("blur", () => {
      window.setTimeout(close, 120);
    });

    input.addEventListener("keydown", (e) => {
      if (suggestions.hidden) return;
      if (e.key === "Escape") {
        close();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        activeIndex = Math.min(items.length - 1, activeIndex + 1);
        render(input.value);
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        activeIndex = Math.max(0, activeIndex - 1);
        render(input.value);
        return;
      }

      if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault();
        const it = items[activeIndex];
        if (!it) return;
        if (it.type === "product" && it.url) {
          window.location.href = it.url;
          return;
        }
        if (it.value) {
          input.value = it.value;
          form.requestSubmit();
        }
      }
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault(); // Prevent default form submission to Shopify search
      
      const query = String(input.value || "").trim();
      if (!query) {
        input.focus();
        return;
      }

      // Close suggestions if open
      close();

      // Perform full search using OpenSearch API
      performFullSearch(query);

      // eslint-disable-next-line no-console
      console.log("[Product Radar] Search submitted", { query, shopDomain });
    });
  });
})();

