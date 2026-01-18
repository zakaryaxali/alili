/**
 * Get the REST API URL.
 * In production: Uses VITE_API_URL (e.g., https://domain.com/api)
 * In development: Uses current hostname with backend port
 */
export function getApiUrl(): string {
  // Use env var if explicitly set (production)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Auto-detect: use current hostname with backend port (development)
  const hostname = window.location.hostname;
  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';

  return `${protocol}//${hostname}:8000`;
}

/**
 * Get the WebSocket URL for Socket.IO connection.
 * In production: Uses base URL without /api prefix (Caddy routes /socket.io/* directly)
 * In development: Uses current hostname with backend port
 */
export function getWsUrl(): string {
  // In production, strip /api suffix from VITE_API_URL
  if (import.meta.env.VITE_API_URL) {
    const apiUrl = import.meta.env.VITE_API_URL as string;
    // Remove trailing /api or /api/
    return apiUrl.replace(/\/api\/?$/, '');
  }

  // Auto-detect: use current hostname with backend port (development)
  const hostname = window.location.hostname;
  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';

  return `${protocol}//${hostname}:8000`;
}
