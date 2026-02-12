/**
 * WebSocket Status Component
 * 
 * Example component showing how to use WebSocket for real-time updates.
 * This can be integrated into any page that needs real-time product updates.
 * 
 * Usage:
 * ```tsx
 * import { WebSocketStatus } from '../components/WebSocketStatus';
 * 
 * <WebSocketStatus shopDomain={shopDomain} />
 * ```
 */

import { useWebSocket, type ProductUpdatedEvent, type ProductDeletedEvent } from '../hooks/useWebSocket';

interface WebSocketStatusProps {
  shopDomain: string;
  showNotifications?: boolean;
  onProductUpdated?: (event: ProductUpdatedEvent) => void;
  onProductDeleted?: (event: ProductDeletedEvent) => void;
}

export function WebSocketStatus({ 
  shopDomain, 
  showNotifications = false,
  onProductUpdated,
  onProductDeleted 
}: WebSocketStatusProps) {
  const { isConnected, connectionError } = useWebSocket({
    shopDomain,
    onProductUpdated: (event) => {
      console.log('🔄 Product updated via WebSocket:', event);
      if (onProductUpdated) {
        onProductUpdated(event);
      }
      if (showNotifications) {
        // You can show a toast notification here
        console.log(`Product updated: ${event.product.title}`);
      }
    },
    onProductDeleted: (event) => {
      console.log('🗑️ Product deleted via WebSocket:', event);
      if (onProductDeleted) {
        onProductDeleted(event);
      }
      if (showNotifications) {
        // You can show a toast notification here
        console.log(`Product deleted: ${event.shopifyProductId}`);
      }
    },
    autoConnect: true,
  });

  // Optional: Show connection status (useful for debugging)
  if (process.env.NODE_ENV === 'development') {
    return (
      <div style={{ 
        position: 'fixed', 
        bottom: 10, 
        right: 10, 
        padding: '8px 12px', 
        background: isConnected ? '#2ea043' : '#d92d20',
        color: 'white',
        borderRadius: '4px',
        fontSize: '12px',
        zIndex: 9999
      }}>
        WebSocket: {isConnected ? '✅ Connected' : '❌ Disconnected'}
        {connectionError && ` (${connectionError})`}
      </div>
    );
  }

  return null;
}



