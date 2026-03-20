import { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';

interface Page {
  id: string;
  enabled: number;
  created_at: string;
}

interface Token {
  page_id: string;
  token: string;
}

export function AdminPagesPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [tokensByPage, setTokensByPage] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiFetch('/api/admin/pages').then((r) => r.json()),
      apiFetch('/api/admin/tokens').then((r) => r.json()),
    ])
      .then(([pageData, tokenData]) => {
        setPages(pageData.pages);
        const map: Record<string, string> = {};
        for (const t of tokenData.tokens as Token[]) {
          if (!map[t.page_id]) map[t.page_id] = t.token;
        }
        setTokensByPage(map);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function toggleEnabled(page: Page) {
    const enabled = page.enabled === 1 ? false : true;
    const res = await apiFetch(`/api/admin/pages/${page.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    });
    if (!res.ok) {
      setError('Failed to update');
      return;
    }
    setPages((prev) =>
      prev.map((p) => (p.id === page.id ? { ...p, enabled: enabled ? 1 : 0 } : p))
    );
  }

  if (loading) return <div className="text-slate-500">Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Pages</h1>
      <p className="text-slate-500 mb-4">Enable or disable class pages. Disabled pages cannot be accessed.</p>
      <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-800">Page ID</th>
              <th className="text-left px-4 py-3 font-medium text-slate-800">Status</th>
              <th className="text-left px-4 py-3 font-medium text-slate-800">Action</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => (
              <tr key={page.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-mono text-slate-700">
                  {tokensByPage[page.id] ? (
                    <a
                      href={`/${page.id}?t=${tokensByPage[page.id]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      {page.id}
                    </a>
                  ) : (
                    page.id
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-sm ${
                      page.enabled === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {page.enabled === 1 ? 'Enabled' : 'Disabled'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleEnabled(page)}
                    className={`text-sm font-medium ${
                      page.enabled === 1
                        ? 'text-amber-600 hover:text-amber-700'
                        : 'text-green-600 hover:text-green-700'
                    }`}
                  >
                    {page.enabled === 1 ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
