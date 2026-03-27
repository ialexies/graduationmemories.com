import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../lib/api';
import type { V2PageRecord } from '../../types';

export function V2PagesPage() {
  const [pages, setPages] = useState<V2PageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/v2/pages');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to load pages');
      setPages(data.pages || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load pages');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createPage(e: React.FormEvent) {
    e.preventDefault();
    if (!slug.trim() || !title.trim()) return;
    setCreating(true);
    setError('');
    try {
      const res = await apiFetch('/api/v2/pages', {
        method: 'POST',
        body: JSON.stringify({ slug: slug.trim(), title: title.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to create page');
      setSlug('');
      setTitle('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create page');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">V2 Pages</h1>

      <form onSubmit={createPage} className="bg-white border border-slate-200 rounded-xl p-4 grid sm:grid-cols-3 gap-3">
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="slug (e.g. summer-event)"
          className="px-3 py-2 border border-slate-300 rounded-lg"
          required
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Page title"
          className="px-3 py-2 border border-slate-300 rounded-lg"
          required
        />
        <button
          type="submit"
          disabled={creating}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {creating ? 'Creating...' : 'Create V2 Page'}
        </button>
      </form>

      {error && <p className="text-red-600">{error}</p>}
      {loading ? (
        <p className="text-slate-500">Loading pages...</p>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3">Slug</th>
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">{p.slug}</td>
                  <td className="px-4 py-3">{p.title}</td>
                  <td className="px-4 py-3">{p.status}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <Link className="text-blue-600 hover:underline" to={`/admin/v2/pages/${p.id}`}>
                        Edit
                      </Link>
                      <Link className="text-slate-600 hover:underline" to={`/v2/${p.slug}`} target="_blank" rel="noreferrer">
                        View
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {pages.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                    No V2 pages yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

