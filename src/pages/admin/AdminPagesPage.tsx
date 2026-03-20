import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../lib/api';
import type { PageType } from '../../types';

interface Page {
  id: string;
  enabled: number;
  created_at?: string;
  label?: string | null;
}

interface Token {
  page_id: string;
  token: string;
}

function generatePageId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function AdminPagesPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [tokensByPage, setTokensByPage] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createPageId, setCreatePageId] = useState('');
  const [createPageType, setCreatePageType] = useState<PageType>('event');
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createdPageId, setCreatedPageId] = useState<string | null>(null);

  function loadData() {
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
  }

  useEffect(() => {
    loadData();
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

  function openCreateModal() {
    setShowCreateModal(true);
    setCreatePageId('');
    setCreatePageType('event');
    setCreateError('');
    setCreatedPageId(null);
  }

  function closeCreateModal() {
    setShowCreateModal(false);
    setCreatePageId('');
    setCreatePageType('event');
    setCreateError('');
    setCreateLoading(false);
    setCreatedPageId(null);
  }

  async function handleCreatePage(e: React.FormEvent) {
    e.preventDefault();
    setCreateError('');
    setCreateLoading(true);
    try {
      const res = await apiFetch('/api/admin/pages', {
        method: 'POST',
        body: JSON.stringify({ id: createPageId.trim(), type: createPageType }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Failed to create (${res.status})`);
      }
      setCreatedPageId(data.id);
      loadData();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create page');
    } finally {
      setCreateLoading(false);
    }
  }

  if (loading) return <div className="text-slate-500">Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Pages</h1>
      <p className="text-slate-500 mb-4">Enable or disable pages. Disabled pages cannot be accessed.</p>
      <div className="mb-4">
        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-smooth btn-press"
        >
          Create new page
        </button>
      </div>
      {pages.length === 0 ? (
        <div className="bg-white rounded-xl shadow border border-slate-200 p-12 text-center animate-fade-in">
          <p className="text-slate-600 mb-4">No pages yet. Create your first page to get started.</p>
          <button
            type="button"
            onClick={openCreateModal}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-smooth btn-press"
          >
            Create new page
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden animate-fade-in">
          <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-800">Page</th>
              <th className="text-left px-4 py-3 font-medium text-slate-800">Status</th>
              <th className="text-left px-4 py-3 font-medium text-slate-800">Action</th>
            </tr>
          </thead>
            <tbody>
              {pages.map((page) => (
                <tr key={page.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 text-slate-700">
                    {tokensByPage[page.id] ? (
                      <a
                        href={`/${page.id}?t=${tokensByPage[page.id]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        {page.label?.trim() || page.id}
                      </a>
                    ) : (
                      <span className="font-medium">{page.label?.trim() || page.id}</span>
                    )}
                    {page.label?.trim() && (
                      <span className="ml-2 font-mono text-slate-500 text-sm">({page.id})</span>
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
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 animate-scale-in">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Create new page</h2>
            {createdPageId ? (
              <div>
                <p className="text-green-700 font-medium mb-2">Page "{createdPageId}" created successfully.</p>
                <p className="text-slate-600 text-sm mb-4">
                  Create a token to share the page, then add content.
                </p>
                <div className="flex gap-3">
                  <Link
                    to={`/admin/content/${createdPageId}`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                  >
                    Edit content
                  </Link>
                  <Link
                    to="/admin/tokens"
                    className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 text-sm font-medium"
                  >
                    Create token
                  </Link>
                </div>
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="mt-4 text-slate-600 hover:text-slate-800 text-sm"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreatePage} className="space-y-4">
                <div>
                  <label htmlFor="create-page-id" className="block text-sm font-medium text-slate-700 mb-1">
                    Page ID *
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="create-page-id"
                      type="text"
                      value={createPageId}
                      onChange={(e) => setCreatePageId(e.target.value)}
                      placeholder="batch2026 or event-march"
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setCreatePageId(generatePageId())}
                      className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium"
                    >
                      Auto-generate
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">3–20 characters, letters, numbers, hyphens only</p>
                </div>
                <div>
                  <label htmlFor="create-page-type" className="block text-sm font-medium text-slate-700 mb-1">
                    Page type
                  </label>
                  <select
                    id="create-page-type"
                    value={createPageType}
                    onChange={(e) => setCreatePageType(e.target.value as PageType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="event">Event</option>
                    <option value="graduation">Graduation</option>
                    <option value="wedding">Wedding</option>
                    <option value="birthday">Birthday</option>
                    <option value="anniversary">Anniversary</option>
                    <option value="reunion">Reunion</option>
                    <option value="retirement">Retirement</option>
                    <option value="babyShower">Baby shower</option>
                    <option value="farewell">Farewell</option>
                    <option value="engagement">Engagement</option>
                  </select>
                </div>
                {createError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                    {createError}
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={createLoading || !createPageId.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-smooth btn-press"
                  >
                    {createLoading ? 'Creating…' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
