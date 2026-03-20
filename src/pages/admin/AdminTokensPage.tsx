import { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';

interface Token {
  id: number;
  token: string;
  page_id: string;
  user_name: string | null;
  created_at: string;
}

interface Page {
  id: string;
  label?: string | null;
}

export function AdminTokensPage() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [newPageId, setNewPageId] = useState<string>('');

  useEffect(() => {
    Promise.all([
      apiFetch('/api/admin/tokens').then((r) => r.json()),
      apiFetch('/api/admin/pages').then((r) => r.json()),
    ])
      .then(([tokenData, pageData]) => {
        setTokens(tokenData.tokens);
        setPages(pageData.pages);
        if (pageData.pages.length) setNewPageId(pageData.pages[0].id);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function createToken() {
    if (!newPageId) return;
    setCreating(true);
    setError('');
    try {
      const res = await apiFetch('/api/admin/tokens', {
        method: 'POST',
        body: JSON.stringify({ page_id: newPageId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setTokens((prev) => [data, ...prev]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setCreating(false);
    }
  }

  async function revokeToken(id: number) {
    if (!confirm('Revoke this token? NFC cards using it will stop working.')) return;
    const res = await apiFetch(`/api/admin/tokens/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      setError('Failed to revoke');
      return;
    }
    setTokens((prev) => prev.filter((t) => t.id !== id));
  }

  function copyUrl(token: string, pageId: string) {
    const url = `${window.location.origin}/${pageId}?t=${token}`;
    navigator.clipboard.writeText(url);
    alert('URL copied to clipboard');
  }

  if (loading) return <div className="text-slate-500">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Tokens</h1>

      <div className="bg-white rounded-xl shadow border border-slate-200 p-6 mb-6">
        <h2 className="font-semibold text-slate-800 mb-3">Create Token</h2>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-600 mb-1">Page</label>
            <select
              value={newPageId}
              onChange={(e) => setNewPageId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              {pages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label?.trim() ? `${p.label} (${p.id})` : p.id}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={createToken}
            disabled={creating || !newPageId}
            className="py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-800">Page</th>
              <th className="text-left px-4 py-3 font-medium text-slate-800">Token</th>
              <th className="text-left px-4 py-3 font-medium text-slate-800">Created</th>
              <th className="text-left px-4 py-3 font-medium text-slate-800">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((t) => {
              const page = pages.find((p) => p.id === t.page_id);
              const pageLabel = page?.label?.trim() ? `${page.label} (${t.page_id})` : t.page_id;
              return (
              <tr key={t.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 text-slate-700">{pageLabel}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{t.token.slice(0, 16)}...</td>
                <td className="px-4 py-3 text-slate-500 text-sm">{t.created_at}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button
                    onClick={() => copyUrl(t.token, t.page_id)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Copy URL
                  </button>
                  <button
                    onClick={() => revokeToken(t.id)}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Revoke
                  </button>
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
        {tokens.length === 0 && (
          <p className="p-6 text-slate-500 text-center">No tokens yet. Create one above.</p>
        )}
      </div>
    </div>
  );
}
