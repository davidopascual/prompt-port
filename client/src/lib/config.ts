// Environment configuration for API endpoints
const isDevelopment = import.meta.env.DEV;
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// API base URL configuration
export const API_BASE_URL = (() => {
  if (isDevelopment && isLocalhost) {
    // Force HTTP for local development to avoid SSL errors
    return 'http://localhost:3001';
  }
  
  // Use relative URLs for production (will inherit the protocol from the main site)
  return '';
})();

// Helper function to build API URLs
export function buildApiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  if (API_BASE_URL) {
    return `${API_BASE_URL}${cleanEndpoint}`;
  }
  
  return cleanEndpoint;
}

// Configuration for different environments
export const config = {
  api: {
    baseUrl: API_BASE_URL,
    timeout: 30000, // 30 seconds
  },
  
  // Features that can be toggled based on environment
  features: {
    enableSecurityHeaders: !isDevelopment,
    enableAuditLogging: !isDevelopment,
    enableRateLimiting: !isDevelopment,
  },
  
  // Development-specific settings
  development: {
    forceHttp: true,
    disableSSL: true,
    skipSecurityChecks: true,
  }
};

export default config;
