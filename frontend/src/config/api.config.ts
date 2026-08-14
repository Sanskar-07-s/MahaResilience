/**
 * api.config.ts — Centralized API Base URL configuration.
 * Automatically points to production Render backend if VITE_API_URL is set or defaults to Render URL.
 */

export const API_BASE =
  (import.meta as any).env?.VITE_API_URL || 'https://maharesilience.onrender.com';

export const getApiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (!API_BASE) return cleanPath;
  return `${API_BASE.replace(/\/$/, '')}${cleanPath}`;
};
