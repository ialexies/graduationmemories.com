import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BlockRenderer } from '../components/v2/BlockRenderer';
import type { V2Block } from '../types';

interface PublicPayload {
  page: { title: string; slug: string; theme?: { preset?: string } };
  labels?: Record<string, string>;
  blocks: V2Block[];
}

export function V2PublicPage() {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<PublicPayload | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/v2/public/${encodeURIComponent(slug)}`)
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(body?.error || 'Failed to load page');
        return body as PublicPayload;
      })
      .then((payload) => setData(payload))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load page'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="p-6">Loading page...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!data) return <div className="p-6">Page not found</div>;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <BlockRenderer blocks={data.blocks || []} />
      </div>
    </main>
  );
}

