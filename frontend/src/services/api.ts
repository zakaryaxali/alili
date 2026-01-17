/**
 * Get the API URL, auto-detecting the host for mobile access.
 * Uses VITE_API_URL env var if set, otherwise derives from current hostname.
 */
export function getApiUrl(): string {
  // Use env var if explicitly set
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Auto-detect: use current hostname with backend port
  const hostname = window.location.hostname;
  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';

  return `${protocol}//${hostname}:8000`;
}
