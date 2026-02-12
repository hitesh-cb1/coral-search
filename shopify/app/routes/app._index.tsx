import type {
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import type { ReactNode } from "react";
import { useLoaderData } from "react-router";
import styles from "../styles/app._index.styles.module.css";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { SyncProgressBar } from "../components/SyncProgressBar";
import { IndexingProgressBar } from "../components/IndexingProgressBar";
import { useSyncStatus } from "../hooks/useSyncStatus";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  return { shopDomain: session.shop };
};

export default function Index() {
  const { shopDomain } = useLoaderData<typeof loader>();
  const { startMonitoring, status: syncStatus } = useSyncStatus(shopDomain, false);
  const [timeFilter, setTimeFilter] = useState<"7d" | "30d" | "90d">("30d");
  const [searchesMetric, setSearchesMetric] = useState<"total" | "unique">(
    "total",
  );
  const [isDownloading, setIsDownloading] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [showProgressBar, setShowProgressBar] = useState(false);
  const [indexingStatus, setIndexingStatus] = useState<any>(null);
  const indexingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const isSyncCompleted = syncStatus?.status === 'completed' && syncStatus?.progress === 100;

  
  useEffect(() => {
    if (!showProgressBar || isIndexing) return; 

    const checkCompletion = async () => {
      try {
        const response = await fetch('/app/api/sync-status');
        if (!response.ok) return;
        
        const status = await response.json();

        if (status.status === 'completed') {
          // Don't hide progress bar automatically - keep it visible until user clicks "Index Your Data"
          setIsDownloading(false);
          return true;
        }
        return false;
      } catch (error) {
        console.error('Error checking sync status:', error);
        return false;
      }
    };

    
    const interval = setInterval(async () => {
      const shouldStop = await checkCompletion();
      if (shouldStop) {
        clearInterval(interval);
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [showProgressBar, isIndexing]);

  const dateRange = useMemo(() => {
    switch (timeFilter) {
      case "7d":
        return "Last 7 days";
      case "30d":
        return "Last 30 days";
      case "90d":
        return "Last 90 days";
      default:
        return "Last 30 days";
    }
  }, [timeFilter]);

  const openShopifyAnalytics = () => {
    window.open("https://admin.shopify.com/analytics", "_blank", "noopener,noreferrer");
  };

  const handleDownloadIndex = async () => {
    
    if (isSyncCompleted) {
      await handleIndexProducts();
      return;
    }

    try {
      setIsDownloading(true);
      setShowProgressBar(true);
      
    
      const syncResponse = await fetch(`/app/api/trigger-sync?shop=${shopDomain}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!syncResponse.ok) {
        throw new Error('Failed to trigger sync');
      }

 
      startMonitoring();
      
   
    } catch (error) {
      console.error('Error triggering sync:', error);
      alert('Failed to trigger sync. Please try again later.');
      setIsDownloading(false);
      setShowProgressBar(false);
    }
  };

  const startIndexingMonitoring = useCallback(() => {
    
    if (indexingIntervalRef.current) {
      clearInterval(indexingIntervalRef.current);
    }

    console.log('📊 Starting indexing status monitoring');
    
    const checkIndexingStatus = async () => {
      try {
        const response = await fetch('/app/api/indexing-status');
        if (!response.ok) return;
        
        const status = await response.json();
        setIndexingStatus(status);
        
        console.log('🔄 Indexing status:', status.status, status.message);
        
        if (status.status === 'completed' || status.status === 'error') {
          console.log('✅ Indexing finished, stopping monitoring');
          setIsIndexing(false);
          
          if (indexingIntervalRef.current) {
            clearInterval(indexingIntervalRef.current);
            indexingIntervalRef.current = null;
          }
          return true; 
        }
        
        return false; 
      } catch (error) {
        console.error('Error checking indexing status:', error);
        return false;
      }
    };

    indexingIntervalRef.current = setInterval(async () => {
      const shouldStop = await checkIndexingStatus();
      if (shouldStop && indexingIntervalRef.current) {
        clearInterval(indexingIntervalRef.current);
        indexingIntervalRef.current = null;
      }
    }, 2000);

    checkIndexingStatus();
  }, []);

  useEffect(() => {
    return () => {
      if (indexingIntervalRef.current) {
        clearInterval(indexingIntervalRef.current);
      }
    };
  }, []);

  const handleIndexProducts = async () => {
    try {
      setIsIndexing(true);
      // Hide sync progress bar and show indexing progress bar when user clicks "Index Your Data"
      setShowProgressBar(true);
    
      setIndexingStatus({
        shopDomain: shopDomain,
        status: 'in_progress',
        totalProducts: 0,
        processedProducts: 0,
        progress: 0,
        message: 'Starting indexing...',
      });
      
      const indexResponse = await fetch(`/app/api/generate-embeddings?shop=${shopDomain}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!indexResponse.ok) {
        throw new Error('Failed to trigger indexing');
      }

      const result = await indexResponse.json();
      console.log('✅ Indexing triggered:', result);
      startIndexingMonitoring();
      
    } catch (error) {
      console.error('Error triggering indexing:', error);
      alert('Failed to trigger indexing. Please try again later.');
      setIsIndexing(false);
      setShowProgressBar(false);
      if (indexingIntervalRef.current) {
        clearInterval(indexingIntervalRef.current);
        indexingIntervalRef.current = null;
      }
    }
  };

  const Tooltip = ({
    label,
    content,
    className,
  }: {
    label: ReactNode;
    content: string;
    className?: string;
  }) => (
    <span className={styles.tooltipWrap}>
      <span
        className={`${styles.tooltipTrigger}${className ? ` ${className}` : ""}`}
      >
        {label}
      </span>
      <span className={styles.tooltipContent} role="tooltip">
        {content}
      </span>
    </span>
  );

  const MetricDelta = ({
    direction,
    value,
  }: {
    direction: "up" | "down";
    value: string;
  }) => (
    <span
      className={`${styles.deltaBadge} ${
        direction === "up" ? styles.deltaUp : styles.deltaDown
      }`}
    >
      {direction === "up" ? "▲" : "▼"} {value}
    </span>
  );


  const MetricCard = ({
    title,
    tooltip,
    value,
    delta,
  }: {
    title: ReactNode;
    tooltip: string;
    value: string;
    delta: { direction: "up" | "down"; value: string };
  }) => (
    <div className={styles.card}>
      <s-box padding="large">
        <s-box>
          <Tooltip label={title} content={tooltip} className={styles.cardTitle} />
          <div className={styles.metricRow}>
            <span className={styles.metricNumber}>{value}</span>
            <MetricDelta direction={delta.direction} value={delta.value} />
          </div>
        </s-box>
      </s-box>
    </div>
  );

  const ListCard = ({
    title,
    tooltip,
    rows,
  }: {
    title: string;
    tooltip: string;
    rows: Array<{ label: string; value: string }>;
  }) => (
    <div className={styles.card}>
      <s-box padding="large">
        <s-grid gap="small-200">
          <Tooltip
            label={title}
            content={tooltip}
            className={`${styles.cardTitle} ${styles.underline}`}
          />
          <div className={styles.list}>
            {rows.map((r) => (
              <div key={r.label} className={styles.listRow}>
                <span className={styles.listLabel}>{r.label}</span>
                <span className={styles.listValue}>{r.value}</span>
              </div>
            ))}
          </div>
        </s-grid>
      </s-box>
    </div>
  );

  const searchTop = [
    { label: "succulent", value: "14 searches" },
    { label: "pots", value: "15 searches" },
    { label: "plants", value: "15 searches" },
  ];
  const searchNoResults = [
    { label: "bird food", value: "35 searches" },
    { label: "planters", value: "15 searches" },
    { label: "herbicide", value: "21 searches" },
  ];
  const searchLowClicks = [
    { label: "shovel", value: "13 clicks" },
    { label: "fountain", value: "36 clicks" },
    { label: "bucket", value: "2 clicks" },
  ];


  const searchesValue = useMemo(() => {
    return searchesMetric === "unique" ? "1,023" : "1,427";
  }, [searchesMetric]);

  return (
    <s-page heading="Search Ai">
      <div className={styles.container}>
        <div className={styles.welcomeCard}>
          <h1 className={styles.welcomeTitle}>Welcome to Search Setup</h1>
          <div className={styles.successMessage}>
            Your search is working! 🚀
          </div>
          
          <div className={styles.illustrationContainer}>
            <div className={styles.illustrationBackground}>
              <div className={styles.greenShapes}></div>
              <div className={`${styles.sparkle} ${styles.sparkleLeft}`}>✨</div>
              <div className={`${styles.sparkle} ${styles.sparkleRight}`}>✨</div>
            </div>
            
            <div className={styles.magnifyingGlass}>
              <div className={styles.magnifyingGlassCircle}>
                <div className={styles.happyFace}>😊</div>
              </div>
              <div className={styles.magnifyingGlassHandle}></div>
            </div>
            
            <div className={styles.cardboardBox}></div>
            
            <div className={styles.shoppingBag}>
              <div className={styles.shoppingBagHandle}></div>
              <div className={styles.checkmark}>✓</div>
              <div className={styles.loadingIndicator}></div>
            </div>
          </div>

          {showProgressBar && (
            <div style={{ marginTop: "40px", marginBottom: "24px" }}>
              {isIndexing && indexingStatus ? (
                <IndexingProgressBar indexingStatus={indexingStatus} />
              ) : (
                <SyncProgressBar 
                  shopDomain={shopDomain} 
                  autoStart={true}
                />
              )}
            </div>
          )}

          <div style={{ marginTop: showProgressBar ? "0" : "40px" }}>
            <button 
              className={styles.downloadButton}
              onClick={handleDownloadIndex}
              type="button"
              disabled={isDownloading || isIndexing}
            >
              {(isDownloading || isIndexing) ? (
                <>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 20 20" 
                    width="20" 
                    height="20" 
                    fill="currentColor"
                    style={{ marginRight: "8px", animation: "spin 1s linear infinite" }}
                  >
                    <path d="M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM2 10a8 8 0 1 1 16 0 8 8 0 0 1-16 0Z" opacity="0.25"/>
                    <path d="M10 3a7 7 0 0 1 7 7h-2a5 5 0 0 0-5-5V3Z"/>
                  </svg>
                  Processing...
                </>
              ) : isSyncCompleted ? (
                <>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 20 20" 
                    width="20" 
                    height="20" 
                    fill="currentColor"
                    style={{ marginRight: "8px" }}
                  >
                    <path d="M10 2.5a.5.5 0 0 1 .5.5v8.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L9.5 11.793V3a.5.5 0 0 1 .5-.5z"/>
                    <path d="M3.5 14a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 .5.5h10a.5.5 0 0 0 .5-.5v-2a.5.5 0 0 1 1 0v2A1.5 1.5 0 0 1 14.5 18h-10A1.5 1.5 0 0 1 3 16.5v-2a.5.5 0 0 1 .5-.5z"/>
                  </svg>
                  Index Your Data
                </>
              ) : (
                <>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 20 20" 
                    width="20" 
                    height="20" 
                    fill="currentColor"
                    style={{ marginRight: "8px" }}
                  >
                    <path d="M10 2.5a.5.5 0 0 1 .5.5v8.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L9.5 11.793V3a.5.5 0 0 1 .5-.5z"/>
                    <path d="M3.5 14a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 .5.5h10a.5.5 0 0 0 .5-.5v-2a.5.5 0 0 1 1 0v2A1.5 1.5 0 0 1 14.5 18h-10A1.5 1.5 0 0 1 3 16.5v-2a.5.5 0 0 1 .5-.5z"/>
                  </svg>
                  Download Your Data
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
