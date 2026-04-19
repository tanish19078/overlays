/**
 * API configuration — resolves the backend URL based on environment.
 * - Production (Vercel/Render): uses relative paths (same origin)
 * - Development: points to localhost:3001
 */
const API_BASE =
  import.meta.env.MODE === 'production'
    ? ''  // Same origin in production (Vercel serverless or Render)
    : 'http://localhost:3001';

export default API_BASE;
