/**
 * WebSocket client configuration and utilities
 * Handles connection to backend WebSocket server via Socket.IO
 */

// Get backend URL from environment or use default
// In production, this should be your actual backend URL
// For ngrok: 'https://your-domain.ngrok-free.app'
// For Cloudflare: 'https://your-domain.trycloudflare.com'
const getBackendUrl = (): string => {
  // Check if we're in the browser
  if (typeof window === 'undefined') {
    return 'http://localhost:3000';
  }

  // Try to get from environment variable (set via Vite)
  // You can set this in your .env file: VITE_BACKEND_URL=https://your-ngrok-url.ngrok-free.app
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 
                      // Fallback: try to get from current window location if on ngrok/cloudflare
                      (window.location.hostname.includes('ngrok') || window.location.hostname.includes('trycloudflare') 
                        ? `https://${window.location.hostname}` 
                        : 'http://localhost:3000');
  
  return backendUrl;
};

/**
 * Convert HTTP/HTTPS URL to WebSocket URL
 */
export const getWebSocketUrl = (): string => {
  const backendUrl = getBackendUrl();
  
  // Convert http:// to ws:// and https:// to wss://
  if (backendUrl.startsWith('https://')) {
    return backendUrl.replace('https://', 'wss://');
  } else if (backendUrl.startsWith('http://')) {
    return backendUrl.replace('http://', 'ws://');
  }
  
  // If no protocol, assume https and use wss
  return `wss://${backendUrl}`;
};

/**
 * Get the backend HTTP URL
 */
export const getBackendHttpUrl = (): string => {
  return getBackendUrl();
};

