import { useEffect, useRef, useState, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import { getWebSocketUrl } from '../utils/websocket.client';

export interface SyncProgressEvent {
  shopDomain: string;
  status: 'idle' | 'fetching' | 'importing' | 'completed' | 'error';
  progress?: number;
  processed?: number;
  total?: number;
  message?: string;
}

export interface SyncCompletedEvent {
  shopDomain: string;
  productsImported: number;
  totalProducts: number;
}

export interface ProductUpdatedEvent {
  shopDomain: string;
  product: {
    id: string;
    shopifyProductId: string;
    title: string;
    [key: string]: any;
  };
}

export interface ProductDeletedEvent {
  shopDomain: string;
  shopifyProductId: string;
}

export interface IndexingProgressEvent {
  shopDomain: string;
  status: string;
  progress?: number;
  processed?: number;
  total?: number;
}

interface UseWebSocketOptions {
  shopDomain: string;
  onSyncProgress?: (event: SyncProgressEvent) => void;
  onSyncCompleted?: (event: SyncCompletedEvent) => void;
  onProductUpdated?: (event: ProductUpdatedEvent) => void;
  onProductDeleted?: (event: ProductDeletedEvent) => void;
  onIndexingProgress?: (event: IndexingProgressEvent) => void;
  autoConnect?: boolean;
}

export function useWebSocket({
  shopDomain,
  onSyncProgress,
  onSyncCompleted,
  onProductUpdated,
  onProductDeleted,
  onIndexingProgress,
  autoConnect = true,
}: UseWebSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const hasJoinedRoom = useRef(false);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('🔌 WebSocket already connected');
      return;
    }

    const wsUrl = getWebSocketUrl();
    console.log('🔌 Connecting to WebSocket server:', wsUrl);

    const socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('✅ Connected to WebSocket server');
      setIsConnected(true);
      setConnectionError(null);

      // Join shop room after connection
      if (shopDomain && !hasJoinedRoom.current) {
        console.log(`🏠 Joining room for shop: ${shopDomain}`);
        socket.emit('join-room', { shopDomain });
        hasJoinedRoom.current = true;
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from WebSocket server');
      setIsConnected(false);
      hasJoinedRoom.current = false;
    });

    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      setConnectionError(error.message || 'Connection failed');
      setIsConnected(false);
    });

    socket.on('room-joined', (data: { room: string }) => {
      console.log('✅ Joined room:', data.room);
    });

    // Sync progress updates
    socket.on('sync:progress', (event: SyncProgressEvent) => {
      console.log('📊 Sync progress:', event);
      if (onSyncProgress) {
        onSyncProgress(event);
      }
    });

    // Sync completed
    socket.on('sync:completed', (event: SyncCompletedEvent) => {
      console.log('✅ Sync completed:', event);
      if (onSyncCompleted) {
        onSyncCompleted(event);
      }
    });

    // Product updated
    socket.on('product:updated', (event: ProductUpdatedEvent) => {
      console.log('🔄 Product updated:', event);
      if (onProductUpdated) {
        onProductUpdated(event);
      }
    });

    // Product deleted
    socket.on('product:deleted', (event: ProductDeletedEvent) => {
      console.log('🗑️ Product deleted:', event);
      if (onProductDeleted) {
        onProductDeleted(event);
      }
    });

    // Indexing progress
    socket.on('indexing:progress', (event: IndexingProgressEvent) => {
      console.log('📇 Indexing progress:', event);
      if (onIndexingProgress) {
        onIndexingProgress(event);
      }
    });

    socketRef.current = socket;
  }, [shopDomain, onSyncProgress, onSyncCompleted, onProductUpdated, onProductDeleted, onIndexingProgress]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('🔌 Disconnecting WebSocket');
      
      // Leave room before disconnecting
      if (shopDomain && hasJoinedRoom.current) {
        socketRef.current.emit('leave-room', { shopDomain });
        hasJoinedRoom.current = false;
      }
      
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, [shopDomain]);

  useEffect(() => {
    if (autoConnect && shopDomain) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, shopDomain, connect, disconnect]);

  // Re-join room if shopDomain changes
  useEffect(() => {
    if (socketRef.current?.connected && shopDomain && !hasJoinedRoom.current) {
      console.log(`🏠 Joining room for shop: ${shopDomain}`);
      socketRef.current.emit('join-room', { shopDomain });
      hasJoinedRoom.current = true;
    }
  }, [shopDomain]);

  return {
    socket: socketRef.current,
    isConnected,
    connectionError,
    connect,
    disconnect,
  };
}



