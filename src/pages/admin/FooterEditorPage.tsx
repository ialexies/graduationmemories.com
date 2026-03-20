import { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import { Skeleton } from '../../components/Skeleton';
import type { Footer } from '../../types';

const inputClass =
  'w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
const labelClass = 'block text-sm font-medium text-slate-600 mb-1';

export function FooterEditorPage() {
  const [footer, setFooter] = useState<Footer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/api/admin/footer')
      .then((r) => r.json())
      .then(setFooter)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function update<K extends keyof Footer>(key: K, value: Footer[K]) {
    setFooter((f) => (f ? { ...f, [key]: value } : null));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!footer) return;
    setSaving(true);
    setError('');
    try {
      const res = await apiFetch('/api/admin/footer', {
        method: 'PUT',
        body: JSON.stringify(footer),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }
      setFooter(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="max-w-xl space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-96" />
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  );
  if (error && !footer) return <div className="text-red-500">{error}</div>;
  if (!footer) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Footer</h1>
      <p className="text-slate-500 mb-4">
        Edit the footer shown on all class pages (shop name, tagline, logo, link).
      </p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow border border-slate-200 p-6 space-y-4 max-w-xl">
        {error && <p className="text-red-500">{error}</p>}

        <div>
          <label htmlFor="shopName" className={labelClass}>Shop name</label>
          <input
            id="shopName"
            type="text"
            value={footer.shopName}
            onChange={(e) => update('shopName', e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label htmlFor="tagline" className={labelClass}>Tagline</label>
          <input
            id="tagline"
            type="text"
            value={footer.tagline}
            onChange={(e) => update('tagline', e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label htmlFor="footerLocation" className={labelClass}>Location</label>
          <input
            id="footerLocation"
            type="text"
            value={footer.location}
            onChange={(e) => update('location', e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label htmlFor="linkUrl" className={labelClass}>Link URL (e.g. Facebook page)</label>
          <input
            id="linkUrl"
            type="url"
            value={footer.linkUrl || ''}
            onChange={(e) => update('linkUrl', e.target.value)}
            placeholder="https://..."
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="logo" className={labelClass}>Logo path</label>
          <input
            id="logo"
            type="text"
            value={footer.logo || ''}
            onChange={(e) => update('logo', e.target.value)}
            placeholder="/assets/logo.png"
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="py-2 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  );
}
