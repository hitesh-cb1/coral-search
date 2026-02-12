import { useState, useEffect, useCallback, useRef } from 'react';
import type { SyncStatusResponse } from '../utils/backend.server';
import { useWebSocket, type SyncProgressEvent, type SyncCompletedEvent, type IndexingProgressEvent } from './useWebSocket';

export function useSyncStatus(shopDomain: string, autoStart = false, useWebSocketUpdates = true) {
  const [status, setStatus] = useState<SyncStatusResponse | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const monitoringRef = useRef(false);

  const checkStatus = useCallback(async () => {
    try {
      const response = await fetch('/app/api/sync-status');

      if (!response.ok) {
        throw new Error('Failed to fetch sync status');
      }

      const data: SyncStatusResponse = await response.json();
      setStatus(data);

      if (data.status !== 'idle') {
        console.log('🔄 Sync status:', data.status, data.message);
      }

      return data;
    } catch (error) {
      console.error('❌ Failed to check sync status:', error);
      return null;
    }
  }, []);
  const isFullyCompleted = useCallback((status: SyncStatusResponse | null): boolean => {
    if (!status) return false;
    
    // Check if sync is completed (only check sync status, not indexing)
    return status.status === 'completed';
  }, []);

  // WebSocket handlers
  const handleSyncProgress = useCallback((event: SyncProgressEvent) => {
    if (event.shopDomain !== shopDomain) return;
    
    setStatus({
      shopDomain: event.shopDomain,
      status: event.status,
      progress: event.progress,
      processedProducts: event.processed,
      totalProducts: event.total,
      message: event.message || '',
    } as SyncStatusResponse);
  }, [shopDomain]);

  const handleSyncCompleted = useCallback((event: SyncCompletedEvent) => {
    if (event.shopDomain !== shopDomain) return;
    
    setStatus({
      shopDomain: event.shopDomain,
      status: 'completed',
      processedProducts: event.productsImported,
      totalProducts: event.totalProducts,
      progress: 100,
      message: `Sync completed: ${event.productsImported} products imported`,
    } as SyncStatusResponse);
  }, [shopDomain]);

  const handleIndexingProgress = useCallback((event: IndexingProgressEvent) => {
    if (event.shopDomain !== shopDomain) return;
    
    setStatus((prevStatus) => {
      if (!prevStatus) return prevStatus;
      
      return {
        ...prevStatus,
        stages: {
          ...prevStatus.stages,
          indexing: {
            status: event.status === 'IN_PROGRESS' || event.status === 'in_progress' ? 'in_progress' : 
                    event.status === 'COMPLETED' || event.status === 'completed' ? 'completed' : 'error',
            processedProducts: event.processed,
            totalProducts: event.total,
          },
        },
        processedProducts: event.processed,
        totalProducts: event.total,
        progress: event.progress,
      };
    });
  }, [shopDomain]);

  const stopMonitoring = useCallback(() => {
    console.log('🛑 Stopping sync monitoring');

    monitoringRef.current = false;
    setIsMonitoring(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Enhanced handleSyncCompleted that stops monitoring
  const handleSyncCompletedWithStop = useCallback((event: SyncCompletedEvent) => {
    handleSyncCompleted(event);
    // Stop monitoring after completion
    setTimeout(() => {
      stopMonitoring();
    }, 2000);
  }, [handleSyncCompleted, stopMonitoring]);

  // Initialize WebSocket connection
  const { isConnected: wsConnected } = useWebSocket({
    shopDomain,
    onSyncProgress: useWebSocketUpdates ? handleSyncProgress : undefined,
    onSyncCompleted: useWebSocketUpdates ? handleSyncCompletedWithStop : undefined,
    onIndexingProgress: useWebSocketUpdates ? handleIndexingProgress : undefined,
    autoConnect: useWebSocketUpdates && !!shopDomain,
  });

  const startMonitoring = useCallback(() => {
    if (monitoringRef.current) {
      console.log('⚠️ Monitoring already active, skipping');
      return;
    }

    // If WebSocket is connected and enabled, don't start polling
    if (useWebSocketUpdates && wsConnected) {
      console.log('📊 Using WebSocket for real-time updates');
      monitoringRef.current = true;
      setIsMonitoring(true);
      // Still do an initial check
      checkStatus();
      return;
    }

    console.log('📊 Starting sync monitoring (polling mode)');
    monitoringRef.current = true;
    setIsMonitoring(true);

    const startPolling = async () => {
      const currentStatus = await checkStatus();
      if (
        currentStatus &&['fetching', 'importing'].includes(currentStatus.status)
      ) {
        console.log('🔄 Active sync detected, polling started');

        let completionTime: number | null = null;
        
        intervalRef.current = setInterval(async () => {
          const latestStatus = await checkStatus();

          if (!latestStatus) return;

          // Check if sync is completed
          if (isFullyCompleted(latestStatus)) {
            if (completionTime === null) {
              // Record completion time
              completionTime = Date.now();
              console.log('✅ Sync completed, continuing to poll for 12 seconds');
            } else {
              // Check if 12 seconds have passed since completion
              const elapsed = Date.now() - completionTime;
              if (elapsed >= 12000) {
                console.log('✅ 12 seconds passed after completion, stopping polling');
                stopMonitoring();
                return;
              }
            }
            return;
          }

          // Stop on error or idle
          if (['idle', 'error'].includes(latestStatus.status)) {
            console.log('✅ Sync finished (idle/error), stopping polling');
            stopMonitoring();
          }
        }, 2000);
      } else {
        console.log('⏳ No active sync yet, polling for 15 seconds to catch sync start...');
        
        let pollCount = 0;
        const maxPolls = 7;
        let syncStarted = false;
        
        intervalRef.current = setInterval(async () => {
          pollCount++;
          const latestStatus = await checkStatus();

          if (!latestStatus) return;
          if (['fetching', 'importing'].includes(latestStatus.status)) {
            if (!syncStarted) {
              console.log('🔄 Sync started! Continuing to poll until completion...');
              syncStarted = true;
            }
          }

          // Check if sync is completed
          if (isFullyCompleted(latestStatus)) {
            if (syncStarted) {
              console.log('✅ Sync completed, stopping polling');
            } else {
              console.log('✅ Sync completed, stopping polling');
            }
            stopMonitoring();
            return;
          }

          // Stop on error or idle
          if (['error', 'idle'].includes(latestStatus.status)) {
            if (syncStarted) {
              console.log('✅ Sync finished (idle/error), stopping polling');
            } else {
              console.log('✅ No sync detected, stopping polling');
            }
            stopMonitoring();
            return;
          }

          if (pollCount >= maxPolls && !syncStarted) {
            console.log('✅ No sync detected after 15 seconds, stopping polling');
            stopMonitoring();
          }
        }, 2000);
      }
    };

    startPolling();
  }, [checkStatus, stopMonitoring, isFullyCompleted, useWebSocketUpdates, wsConnected]);

  useEffect(() => {
    if (autoStart) {
      checkStatus();
    }
  }, [autoStart, checkStatus]);
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      monitoringRef.current = false;
    };
  }, []);

  return {
    status,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    checkStatus,
  };
}
