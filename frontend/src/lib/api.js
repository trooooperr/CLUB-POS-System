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

/**
 * Authenticated fetch — automatically includes JWT token
 */
export async function authFetch(url, options = {}) {
  const token = localStorage.getItem('humtum_token');
  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Set Content-Type for JSON bodies if not already set
  if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, { ...options, headers });

  // Auto-logout on 401 (token expired)
  if (res.status === 401) {
    localStorage.removeItem('humtum_token');
    localStorage.removeItem('humtum_auth');
    // Don't reload if we're already on the login page
    if (window.location.pathname !== '/login') {
      window.location.reload();
    }
    throw new Error('Session expired');
  }

  return res;
}