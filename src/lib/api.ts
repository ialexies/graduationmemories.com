const STORAGE_KEY = 'gradmemories_admin';

/** In dev, bypass proxy for uploads to avoid multipart issues */
const API_BASE = (import.meta as { env?: { DEV?: boolean } }).env?.DEV
  ? 'http://127.0.0.1:3001'
  : '';

function getToken(): string | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const { token } = JSON.parse(stored);
    return token;
  } catch {
    return null;
  }
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: HeadersInit = { ...options.headers };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  if (!(options.body instanceof FormData)) {
    (headers as Record<string, string>)['Content-Type'] = 'application/json';
  }
  const url = path.startsWith('/') ? `${API_BASE}${path}` : path;
  const res = await fetch(url, { ...options, headers });
  return res;
}
