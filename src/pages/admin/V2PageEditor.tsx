import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiFetch } from '../../lib/api';
import { BlockRenderer } from '../../components/v2/BlockRenderer';
import { BlockInspector } from '../../components/v2/BlockInspector';
import { PageLabelsEditor } from '../../components/v2/PageLabelsEditor';
import { V2_BLOCK_TYPE_LABELS } from '../../components/v2/blockLabels';
import { lintV2PageContent } from '../../lib/v2ContentLint';
import { V2_PAGE_TEMPLATES } from '../../lib/v2PageTemplates';
import { listSnippets, saveSnippet, deleteSnippet, type SavedSnippet } from '../../lib/v2Snippets';
import type { V2Block, V2PageContent } from '../../types';

const BLOCK_OPTIONS: { type: V2Block['type']; label: string }[] = [
  { type: 'header', label: 'Header' },
  { type: 'richText', label: 'Rich text' },
  { type: 'peopleList', label: 'People list' },
  { type: 'imageGrid', label: 'Image grid' },
  { type: 'cta', label: 'CTA' },
  { type: 'footer', label: 'Footer' },
  { type: 'image', label: 'Image' },
  { type: 'authorCard', label: 'Author card' },
  { type: 'audio', label: 'Audio' },
];

function defaultProps(type: V2Block['type']): Record<string, unknown> {
  switch (type) {
    case 'header':
      return { title: 'New Header', subtitle: '', metaLeft: '', metaRight: '', textAlign: 'left', fontPreset: 'default' };
    case 'richText':
      return { content: '<p>Write content...</p>', textAlign: 'left', fontPreset: 'default', contentSize: 'md' };
    case 'peopleList':
      return { items: [], footerText: '' };
    case 'imageGrid':
      return { images: [] };
    case 'cta':
      return { label: 'Click here', href: '#', textAlign: 'center', fontPreset: 'default' };
    case 'footer':
      return { shopName: '', tagline: '', location: '', linkUrl: '', textAlign: 'left', fontPreset: 'default' };
    case 'image':
      return {
        src: '',
        alt: '',
        widthPreset: 'full',
        align: 'center',
        ratio: 'auto',
        fit: 'cover',
        radius: 'lg',
        border: 'none',
        shadow: 'sm',
        caption: '',
        captionHref: '',
        focalPoint: 'center',
        loading: 'lazy',
      };
    case 'authorCard':
      return { name: '', role: '', photo: '' };
    case 'audio':
      return { src: '', transcript: [] };
    default:
      return {};
  }
}

function cloneContent(c: V2PageContent): V2PageContent {
  return JSON.parse(JSON.stringify(c));
}

export function V2PageEditor() {
  const { id } = useParams<{ id: string }>();
  const [pageTitle, setPageTitle] = useState('');
  const [pageSlug, setPageSlug] = useState('');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [content, setContent] = useState<V2PageContent>({ labels: {}, blocks: [], meta: { schemaVersion: 1 } });
  const [publishedSnapshot, setPublishedSnapshot] = useState<V2PageContent | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [draggingBlockId, setDraggingBlockId] = useState('');
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile' | 'custom'>('desktop');
  const [previewZoom, setPreviewZoom] = useState(100);
  const previewCanvasRef = useRef<HTMLDivElement>(null);
  const [previewWidthPxInput, setPreviewWidthPxInput] = useState(1200);
  const [isResizingPreview, setIsResizingPreview] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [autosaveState, setAutosaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [past, setPast] = useState<V2PageContent[]>([]);
  const [future, setFuture] = useState<V2PageContent[]>([]);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishLint, setPublishLint] = useState<{ errors: { message: string; blockId?: string }[]; warnings: { message: string; blockId?: string }[] } | null>(null);
  const [snippetName, setSnippetName] = useState('');
  const [snippets, setSnippets] = useState<SavedSnippet[]>([]);
  const [inspectorTab, setInspectorTab] = useState<'block' | 'page'>('block');
  const skipDirtyRef = useRef(false);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef(content);
  contentRef.current = content;

  const previewScale = previewZoom / 100;

  const recordStructural = useCallback((next: V2PageContent) => {
    setPast((p) => [...p.slice(-39), cloneContent(contentRef.current)]);
    setFuture([]);
    setContent(next);
    setDirty(true);
  }, []);

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
        setPageTitle(data.page?.title || '');
        setSlug(data.page?.slug || '');
        setPageSlug(data.page?.slug || '');
        setStatus(data.page?.status || 'draft');
        const draft = data.latestDraft?.content || { labels: {}, blocks: [], meta: { schemaVersion: 1 } };
        skipDirtyRef.current = true;
        setContent(draft);
        setSelectedBlockId(draft.blocks?.[0]?.id || '');
        setPast([]);
        setFuture([]);
        setDirty(false);
        if (data.published?.content) {
          setPublishedSnapshot(cloneContent(data.published.content));
        } else {
          setPublishedSnapshot(null);
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load V2 page'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (skipDirtyRef.current) {
      skipDirtyRef.current = false;
      return;
    }
    setDirty(true);
  }, [content]);

  useEffect(() => {
    setSnippets(listSnippets());
  }, []);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    if (!dirty || !id) return;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      autosaveTimerRef.current = null;
      void (async () => {
        const payload = contentRef.current;
        setAutosaveState('saving');
        try {
          const res = await apiFetch(`/api/v2/pages/${id}/draft`, {
            method: 'PUT',
            body: JSON.stringify(payload),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data?.error || 'Autosave failed');
          setAutosaveState('saved');
          setDirty(false);
          setTimeout(() => setAutosaveState('idle'), 2000);
        } catch {
          setAutosaveState('error');
        }
      })();
    }, 3000);
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [content, dirty, id]);

  const selectedBlock = useMemo(
    () => content.blocks.find((b) => b.id === selectedBlockId) || null,
    [content.blocks, selectedBlockId]
  );

  const previewWidthClass = useMemo(() => (previewViewport === 'desktop' ? 'w-full' : 'max-w-full'), [previewViewport]);

  useEffect(() => {
    if (previewViewport === 'desktop') return;
    if (previewViewport === 'tablet') setPreviewWidthPxInput(768);
    else if (previewViewport === 'mobile') setPreviewWidthPxInput(390);
  }, [previewViewport]);

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

  function updateSelectedProps(props: Record<string, unknown>) {
    if (!selectedBlock) return;
    setContent((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) => (b.id === selectedBlock.id ? { ...b, props } : b)),
    }));
  }

  function moveBlock(idToMove: string, direction: -1 | 1) {
    const prev = contentRef.current;
    const idx = prev.blocks.findIndex((b) => b.id === idToMove);
    const nextIdx = idx + direction;
    if (idx < 0 || nextIdx < 0 || nextIdx >= prev.blocks.length) return;
    const arr = [...prev.blocks];
    const [item] = arr.splice(idx, 1);
    arr.splice(nextIdx, 0, item);
    recordStructural({ ...prev, blocks: arr });
  }

  function moveBlockToIndex(idToMove: string, targetIndex: number) {
    const prev = contentRef.current;
    const fromIndex = prev.blocks.findIndex((b) => b.id === idToMove);
    if (fromIndex < 0) return;
    if (targetIndex < 0 || targetIndex >= prev.blocks.length) return;
    if (fromIndex === targetIndex) return;
    const arr = [...prev.blocks];
    const [item] = arr.splice(fromIndex, 1);
    arr.splice(targetIndex, 0, item);
    recordStructural({ ...prev, blocks: arr });
  }

  function addBlock(type: V2Block['type']) {
    const prev = contentRef.current;
    const nextNumber = prev.blocks.length + 1;
    const idValue = `blk_${type}_${String(nextNumber).padStart(2, '0')}`;
    const newBlock: V2Block = { id: idValue, type, visibility: true, props: defaultProps(type) };
    recordStructural({ ...prev, blocks: [...prev.blocks, newBlock] });
    setSelectedBlockId(idValue);
  }

  function duplicateBlock() {
    if (!selectedBlock) return;
    const prev = contentRef.current;
    const copy: V2Block = {
      ...selectedBlock,
      id: `blk_${selectedBlock.type}_${Date.now().toString(36)}`,
      props: JSON.parse(JSON.stringify(selectedBlock.props || {})),
    };
    const idx = prev.blocks.findIndex((b) => b.id === selectedBlock.id);
    const arr = [...prev.blocks];
    arr.splice(idx + 1, 0, copy);
    recordStructural({ ...prev, blocks: arr });
    setSelectedBlockId(copy.id);
  }

  function removeSelected() {
    if (!selectedBlock) return;
    if (!window.confirm('Remove this block?')) return;
    const prev = contentRef.current;
    recordStructural({ ...prev, blocks: prev.blocks.filter((b) => b.id !== selectedBlock.id) });
    setSelectedBlockId('');
  }

  function undo() {
    if (past.length === 0) return;
    const prev = past[past.length - 1];
    setPast((p) => p.slice(0, -1));
    setFuture((f) => [cloneContent(contentRef.current), ...f].slice(0, 40));
    skipDirtyRef.current = true;
    setContent(prev);
    setDirty(true);
  }

  function redo() {
    if (future.length === 0) return;
    const [head, ...rest] = future;
    setFuture(rest);
    setPast((p) => [...p, cloneContent(contentRef.current)].slice(-40));
    skipDirtyRef.current = true;
    setContent(head);
    setDirty(true);
  }

  async function saveDraftManual() {
    if (!id) return;
    const payload = contentRef.current;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const res = await apiFetch(`/api/v2/pages/${id}/draft`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to save draft');
      setMessage(`Draft saved (v${data.versionNo})`);
      setStatus('draft');
      setDirty(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  }

  const kbdRef = useRef({ saveDraftManual, undo, redo });
  kbdRef.current = { saveDraftManual, undo, redo };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void kbdRef.current.saveDraftManual();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        kbdRef.current.undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault();
        kbdRef.current.redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  async function savePageMeta() {
    if (!id) return;
    setError('');
    try {
      const res = await apiFetch(`/api/v2/pages/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: pageTitle, slug: pageSlug }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to update page');
      setTitle(data.page?.title || pageTitle);
      setSlug(data.page?.slug || pageSlug);
      setPageTitle(data.page?.title || pageTitle);
      setPageSlug(data.page?.slug || pageSlug);
      setMessage('Page title/slug updated.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update page');
    }
  }

  function openPublishModal() {
    const lint = lintV2PageContent(content);
    setPublishLint(lint);
    setShowPublishModal(true);
  }

  async function publish() {
    if (!id) return;
    const lint = lintV2PageContent(content);
    if (lint.errors.length > 0) {
      setError(lint.errors.map((x) => x.message).join('; '));
      return;
    }
    setPublishing(true);
    setError('');
    setMessage('');
    try {
      const res = await apiFetch(`/api/v2/pages/${id}/publish`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to publish');
      setMessage(`Published version v${data.publishedVersionNo}`);
      setStatus('published');
      setShowPublishModal(false);
      setPublishedSnapshot(cloneContent(content));
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
      const next: V2PageContent = { ...contentRef.current, blocks: incomingBlocks, labels: incomingLabels };
      recordStructural(next);
      setSelectedBlockId(incomingBlocks?.[0]?.id || '');
      setMessage('Legacy preview imported into editor (not yet saved).');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Migration preview failed');
    }
  }

  function applyTemplate(templateId: string) {
    const t = V2_PAGE_TEMPLATES.find((x) => x.id === templateId);
    if (!t) return;
    if (!window.confirm('Replace all blocks with this template?')) return;
    recordStructural(cloneContent(t.content));
    setSelectedBlockId(t.content.blocks[0]?.id || '');
  }

  function saveCurrentAsSnippet() {
    const name = snippetName.trim() || `Snippet ${new Date().toLocaleString()}`;
    saveSnippet(name, contentRef.current);
    setSnippets(listSnippets());
    setSnippetName('');
    setMessage('Snippet saved in this browser.');
  }

  function loadSnippet(snippetId: string) {
    const s = snippets.find((x) => x.id === snippetId);
    if (!s) return;
    if (!window.confirm('Replace editor content with this snippet?')) return;
    recordStructural(cloneContent(s.content));
    setSelectedBlockId(s.content.blocks[0]?.id || '');
  }

  async function downloadExport() {
    if (!id) return;
    try {
      const res = await apiFetch(`/api/v2/pages/${id}/export.json`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'Export failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `v2-${slug || id}.json`;
      a.rel = 'noopener';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed');
    }
  }

  const publishDiffSummary = useMemo(() => {
    if (!publishedSnapshot) return 'No published version yet (first publish).';
    const a = JSON.stringify(publishedSnapshot.blocks);
    const b = JSON.stringify(content.blocks);
    const labelsA = JSON.stringify(publishedSnapshot.labels || {});
    const labelsB = JSON.stringify(content.labels || {});
    const changed = a !== b || labelsA !== labelsB;
    return changed
      ? 'Draft differs from last published version (blocks or labels changed).'
      : 'Draft matches published block/label data.';
  }, [publishedSnapshot, content]);

  const seo = useMemo(() => {
    const m = content.meta;
    if (!m || typeof m !== 'object' || Array.isArray(m)) return { metaTitle: '', metaDescription: '', ogImage: '' };
    const s = (m as { seo?: Record<string, unknown> }).seo;
    if (!s || typeof s !== 'object') return { metaTitle: '', metaDescription: '', ogImage: '' };
    return {
      metaTitle: typeof s.metaTitle === 'string' ? s.metaTitle : '',
      metaDescription: typeof s.metaDescription === 'string' ? s.metaDescription : '',
      ogImage: typeof s.ogImage === 'string' ? s.ogImage : '',
    };
  }, [content.meta]);

  function updateSeo(partial: Partial<{ metaTitle: string; metaDescription: string; ogImage: string }>) {
    setContent((prev) => {
      const base =
        prev.meta && typeof prev.meta === 'object' && !Array.isArray(prev.meta)
          ? (prev.meta as Record<string, unknown>)
          : {};
      const meta: Record<string, unknown> = { ...base, schemaVersion: 1 };
      const prevSeoRaw = meta.seo;
      const prevSeo =
        prevSeoRaw && typeof prevSeoRaw === 'object' && !Array.isArray(prevSeoRaw)
          ? { ...(prevSeoRaw as Record<string, string>) }
          : {};
      return {
        ...prev,
        meta: {
          ...meta,
          seo: { ...prevSeo, ...partial },
        },
      };
    });
  }

  if (loading) return <p>Loading V2 editor...</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">V2 Editor</h1>
          <p className="text-sm text-slate-500">
            {title} | /v2/{slug} | {status}
            {dirty && <span className="ml-2 text-amber-600">Unsaved changes</span>}
            {autosaveState === 'saving' && <span className="ml-2 text-slate-500">Autosaving…</span>}
            {autosaveState === 'saved' && <span className="ml-2 text-green-600">Autosaved</span>}
            {autosaveState === 'error' && <span className="ml-2 text-red-600">Autosave failed</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/v2/pages" className="px-3 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50">
            Back
          </Link>
          <Link to="/admin/content" className="px-3 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50" target="_blank" rel="noreferrer">
            Legacy media uploads
          </Link>
          <Link to={`/v2/${slug}`} target="_blank" rel="noreferrer" className="px-3 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50">
            Open public
          </Link>
          <a
            href={`/api/v2/sitemap.xml`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
          >
            Sitemap XML
          </a>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 grid md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-600">Page title (DB)</label>
          <input
            className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
            value={pageTitle}
            onChange={(e) => setPageTitle(e.target.value)}
            aria-label="Page title"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Slug</label>
          <input
            className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
            value={pageSlug}
            onChange={(e) => setPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            aria-label="Page slug"
          />
          <p className="text-[11px] text-slate-500 mt-1">Changing slug keeps old URL via redirect.</p>
        </div>
        <button type="button" onClick={() => void savePageMeta()} className="md:col-span-2 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm">
          Save page title & slug
        </button>
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
          <div className="space-y-2 max-h-[320px] overflow-auto pr-1">
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
                  <span className="text-slate-400" aria-hidden>
                    ≡
                  </span>
                  <span>
                    {i + 1}. {V2_BLOCK_TYPE_LABELS[b.type] ?? b.type}
                  </span>
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
              <option key={o.type} value={o.type}>
                {o.label}
              </option>
            ))}
          </select>

          <div className="border-t border-slate-200 pt-2 space-y-2">
            <p className="text-xs font-medium text-slate-600">Template</p>
            <select
              className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm"
              aria-label="Apply template"
              defaultValue=""
              onChange={(e) => {
                const v = e.target.value;
                if (v) applyTemplate(v);
                e.currentTarget.value = '';
              }}
            >
              <option value="">Apply template…</option>
              {V2_PAGE_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="border-t border-slate-200 pt-2 space-y-2">
            <p className="text-xs font-medium text-slate-600">Snippet library (this browser)</p>
            <div className="flex gap-1">
              <input
                className="flex-1 text-xs px-2 py-1 border border-slate-300 rounded"
                placeholder="Snippet name"
                value={snippetName}
                onChange={(e) => setSnippetName(e.target.value)}
                aria-label="Snippet name"
              />
              <button type="button" className="text-xs px-2 py-1 border rounded border-slate-300" onClick={saveCurrentAsSnippet}>
                Save
              </button>
            </div>
            <select
              className="w-full text-sm border border-slate-300 rounded-lg px-2 py-1"
              aria-label="Load snippet"
              defaultValue=""
              onChange={(e) => {
                const v = e.target.value;
                if (v) loadSnippet(v);
                e.currentTarget.value = '';
              }}
            >
              <option value="">Load snippet…</option>
              {snippets.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {snippets.length > 0 && (
              <button
                type="button"
                className="text-xs text-red-600"
                onClick={() => {
                  const last = snippets[0];
                  if (last && window.confirm('Delete newest snippet?')) {
                    deleteSnippet(last.id);
                    setSnippets(listSnippets());
                  }
                }}
              >
                Delete newest snippet
              </button>
            )}
          </div>

          <button type="button" onClick={() => void importLegacyPreview()} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50">
            Import Legacy Preview
          </button>
          <div className="flex gap-2">
            <button type="button" className="flex-1 text-sm px-2 py-1 border rounded border-slate-300" onClick={undo} disabled={past.length === 0}>
              Undo
            </button>
            <button type="button" className="flex-1 text-sm px-2 py-1 border rounded border-slate-300" onClick={redo} disabled={future.length === 0}>
              Redo
            </button>
          </div>
        </aside>

        <section className="bg-slate-100 border border-slate-200 rounded-xl p-4 space-y-3 flex flex-col max-h-[calc(100vh-8rem)]">
          <div className="flex flex-wrap items-center gap-2 shrink-0">
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
            <div className="flex items-center gap-1 text-xs text-slate-600">
              <span className="uppercase tracking-wide">Zoom</span>
              <button
                type="button"
                className="px-2 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50"
                onClick={() => setPreviewZoom((z) => Math.max(25, z - 10))}
                aria-label="Zoom out preview"
                title="Zoom out"
              >
                -
              </button>
              <select
                className="px-2 py-1 rounded border border-slate-300 bg-white"
                value={previewZoom}
                onChange={(e) => setPreviewZoom(Number(e.target.value))}
                aria-label="Preview zoom level"
              >
                {[25, 50, 67, 75, 90, 100, 110, 125, 150, 175, 200].map((z) => (
                  <option key={z} value={z}>
                    {z}%
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="px-2 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50"
                onClick={() => setPreviewZoom((z) => Math.min(200, z + 10))}
                aria-label="Zoom in preview"
                title="Zoom in"
              >
                +
              </button>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 text-center shrink-0">Click a block in the preview to select it in the inspector.</p>
          <div className="flex justify-center overflow-auto flex-1 min-h-0 pr-0.5">
            <div ref={previewCanvasRef} className="w-full flex justify-center">
              <div
                className={`${previewWidthClass} transition-all duration-200 relative`}
                style={{
                  ...(previewViewport === 'desktop' ? {} : { width: `${previewWidthPxInput}px` }),
                  transform: `scale(${previewScale})`,
                  transformOrigin: 'top center',
                }}
              >
                <BlockRenderer
                  blocks={content.blocks}
                  selectedBlockId={selectedBlockId}
                  onBlockSelect={(blockId) => {
                    setSelectedBlockId(blockId);
                    setInspectorTab('block');
                  }}
                />
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

        <aside className="bg-white border border-slate-200 rounded-xl p-3 space-y-3 flex flex-col max-h-[calc(100vh-8rem)]">
          <h2 className="font-semibold text-slate-800 shrink-0">Inspector</h2>
          <div className="flex rounded-lg border border-slate-200 overflow-hidden text-sm shrink-0">
            <button
              type="button"
              className={`flex-1 px-2 py-1.5 ${inspectorTab === 'block' ? 'bg-slate-800 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
              onClick={() => setInspectorTab('block')}
            >
              This block
            </button>
            <button
              type="button"
              className={`flex-1 px-2 py-1.5 border-l border-slate-200 ${inspectorTab === 'page' ? 'bg-slate-800 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
              onClick={() => setInspectorTab('page')}
            >
              Page settings
            </button>
          </div>

          <div className="space-y-3 overflow-y-auto flex-1 min-h-0 pr-0.5">
            {inspectorTab === 'page' ? (
              <div className="space-y-4">
                <Link
                  to={`/v2/${slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm font-medium hover:bg-blue-100"
                >
                  View live page
                </Link>
                <div className="space-y-2 border-b border-slate-200 pb-3">
                  <p className="text-xs font-medium text-slate-700">Search &amp; sharing</p>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    This text may appear in Google results and when someone shares your page on social media.
                  </p>
                  <label className="text-[11px] text-slate-600">Title in search results (optional)</label>
                  <input
                    className="w-full text-sm px-2 py-1 border border-slate-300 rounded"
                    value={seo.metaTitle}
                    onChange={(e) => updateSeo({ metaTitle: e.target.value })}
                    aria-label="Search result title"
                  />
                  <label className="text-[11px] text-slate-600">Short description</label>
                  <textarea
                    className="w-full text-sm px-2 py-1 border border-slate-300 rounded min-h-[60px]"
                    value={seo.metaDescription}
                    onChange={(e) => updateSeo({ metaDescription: e.target.value })}
                    aria-label="Search and social description"
                  />
                  <label className="text-[11px] text-slate-600">Social preview image (address)</label>
                  <input
                    className="w-full text-sm px-2 py-1 border border-slate-300 rounded font-mono"
                    value={seo.ogImage}
                    onChange={(e) => updateSeo({ ogImage: e.target.value })}
                    aria-label="Social sharing image URL"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-700">Page wording</p>
                  <PageLabelsEditor
                    labels={content.labels || {}}
                    onChange={(labels) => setContent((prev) => ({ ...prev, labels }))}
                  />
                </div>
              </div>
            ) : selectedBlock ? (
              <>
                <BlockInspector
                  key={selectedBlock.id}
                  block={selectedBlock}
                  pageId={id}
                  onChangeProps={updateSelectedProps}
                  onChangeVisibility={(visible) =>
                    setContent((prev) => ({
                      ...prev,
                      blocks: prev.blocks.map((b) => (b.id === selectedBlock.id ? { ...b, visibility: visible } : b)),
                    }))
                  }
                />
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" className="px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm" onClick={() => moveBlock(selectedBlock.id, -1)}>
                    Move up
                  </button>
                  <button type="button" className="px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm" onClick={() => moveBlock(selectedBlock.id, 1)}>
                    Move down
                  </button>
                </div>
                <button type="button" className="w-full px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm" onClick={duplicateBlock}>
                  Duplicate block
                </button>
                <button type="button" className="w-full px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50" onClick={removeSelected}>
                  Remove block
                </button>
              </>
            ) : (
              <p className="text-sm text-slate-500">Select a block in the list, or open Page settings for SEO and labels.</p>
            )}
          </div>

          <hr className="shrink-0" />
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => void saveDraftManual()}
              disabled={saving}
              className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button type="button" onClick={openPublishModal} disabled={publishing} className="w-full px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
              Publish…
            </button>
            <button
              type="button"
              onClick={() => void downloadExport()}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-sm"
            >
              Export JSON
            </button>
            <p className="text-[10px] text-slate-500">Shortcuts: Ctrl+S save, Ctrl+Z / Ctrl+Shift+Z undo/redo</p>
          </div>
        </aside>
      </div>

      {showPublishModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="publish-modal-title">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <h2 id="publish-modal-title" className="text-lg font-semibold">
              Publish
            </h2>
            <p className="text-sm text-slate-600">{publishDiffSummary}</p>
            {publishLint && publishLint.errors.length > 0 && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                <p className="font-medium">Errors (must fix)</p>
                <ul className="list-disc pl-5 mt-1">
                  {publishLint.errors.map((e, i) => (
                    <li key={i}>
                      {e.message}
                      {e.blockId && (
                        <button type="button" className="ml-2 text-blue-600 underline" onClick={() => setSelectedBlockId(e.blockId || '')}>
                          Select block
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {publishLint && publishLint.warnings.length > 0 && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
                <p className="font-medium">Warnings</p>
                <ul className="list-disc pl-5 mt-1">
                  {publishLint.warnings.slice(0, 8).map((w, i) => (
                    <li key={i}>{w.message}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" className="px-4 py-2 border border-slate-300 rounded-lg" onClick={() => setShowPublishModal(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg disabled:opacity-50"
                disabled={publishing || (publishLint?.errors.length ?? 0) > 0}
                onClick={() => void publish()}
              >
                {publishing ? 'Publishing…' : 'Confirm publish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
