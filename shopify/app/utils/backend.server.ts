const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

/**
 *
 * @param fn
 * @param maxRetries 
 * @param initialDelay
 * @returns 
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  initialDelay: number
): Promise<T> {
  let lastError: Error | unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(`⚠️ Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

interface RegisterShopResponse {
  success: boolean;
  shop: string;
  productsImported: number;
  message: string;
}

export interface SyncStatusResponse {
  shopDomain: string;
  status: 'idle' | 'fetching' | 'importing' | 'completed' | 'error';
  totalProducts?: number;
  processedProducts?: number;
  progress?: number;
  startedAt?: string;
  completedAt?: string | null;
  duration?: number;
  error?: string | null;
  message: string;
  sizeBucket?: string | null;
  stages?: {
    catalogSync?: {
      status: 'in_progress' | 'completed' | 'error';
      processedProducts?: number;
      totalProducts?: number;
    };
    indexing?: {
      status: 'in_progress' | 'completed' | 'error';
      processedProducts?: number;
      totalProducts?: number;
      sizeBucket?: string | null;
    };
  };
}

export async function registerShopWithBackend(
  shop: string,
  accessToken: string
): Promise<RegisterShopResponse> {
  return retryWithBackoff(async () => {
    console.log(`📤 Registering shop with backend: ${shop}`);
    const response = await fetch(`${BACKEND_URL}/shopify/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        shop,
        accessToken,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend registration failed: ${response.status} - ${errorText}`);
    }

    const data: RegisterShopResponse = await response.json();
    console.log(`✅ Backend registration successful. Products imported: ${data.productsImported}`);
    
    return data;
  }, 3, 2000);
}

export async function syncShopProducts(shop: string): Promise<RegisterShopResponse> {
  try {
    console.log(`🔄 Triggering product sync for: ${shop}`);
    
    const response = await fetch(`${BACKEND_URL}/shopify/${shop}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Product sync failed: ${response.status} - ${errorText}`);
    }

    const data: RegisterShopResponse = await response.json();
    // console.log(`✅ Product sync successful. Products synced: ${data.productsImported}`);
    
    return data;
  } catch (error) {
    console.error('❌ Error syncing products:', error);
    throw error;
  }
}

interface IndexingStatusResponse {
  status?: string; // Backend returns uppercase: "IN_PROGRESS", "COMPLETED", "FAILED", etc.
  processedProductCount?: number; // Backend field name
  totalProductCount?: number; // Backend field name
  processedProducts?: number; // Alternative field name
  totalProducts?: number; // Alternative field name
  progress?: number;
  message?: string;
  sizeBucket?: string | null;
}

// Normalize backend status to frontend format
function normalizeIndexingStatus(status?: string): 'in_progress' | 'completed' | 'error' | 'idle' {
  if (!status) return 'idle';
  
  const normalized = status.toLowerCase().trim();
  
  if (normalized === 'in_progress' || normalized === 'inprogress') {
    return 'in_progress';
  }
  if (normalized === 'completed' || normalized === 'complete') {
    return 'completed';
  }
  if (normalized === 'error' || normalized === 'failed' || normalized === 'failure') {
    return 'error';
  }
  
  return 'idle';
}

// export async function getIndexingStatus(shopDomain: string): Promise<IndexingStatusResponse | null> {
//   try {
//     const encodedShopDomain = encodeURIComponent(shopDomain);
//     const url = `${BACKEND_URL}/shopify/${encodedShopDomain}/indexing-status`;
  
//     const response = await fetch(url, {
//       method: 'GET',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//     });

//     if (!response.ok) {
//       const errorText = await response.text();
//       console.log(`⚠️ Indexing status API returned ${response.status}`);
//       console.log(`⚠️ Response body (first 200 chars): ${errorText.substring(0, 200)}`);
      
//       if (response.status === 404) {
//         console.log(`ℹ️ Indexing-status endpoint not found (404). Backend may not have this endpoint implemented yet.`);
//       }
//       return null;
//     }

//     const rawData: any = await response.json();

//     const normalizedData: IndexingStatusResponse = {
//       status: normalizeIndexingStatus(rawData.status),
//       processedProducts: rawData.processedProductCount ?? rawData.processedProducts,
//       totalProducts: rawData.totalProductCount ?? rawData.totalProducts,
//       progress: rawData.progress,
//       message: rawData.message,
//       sizeBucket: rawData.sizeBucket || null,
//     };
  
//     return normalizedData;
//   } catch (error) {
//     console.error('❌ Error calling indexing-status API:', error instanceof Error ? error.message : 'Unknown error');
//     return null;
//   }
// }

export async function getSyncStatus(shopDomain: string): Promise<SyncStatusResponse> {
  try {
    console.log(`🔄 Getting sync status for: ${shopDomain}`);
 
    const syncResponse = await fetch(`${BACKEND_URL}/shopify/${shopDomain}/sync-status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!syncResponse.ok) {
      const errorText = await syncResponse.text();
      throw new Error(`Failed to get sync status: ${syncResponse.status} - ${errorText}`);
    }

    const syncData: SyncStatusResponse = await syncResponse.json();
    // const indexingData = await getIndexingStatus(shopDomain);
    // console.log(`📊 Sync response status: ${syncResponse.ok}, Indexing data:`, indexingData ? 'received' : 'null');
    //   if (indexingData) {
    //     if (!syncData.stages) {
    //       syncData.stages = {};
    //     }
        
    //     const indexingStatus = indexingData.status || 'idle';
        
    //     syncData.stages.indexing = {
    //       status: indexingStatus === 'in_progress' ? 'in_progress' 
    //              : indexingStatus === 'completed' ? 'completed'
    //              : indexingStatus === 'error' ? 'error'
    //              : 'in_progress',
    //       processedProducts: indexingData.processedProducts,
    //       totalProducts: indexingData.totalProducts,
    //       sizeBucket: indexingData.sizeBucket || null, 
    //     };
       
        
    //     if (indexingStatus === 'in_progress') {
          
    //       if (syncData.status === 'completed') {
    //         syncData.status = 'importing';
    //       }
       
    //       if (indexingData.processedProducts !== undefined && indexingData.totalProducts !== undefined) {
    //         syncData.processedProducts = indexingData.processedProducts;
    //         syncData.totalProducts = indexingData.totalProducts;
    //       }
          
    //       // Update sizeBucket if available
    //       if (indexingData.sizeBucket !== undefined && indexingData.sizeBucket !== null) {
    //         syncData.sizeBucket = indexingData.sizeBucket;
    //       }
    //     }
    //   }

    return syncData;
  } catch (error) {
    console.error('❌ Error getting sync status:', error);
    throw error;
  }
}

export interface IndexingStatusResponse {
  shopDomain: string;
  status: 'idle' | 'in_progress' | 'completed' | 'error';
  totalProducts?: number;
  processedProducts?: number;
  progress?: number;
  startedAt?: string | null;
  completedAt?: string | null;
  duration?: number;
  message: string;
  error?: string | null;
}

export async function generateEmbeddings(shopDomain: string): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`🔄 Triggering embeddings generation for: ${shopDomain}`);
    
    const response = await fetch(`${BACKEND_URL}/shopify/${shopDomain}/generate-embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Embeddings generation failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`✅ Embeddings generation triggered successfully`);
    
    return data;
  } catch (error) {
    console.error('❌ Error generating embeddings:', error);
    throw error;
  }
}

export async function getIndexingStatus(shopDomain: string): Promise<IndexingStatusResponse> {
  try {
    console.log(`🔄 Getting indexing status for: ${shopDomain}`);
 
    // Try the indexing-status endpoint (common pattern)
    const response = await fetch(`${BACKEND_URL}/shopify/${shopDomain}/indexing-status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get indexing status: ${response.status} - ${errorText}`);
    }

    const data: IndexingStatusResponse = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Error getting indexing status:', error);
    throw error;
  }
}
