/**
 * Client API per backend SQLite
 * Sostituisce Supabase quando VITE_API_URL è configurato
 */

const API_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:3001' : '');

function getToken(): string | null {
  return localStorage.getItem('viva_token') || sessionStorage.getItem('viva_token');
}

function setToken(token: string, remember: boolean) {
  if (remember) localStorage.setItem('viva_token', token);
  else sessionStorage.setItem('viva_token', token);
}

function clearToken() {
  localStorage.removeItem('viva_token');
  sessionStorage.removeItem('viva_token');
}

async function fetchApi<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Errore ${res.status}`);
  }
  return data as T;
}

export const apiClient = {
  getToken,
  setToken,
  clearToken,
  get: <T>(path: string) => fetchApi<T>(path),
  post: <T>(path: string, body: unknown) => fetchApi<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) => fetchApi<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => fetchApi<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => fetchApi<T>(path, { method: 'DELETE' }),
};

export function isBackendConfigured(): boolean {
  return !!API_URL;
}

/** URL completa per avatar (in dev serve il prefisso API) */
export function getAvatarUrl(avatarUrl: string | undefined): string | undefined {
  if (!avatarUrl) return undefined;
  if (avatarUrl.startsWith('http')) return avatarUrl;
  const base = API_URL || '';
  return base ? `${base.replace(/\/$/, '')}${avatarUrl}` : avatarUrl;
}
