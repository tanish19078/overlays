/**
 * API configuration — resolves the backend URL based on environment.
 * - Production (Vercel/Render): uses relative paths (same origin)
 * - Development: points to localhost:3001
 */
const API_BASE =
  import.meta.env.MODE === 'production'
    ? 'https://overlays-aewg.onrender.com'  // Point Vercel frontend to Render backend!
    : 'http://localhost:3001';

export default API_BASE;
