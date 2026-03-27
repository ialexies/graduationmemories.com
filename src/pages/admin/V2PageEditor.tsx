import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiFetch } from '../../lib/api';
import { BlockRenderer } from '../../components/v2/BlockRenderer';
import type { V2Block, V2PageContent } from '../../types';

const BLOCK_OPTIONS: { type: V2Block['type']; label: string }[] = [
  { type: 'header', label: 'Header' },
  { type: 'richText', label: 'Rich text' },
  { type: 'peopleList', label: 'People list' },
  { type: 'imageGrid', label: 'Image grid' },
  { type: 'cta', label: 'CTA' },
  { type: 'footer', label: 'Footer' },
];

function defaultProps(type: V2Block['type']): Record<string, unknown> {
  switch (type) {
    case 'header':
      return { title: 'New Header', subtitle: '', metaLeft: '', metaRight: '' };
    case 'richText':
      return { content: '<p>Write content...</p>' };
    case 'peopleList':
      return { items: [], footerText: '' };
    case 'imageGrid':
      return { images: [] };
    case 'cta':
      return { label: 'Click here', href: '#' };
    case 'footer':
      return { shopName: '', tagline: '', location: '', linkUrl: '' };
    default:
      return {};
  }
}

export function V2PageEditor() {
  const { id } = useParams<{ id: string }>();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [content, setContent] = useState<V2PageContent>({ labels: {}, blocks: [], meta: { schemaVersion: 1 } });
  const [selectedBlockId, setSelectedBlockId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [draggingBlockId, setDraggingBlockId] = useState('');
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile' | 'custom'>('desktop');
  const previewCanvasRef = useRef<HTMLDivElement>(null);
  const [measuredPreviewWidth, setMeasuredPreviewWidth] = useState(1200);
  const [previewWidthPxInput, setPreviewWidthPxInput] = useState(1200);
  const [isResizingPreview, setIsResizingPreview] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');
    apiFetch(`/api/v2/pages/${id}`)
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data?.error || 'Failed to load V2 page');
        return data;
      })
      .then((data) => {
        setTitle(data.page?.title || '');
        setSlug(data.page?.slug || '');
        setStatus(data.page?.status || 'draft');
        const draft = data.latestDraft?.content || { labels: {}, blocks: [], meta: { schemaVersion: 1 } };
        setContent(draft);
        setSelectedBlockId(draft.blocks?.[0]?.id || '');
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load V2 page'))
      .finally(() => setLoading(false));
  }, [id]);

  const selectedBlock = useMemo(
    () => content.blocks.find((b) => b.id === selectedBlockId) || null,
    [content.blocks, selectedBlockId]
  );

  const previewWidthClass = useMemo(() => (
    previewViewport === 'desktop' ? 'w-full' : 'max-w-full'
  ), [previewViewport]);

  const previewWidthLabel = useMemo(() => (
    previewViewport === 'desktop' ? `${measuredPreviewWidth}px (auto)` : `${measuredPreviewWidth}px`
  ), [previewViewport, measuredPreviewWidth]);

  const previewWidthPx = useMemo(() => measuredPreviewWidth, [measuredPreviewWidth]);

  useEffect(() => {
    if (previewViewport === 'desktop') return;
    if (previewViewport === 'tablet') setPreviewWidthPxInput(768);
    else if (previewViewport === 'mobile') setPreviewWidthPxInput(390);
  }, [previewViewport]);

  useEffect(() => {
    const measure = () => {
      const w = previewCanvasRef.current?.clientWidth || 0;
      if (w > 0) setMeasuredPreviewWidth(Math.round(w));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [previewViewport, content.blocks.length]);

  useEffect(() => {
    if (!isResizingPreview) return;
    const onMove = (e: MouseEvent) => {
      if (previewViewport === 'desktop') return;
      const rect = previewCanvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const nextWidth = Math.round(e.clientX - rect.left);
      const clamped = Math.max(320, Math.min(1600, nextWidth));
      setPreviewWidthPxInput(clamped);
    };
    const onUp = () => setIsResizingPreview(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isResizingPreview, previewViewport]);

  function updateSelectedPropsFromJson(raw: string) {
    if (!selectedBlock) return;
    try {
      const parsed = JSON.parse(raw);
      setContent((prev) => ({
        ...prev,
        blocks: prev.blocks.map((b) => (b.id === selectedBlock.id ? { ...b, props: parsed } : b)),
      }));
      setError('');
    } catch {
      setError('Invalid JSON for block props');
    }
  }

  function moveBlock(idToMove: string, direction: -1 | 1) {
    setContent((prev) => {
      const idx = prev.blocks.findIndex((b) => b.id === idToMove);
      const nextIdx = idx + direction;
      if (idx < 0 || nextIdx < 0 || nextIdx >= prev.blocks.length) return prev;
      const arr = [...prev.blocks];
      const [item] = arr.splice(idx, 1);
      arr.splice(nextIdx, 0, item);
      return { ...prev, blocks: arr };
    });
  }

  function moveBlockToIndex(idToMove: string, targetIndex: number) {
    setContent((prev) => {
      const fromIndex = prev.blocks.findIndex((b) => b.id === idToMove);
      if (fromIndex < 0) return prev;
      if (targetIndex < 0 || targetIndex >= prev.blocks.length) return prev;
      if (fromIndex === targetIndex) return prev;
      const arr = [...prev.blocks];
      const [item] = arr.splice(fromIndex, 1);
      arr.splice(targetIndex, 0, item);
      return { ...prev, blocks: arr };
    });
  }

  function addBlock(type: V2Block['type']) {
    const nextNumber = content.blocks.length + 1;
    const idValue = `blk_${type}_${String(nextNumber).padStart(2, '0')}`;
    const newBlock: V2Block = { id: idValue, type, visibility: true, props: defaultProps(type) };
    setContent((prev) => ({ ...prev, blocks: [...prev.blocks, newBlock] }));
    setSelectedBlockId(idValue);
  }

  function removeSelected() {
    if (!selectedBlock) return;
    setContent((prev) => ({ ...prev, blocks: prev.blocks.filter((b) => b.id !== selectedBlock.id) }));
    setSelectedBlockId('');
  }

  async function saveDraft() {
    if (!id) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const res = await apiFetch(`/api/v2/pages/${id}/draft`, {
        method: 'PUT',
        body: JSON.stringify(content),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to save draft');
      setMessage(`Draft saved (v${data.versionNo})`);
      setStatus('draft');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    if (!id) return;
    setPublishing(true);
    setError('');
    setMessage('');
    try {
      const res = await apiFetch(`/api/v2/pages/${id}/publish`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to publish');
      setMessage(`Published version v${data.publishedVersionNo}`);
      setStatus('published');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to publish');
    } finally {
      setPublishing(false);
    }
  }

  async function importLegacyPreview() {
    if (!slug.trim()) return;
    setError('');
    setMessage('');
    try {
      const res = await apiFetch(`/api/v2/migration/preview/${encodeURIComponent(slug.trim())}`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Migration preview failed');
      const incomingBlocks = data?.result?.blocks || [];
      const incomingLabels = data?.result?.page?.labels || {};
      setContent((prev) => ({ ...prev, blocks: incomingBlocks, labels: incomingLabels }));
      setSelectedBlockId(incomingBlocks?.[0]?.id || '');
      setMessage('Legacy preview imported into editor (not yet saved).');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Migration preview failed');
    }
  }

  if (loading) return <p>Loading V2 editor...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">V2 Editor</h1>
          <p className="text-sm text-slate-500">Title: {title} | Slug: {slug} | Status: {status}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/v2/pages" className="px-3 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50">
            Back
          </Link>
          <Link to={`/v2/${slug}`} target="_blank" rel="noreferrer" className="px-3 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50">
            Open public
          </Link>
        </div>
      </div>

      {(error || message) && (
        <div className="space-y-1">
          {error && <p className="text-red-600">{error}</p>}
          {message && <p className="text-green-700">{message}</p>}
        </div>
      )}

      <div className="grid lg:grid-cols-[260px_1fr_320px] gap-4">
        <aside className="bg-white border border-slate-200 rounded-xl p-3 space-y-3">
          <h2 className="font-semibold text-slate-800">Blocks</h2>
          <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
            {content.blocks.map((b, i) => (
              <button
                key={b.id}
                type="button"
                draggable
                onClick={() => setSelectedBlockId(b.id)}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', b.id);
                  e.dataTransfer.effectAllowed = 'move';
                  setDraggingBlockId(b.id);
                }}
                onDragEnd={() => setDraggingBlockId('')}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const fromId = e.dataTransfer.getData('text/plain');
                  if (!fromId) return;
                  moveBlockToIndex(fromId, i);
                  setSelectedBlockId(fromId);
                  setDraggingBlockId('');
                }}
                className={`w-full text-left border rounded-lg px-3 py-2 ${selectedBlockId === b.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}
                aria-label={`Block ${i + 1} ${b.type}. Drag to reorder.`}
              >
                <p className="text-sm font-medium flex items-center gap-2">
                  <span className="text-slate-400" aria-hidden>≡</span>
                  <span>{i + 1}. {b.type}</span>
                  {draggingBlockId === b.id && <span className="text-xs text-blue-600">(dragging)</span>}
                </p>
                <p className="text-xs text-slate-500">{b.id}</p>
              </button>
            ))}
          </div>
          <select
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            defaultValue=""
            aria-label="Add block type"
            onChange={(e) => {
              const value = e.target.value as V2Block['type'];
              if (value) addBlock(value);
              e.currentTarget.value = '';
            }}
          >
            <option value="">+ Add block</option>
            {BLOCK_OPTIONS.map((o) => (
              <option key={o.type} value={o.type}>{o.label}</option>
            ))}
          </select>
          <button type="button" onClick={importLegacyPreview} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50">
            Import Legacy Preview
          </button>
        </aside>

        <section className="bg-slate-100 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Preview width</span>
            <button
              type="button"
              onClick={() => setPreviewViewport('desktop')}
              className={`px-3 py-1.5 text-sm rounded-lg border ${previewViewport === 'desktop' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
            >
              Desktop
            </button>
            <button
              type="button"
              onClick={() => setPreviewViewport('tablet')}
              className={`px-3 py-1.5 text-sm rounded-lg border ${previewViewport === 'tablet' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
            >
              Tablet
            </button>
            <button
              type="button"
              onClick={() => setPreviewViewport('mobile')}
              className={`px-3 py-1.5 text-sm rounded-lg border ${previewViewport === 'mobile' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
            >
              Mobile
            </button>
            <button
              type="button"
              onClick={() => setPreviewViewport('custom')}
              className={`px-3 py-1.5 text-sm rounded-lg border ${previewViewport === 'custom' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
            >
              Custom
            </button>
            <label className="ml-auto flex items-center gap-2 text-xs text-slate-600">
              Width
              <input
                type="number"
                min={320}
                max={1600}
                step={10}
                value={previewWidthPxInput}
                disabled={previewViewport === 'desktop'}
                onChange={(e) => setPreviewWidthPxInput(Math.max(320, Math.min(1600, Number(e.target.value) || 320)))}
                className="w-20 px-2 py-1 border border-slate-300 rounded bg-white disabled:bg-slate-100 disabled:text-slate-400"
                aria-label="Preview width in pixels"
              />
              px
            </label>
          </div>
          <div className="rounded-lg border border-slate-300 bg-white px-3 py-2">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mb-1">
              <span>Ruler</span>
              <span>{previewWidthLabel}</span>
            </div>
            <div className="relative h-14 rounded bg-slate-50 border border-slate-200 overflow-hidden">
              <div className="absolute left-0 right-0 top-0 h-10">
                {[
                  'left-[0%]',
                  'left-[10%]',
                  'left-[20%]',
                  'left-[30%]',
                  'left-[40%]',
                  'left-[50%]',
                  'left-[60%]',
                  'left-[70%]',
                  'left-[80%]',
                  'left-[90%]',
                  'left-[100%]',
                ].map((leftClass, i) => {
                  const isMajor = i % 2 === 0;
                  const tickHeight = isMajor ? 'h-4' : 'h-2';
                  const tickColor = isMajor ? 'bg-slate-500' : 'bg-slate-300';
                  const value = Math.round((previewWidthPx * i) / 10);
                  return (
                    <div key={i} className={`absolute top-0 -translate-x-1/2 ${leftClass}`}>
                      <div className={`w-px ${tickHeight} ${tickColor}`} />
                      {isMajor && (
                        <span className="mt-1 block text-[10px] leading-none text-slate-600 whitespace-nowrap">
                          {value}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-4 bg-slate-100 border-t border-slate-200" />
            </div>
          </div>
          <div className="flex justify-center">
            <div ref={previewCanvasRef} className="w-full flex justify-center">
              <div
                className={`${previewWidthClass} transition-all duration-200 relative`}
                style={previewViewport === 'desktop' ? undefined : { width: `${previewWidthPxInput}px` }}
              >
                <BlockRenderer blocks={content.blocks} />
                {previewViewport !== 'desktop' && (
                  <button
                    type="button"
                    onMouseDown={() => setIsResizingPreview(true)}
                    className="absolute top-0 -right-2 h-full w-4 cursor-ew-resize bg-transparent"
                    aria-label="Drag to resize preview width"
                    title="Drag to resize width"
                  >
                    <span className="absolute inset-y-8 left-1/2 -translate-x-1/2 w-1 h-16 rounded bg-blue-400/80 border border-blue-600/50" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <aside className="bg-white border border-slate-200 rounded-xl p-3 space-y-3">
          <h2 className="font-semibold text-slate-800">Inspector</h2>
          {selectedBlock ? (
            <>
              <p className="text-sm text-slate-600">{selectedBlock.type}</p>
              <label className="text-sm text-slate-600 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedBlock.visibility !== false}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      blocks: prev.blocks.map((b) => (b.id === selectedBlock.id ? { ...b, visibility: e.target.checked } : b)),
                    }))
                  }
                />
                Visible
              </label>
              <textarea
                className="w-full min-h-[220px] font-mono text-xs px-3 py-2 border border-slate-300 rounded-lg"
                aria-label="Block props JSON"
                value={JSON.stringify(selectedBlock.props, null, 2)}
                onChange={(e) => updateSelectedPropsFromJson(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <button type="button" className="px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50" onClick={() => moveBlock(selectedBlock.id, -1)}>
                  Move up
                </button>
                <button type="button" className="px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50" onClick={() => moveBlock(selectedBlock.id, 1)}>
                  Move down
                </button>
              </div>
              <button type="button" className="w-full px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50" onClick={removeSelected}>
                Remove block
              </button>
            </>
          ) : (
            <p className="text-sm text-slate-500">Select a block to edit.</p>
          )}

          <hr />
          <div className="space-y-2">
            <button type="button" onClick={saveDraft} disabled={saving} className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button type="button" onClick={publish} disabled={publishing} className="w-full px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
              {publishing ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

