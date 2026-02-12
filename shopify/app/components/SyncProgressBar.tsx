import { useEffect, useState } from 'react';
import { useSyncStatus } from '../hooks/useSyncStatus';
import styles from './SyncProgressBar.module.css';

interface SyncProgressBarProps {
  shopDomain: string;
  autoStart?: boolean;
  indexingStatus?: any;
}

export function SyncProgressBar({ shopDomain, autoStart = false, indexingStatus }: SyncProgressBarProps) {
  const { status, isMonitoring, startMonitoring, checkStatus } = useSyncStatus(shopDomain, autoStart);
  
  // Use indexing status if available, otherwise use sync status
  const displayStatus = indexingStatus || status;
  const [showCompleted, setShowCompleted] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasShownOnce, setHasShownOnce] = useState(false);
  const [completionTime, setCompletionTime] = useState<number | null>(null);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [previousStatus, setPreviousStatus] = useState<any>(null);
  const [maxDuration, setMaxDuration] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    if (autoStart) {
      const initTimer = setTimeout(() => {
        setIsInitializing(false);
        // Check if indexing status is already available
        const currentStatus = displayStatus || status;
        if (currentStatus && ['fetching', 'importing', 'in_progress'].includes(currentStatus.status)) {
          setHasShownOnce(true);
          if (!displayStatus) {
            // Only start monitoring if it's sync status, not indexing
            startMonitoring();
          }
        } else if (currentStatus && currentStatus.status === 'completed') {
          setHasShownOnce(true);
        } else {
          // Check sync status if no indexing status
          checkStatus().then((syncStatus) => {
            if (syncStatus && ['fetching', 'importing'].includes(syncStatus.status)) {
              setHasShownOnce(true);
              startMonitoring();
            } else if (syncStatus && syncStatus.status === 'completed') {
              setHasShownOnce(true);
            } else if (syncStatus && syncStatus.status === 'idle') {
              setTimeout(() => {
                checkStatus().then((delayedStatus) => {
                  if (delayedStatus && ['fetching', 'importing'].includes(delayedStatus.status)) {
                    setHasShownOnce(true);
                    startMonitoring();
                  }
                });
              }, 2000);
            }
          });
        }
      }, 300); 
      return () => clearTimeout(initTimer);
    } else {
      setIsInitializing(false);
    }
  }, [autoStart, checkStatus, startMonitoring, displayStatus, status]);

  useEffect(() => {
    const currentStatus = displayStatus || status;
    if (currentStatus && ['fetching', 'importing', 'completed', 'in_progress'].includes(currentStatus.status)) {
      setHasShownOnce(true);
      setIsInitializing(false); // Make sure it's not initializing if we have a status
    }
  }, [status, displayStatus]);

  // Helper function to check if both sync and indexing are completed
  const isFullyCompleted = () => {
    // Use indexing status if available, otherwise use sync status
    const currentStatus = displayStatus || status;
    if (!currentStatus) return false;
    
    // Check if main sync is completed
    const mainSyncCompleted = currentStatus.status === 'completed';
    
    // Check if indexing is completed
    // Check both top-level indexing.status and stages.indexing.status
    const indexingStatusCheck = (currentStatus as any).indexing?.status || currentStatus.stages?.indexing?.status;
    const indexingCompleted = 
      indexingStatusCheck === 'COMPLETED' || 
      indexingStatusCheck === 'completed' ||
      indexingStatusCheck === 'COMPLETE' ||
      indexingStatusCheck === 'complete';
    
    // Both must be completed for full completion
    return mainSyncCompleted && indexingCompleted;
  };

  useEffect(() => {
    // Keep progress bar visible when there's status
    const currentStatus = displayStatus || status;
    if (currentStatus) {
      setShowCompleted(true);
      
      // Track maximum duration seen so far
      const catalogSyncDuration = currentStatus.duration || 0;
      const indexingDuration = currentStatus.indexing?.duration || 0;
      const currentMax = Math.max(catalogSyncDuration, indexingDuration);
      
      // Check if both sync and indexing are completed
      const fullyCompleted = isFullyCompleted();
      
      // Update max duration if we see a larger value or if both are completed
      if (fullyCompleted && currentMax > 0) {
        // When both are completed, use the actual max duration from response
        setMaxDuration(currentMax);
      } else if (currentMax > maxDuration) {
        setMaxDuration(currentMax);
      }
      
      // Initialize start time when sync or indexing starts
      if ((currentStatus.status === 'fetching' || currentStatus.status === 'importing' || currentStatus.status === 'in_progress') && startTime === null) {
        setStartTime(Date.now());
        setDisplayProgress(0);
        setAnimationProgress(0);
      }
      
      // Reset if this is a new sync/indexing (status changed from idle/completed to fetching/importing/in_progress)
      if (previousStatus) {
        const wasIdleOrCompleted = previousStatus.status === 'idle' || previousStatus.status === 'completed';
        const isNewSync = currentStatus.status === 'fetching' || currentStatus.status === 'importing' || currentStatus.status === 'in_progress';
        if (wasIdleOrCompleted && isNewSync) {
          setMaxDuration(0);
          setStartTime(Date.now());
          setAnimationProgress(0);
          setDisplayProgress(0);
        }
      }
      
      // If indexing status exists and is in_progress, reset display progress to match actual progress
      if (displayStatus && displayStatus.status === 'in_progress') {
        const actualProgress = displayStatus.progress || 
          (displayStatus.totalProducts && displayStatus.processedProducts 
            ? Math.round((displayStatus.processedProducts / displayStatus.totalProducts) * 100) 
            : 0);
        setDisplayProgress(actualProgress);
      }
      
      // If both sync and indexing are completed, record completion time
      if (fullyCompleted && completionTime === null) {
        setCompletionTime(Date.now());
      } else if (!fullyCompleted) {
        setCompletionTime(null);
      }
      
      setPreviousStatus(currentStatus);
    }
  }, [status, displayStatus, completionTime, previousStatus, maxDuration, startTime]);

  // Animate progress bar over the max duration time
  useEffect(() => {
    if (!startTime || maxDuration === 0) return;

    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000; // elapsed time in seconds
      const progress = Math.min((elapsed / maxDuration) * 100, 100);
      setAnimationProgress(progress);
      setDisplayProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 50); // Update every 50ms for smooth animation

    return () => clearInterval(interval);
  }, [startTime, maxDuration]);

  // Continue monitoring for 12 seconds after completion
  useEffect(() => {
    if (completionTime !== null && isMonitoring) {
      const elapsed = Date.now() - completionTime;
      const remaining = 12000 - elapsed;
      
      if (remaining > 0) {
        // Continue checking status until 12 seconds have passed
        const interval = setInterval(() => {
          checkStatus();
        }, 2000);
        
        const timer = setTimeout(() => {
          clearInterval(interval);
        }, remaining);
        
        return () => {
          clearInterval(interval);
          clearTimeout(timer);
        };
      }
    }
  }, [completionTime, isMonitoring, checkStatus]);

  const getCounts = () => {
    // Use indexing status if available, otherwise use sync status
    const currentStatus = displayStatus || status;
    if (!currentStatus) return null;

    // Always prefer main counts (processedProducts/totalProducts)
    if (currentStatus.totalProducts !== undefined && currentStatus.processedProducts !== undefined) {
      return { processed: currentStatus.processedProducts, total: currentStatus.totalProducts };
    }

    // Fallback: stage-specific fields (backend may report these instead)
    const catalog = currentStatus.stages?.catalogSync;
    if (catalog?.totalProducts !== undefined && catalog?.processedProducts !== undefined) {
      return { processed: catalog.processedProducts, total: catalog.totalProducts };
    }

    // Only use indexing counts if main sync counts are not available
    const indexing = currentStatus.stages?.indexing;
    if (indexing?.totalProducts !== undefined && indexing?.processedProducts !== undefined) {
      return { processed: indexing.processedProducts, total: indexing.totalProducts };
    }

    // Last resort: use indexing object counts
    const indexingProcessed = currentStatus.indexing?.processedProductCount || currentStatus.indexing?.processedProducts;
    const indexingTotal = currentStatus.indexing?.totalProductCount || currentStatus.indexing?.totalProducts;
    if (indexingTotal !== undefined && indexingProcessed !== undefined) {
      return { processed: indexingProcessed, total: indexingTotal };
    }

    return null;
  };

  const getProgress = () => {
    // Prioritize indexing status if available, otherwise use sync status
    const currentStatus = displayStatus || status;
    if (!currentStatus) return 0;
    
    // If indexing status exists, use it directly (don't check sync completion)
    if (displayStatus) {
      // For indexing, always use its progress value
      if (displayStatus.progress !== undefined && displayStatus.progress >= 0 && displayStatus.progress <= 100) {
        return displayStatus.progress;
      }
      // Or calculate from indexing counts
      if (displayStatus.totalProducts !== undefined && displayStatus.processedProducts !== undefined) {
        return Math.round((displayStatus.processedProducts / displayStatus.totalProducts) * 100);
      }
      // If indexing is completed, show 100%
      if (displayStatus.status === 'completed') {
        return 100;
      }
      return 0;
    }
    
    // For sync status only (when no indexing status)
    // If both are completed, show 100%
    if (isFullyCompleted()) {
      return 100;
    }
    
    // Always use main progress first (processedProducts/totalProducts)
    if (currentStatus.totalProducts !== undefined && currentStatus.processedProducts !== undefined) {
      return Math.round((currentStatus.processedProducts / currentStatus.totalProducts) * 100);
    }
    
    // Use main progress value if available
    if (currentStatus.progress !== undefined && currentStatus.progress >= 0 && currentStatus.progress <= 100) {
      return currentStatus.progress;
    }
   
    // Calculate from counts (which now prioritizes main sync)
    const counts = getCounts();
    if (counts && counts.total > 0) {
      const calculated = Math.round((counts.processed / counts.total) * 100);
      return Math.max(0, Math.min(100, calculated));
    }
  
    if (currentStatus.status === 'idle' || currentStatus.status === 'error') {
      return 0;
    }
    
    return 0;
  };

  const actualProgress = getProgress();
  const progress = Math.round(displayProgress); // Round to whole number, no decimals
  const counts = getCounts();

  // Get sizeBucket from status (prioritize indexing stage, then top-level)
  const getSizeBucket = () => {
    const currentStatus = displayStatus || status;
    if (!currentStatus) return null;
    return currentStatus.stages?.indexing?.sizeBucket ?? currentStatus.sizeBucket ?? null;
  };

  const sizeBucket = getSizeBucket();

  const getProgressColor = () => {
    const currentStatus = displayStatus || status;
    
    // Red for errors
    if (currentStatus?.status === 'error') {
      return 'linear-gradient(90deg, #b42318 0%, #d92d20 100%)';
    }

    // Green for all other states (fetching, importing, completed, in_progress)
    return 'linear-gradient(90deg, #1a7f37 0%, #2ea043 100%)';
  };

  const getStatusIcon = () => {
    // Check if both sync and indexing are completed
    if (isFullyCompleted()) {
      return '✅';
    }
    
    const currentStatus = displayStatus || status;
    switch (currentStatus?.status) {
      case 'fetching':
        return '🔄';
      case 'importing':
        return '📥';
      case 'completed':
        // Main sync completed but indexing might still be in progress
        return '⏳';
      case 'error':
        return '❌';
      default:
        return '⏸️';
    }
  };

  const getStatusMessage = () => {
    const currentStatus = displayStatus || status;
    if (!currentStatus) return '';
    
    // Check if indexing is in progress
    const indexingStatusCheck = currentStatus.indexing?.status || currentStatus.stages?.indexing?.status;
    const isIndexingInProgress = 
      indexingStatusCheck === 'IN_PROGRESS' || 
      indexingStatusCheck === 'in_progress' ||
      indexingStatusCheck === 'INPROGRESS';
    
    if (isIndexingInProgress) {
      return 'Indexing products...';
    }
    
    if (currentStatus.status === 'fetching') {
      return currentStatus.message || 'Fetching products...';
    }
    
    if (currentStatus.status === 'importing') {
      return currentStatus.message || 'Importing products to database...';
    }
    
    if (currentStatus.status === 'in_progress') {
      return currentStatus.message || 'Indexing products...';
    }
    
    return currentStatus.message || '';
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0s';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const getCombinedDuration = () => {
    const currentStatus = displayStatus || status;
    if (!currentStatus) return undefined;
    
    const catalogSyncDuration = currentStatus.duration || 0;
    const indexingDuration = currentStatus.indexing?.duration || 0;
    const currentMax = Math.max(catalogSyncDuration, indexingDuration);
    
    // Use the tracked maxDuration state to avoid switching between values
    // This ensures we always show the maximum duration we've seen
    const durationToShow = Math.max(maxDuration, currentMax);
    
    return durationToShow > 0 ? durationToShow : undefined;
  };

  const currentStatus = displayStatus || status;
  
  // If we have indexing status, always show the progress bar (don't hide it automatically)
  if (displayStatus) {
    // Only hide if indexing is truly idle and we haven't started yet
    if (displayStatus.status === 'idle' && !hasShownOnce) {
      return null;
    }
    // For indexing status, skip other hide conditions and continue to render
    // This ensures progress bar stays visible during indexing (in_progress, completed, error)
  } else {
    // For sync status (when no indexing status), apply normal hide conditions
    if (isInitializing) {
      if (!currentStatus || (currentStatus.status === 'idle' && !hasShownOnce)) {
        return null;
      }
    }

    if (!currentStatus) {
      return null;
    }

    if (!hasShownOnce && currentStatus.status === 'idle') {
      return null;
    }

    if (currentStatus.status === 'idle' && hasShownOnce) {
      return null;
    }

    // Keep progress bar visible even after completion - removed auto-hide logic
    if (!['fetching', 'importing', 'completed', 'error', 'in_progress'].includes(currentStatus.status)) {
      return null;
    }
  }

  return (
    <div className={styles.syncProgressContainer}>
      <s-box padding="base" borderRadius="base">
        <div className={styles.syncProgressCard}>
          <div className={styles.syncHeader}>
            <div className={styles.syncTitle}>
              <span className={styles.statusIcon}>{getStatusIcon()}</span>
              <s-heading>Product Sync Status</s-heading>
            </div>
            {isMonitoring && (
              <span className={styles.monitoringBadge}>Monitoring</span>
            )}
          </div>

          <div className={styles.syncContent}>
            
            <div className={styles.statusMessage}>
              <s-text>{getStatusMessage()}</s-text>
            </div>

        
            {(currentStatus.status === 'fetching' || currentStatus.status === 'importing' || currentStatus.status === 'completed' || currentStatus.status === 'in_progress') && (
              <div className={styles.progressSection}>
                <div className={styles.progressBar}>
                  <div 
                    className={`${styles.progressFill} ${isFullyCompleted() ? styles.progressComplete : ''}`}
                    style={{ 
                      width: `${progress}%`,
                      background: getProgressColor()
                    }}
                  />
                </div>
                <div className={styles.progressInfo}>
                  <div className={styles.progressText}>
                    {counts ? (
                      <span>{progress}% ({counts.processed}/{counts.total} products)</span>
                    ) : (
                      <span>{progress}%</span>
                    )}
                    {sizeBucket && (
                      <span className={styles.sizeBucket}> Catalog Indexing Size: {sizeBucket}</span>
                    )}
                  </div>
                  {getCombinedDuration() !== undefined && (
                    <div className={styles.durationText}>
                      <span className={styles.durationLabel}>Duration:</span>
                      <span className={styles.durationValue}>{formatDuration(getCombinedDuration())}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </s-box>
    </div>
  );
}

