const rawBase =
  import.meta.env.VITE_API_URL ||
  window.location.origin; 

export const API_BASE = rawBase.replace(/\/$/, '');

export function apiUrl(path) {
  if (!path.startsWith('/')) {
    throw new Error(`API path must start with "/": ${path}`);
  }

  return `${API_BASE}${path}`;
}