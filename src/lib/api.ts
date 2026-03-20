const STORAGE_KEY = 'gradmemories_admin';

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
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(path, { ...options, headers });
  return res;
}
