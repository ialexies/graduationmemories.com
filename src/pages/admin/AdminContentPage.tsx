import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../lib/api';

interface Page {
  id: string;
  enabled?: number;
  label?: string | null;
}

export function AdminContentPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/api/admin/pages')
      .then((r) => r.json())
      .then((data) => setPages(data.pages))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-500 animate-pulse">Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Page Content</h1>
      <p className="text-slate-500 mb-4">
        Edit content for class pages. Select a page to edit its section name, quote, teacher message, students, and more.
      </p>
      <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden animate-fade-in">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-800">Page</th>
              <th className="text-left px-4 py-3 font-medium text-slate-800">Action</th>
            </tr>
          </thead>
          <tbody>
            {pages.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-slate-500">
                  No pages assigned. Contact an admin to get page access.
                </td>
              </tr>
            ) : (
              pages.map((page, idx) => (
                <tr
                  key={page.id}
                  className="border-b border-slate-100 last:border-0 animate-fade-in"
                  style={{ animationDelay: `${Math.min(idx * 40, 200)}ms` }}
                >
                  <td className="px-4 py-3 text-slate-700">
                    <span className="font-medium">{page.label?.trim() || page.id}</span>
                    {page.label?.trim() && (
                      <span className="ml-2 font-mono text-slate-500 text-sm">({page.id})</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/content/${page.id}`}
                      className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                    >
                      Edit content
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
