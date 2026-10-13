/**
 * api.config.ts — Centralized API Base URL configuration.
 * When running in local development (localhost / 127.0.0.1), use relative path to route through Vite proxy to local backend (port 5000).
 * In production builds or when VITE_API_URL is explicitly provided, use the configured API_BASE.
 */

const envUrl = (import.meta as any).env?.VITE_API_URL;
const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '0.0.0.0');

export const API_BASE = envUrl ? envUrl : isLocalhost ? '' : 'https://maharesilience.onrender.com';

export const getApiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (!API_BASE) return cleanPath;
  return `${API_BASE.replace(/\/$/, '')}${cleanPath}`;
};
