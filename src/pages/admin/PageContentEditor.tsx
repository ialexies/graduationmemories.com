import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../../lib/api';
import type { Post, Student, PageType, PageLabels, SectionVisibility } from '../../types';

const inputClass =
  'w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
const labelClass = 'block text-sm font-medium text-slate-600 mb-1';

const PAGE_TYPE_OPTIONS: { value: PageType; label: string }[] = [
  { value: 'graduation', label: 'Graduation' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'event', label: 'Event' },
];

const SECTION_OPTIONS: { key: keyof SectionVisibility; label: string }[] = [
  { key: 'classPhoto', label: 'Class / cover photo' },
  { key: 'gallery', label: 'Image gallery' },
  { key: 'teacherMessage', label: 'Message block' },
  { key: 'peopleList', label: 'People list (students/guests)' },
];

function ImagePreview({ src, alt, size = 'md', className = '' }: { src: string; alt: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const [errored, setErrored] = useState(false);
  const sizeClass = size === 'lg' ? 'w-24 h-24' : size === 'sm' ? 'w-12 h-12' : 'w-14 h-14';
  if (!src?.trim()) return null;
  return (
    <div className={`shrink-0 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 ${sizeClass} ${className}`}>
      {errored ? (
        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">?</div>
      ) : (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setErrored(true)}
        />
      )}
    </div>
  );
}

function ImageUploadSlot({
  src,
  onRemove,
  onFileChange,
  label,
  uploading,
  inputRef,
  size = 'md',
  required,
}: {
  src: string;
  onRemove: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  uploading: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  size?: 'sm' | 'md' | 'lg';
  required?: boolean;
}) {
  const hasImage = !!src?.trim();
  return (
    <div className="space-y-2">
      <label className={labelClass}>{label}{required && ' *'}</label>
      <div className="flex items-start gap-4">
        {hasImage ? (
          <div className="relative group">
            <ImagePreview src={src} alt={label} size={size} />
            <button
              type="button"
              onClick={onRemove}
              className="absolute top-1 right-1 px-2 py-1 text-xs bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className={`flex items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500 ${size === 'lg' ? 'w-24 h-24' : size === 'sm' ? 'w-12 h-12' : 'w-14 h-14'}`}>
            <span className="text-xs">No image</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          aria-label={`Upload ${label}`}
          onChange={onFileChange}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 text-sm"
        >
          {uploading ? 'Uploading…' : hasImage ? 'Replace' : 'Upload photo'}
        </button>
      </div>
    </div>
  );
}

export function PageContentEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [pageType, setPageType] = useState<PageType>('graduation');
  const [labels, setLabels] = useState<PageLabels | null>(null);
  const [sectionVisibility, setSectionVisibility] = useState<SectionVisibility>({
    classPhoto: true,
    gallery: true,
    teacherMessage: true,
    peopleList: true,
  });
  const [showCustomLabels, setShowCustomLabels] = useState(false);
  const [metaSaved, setMetaSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [metaSaving, setMetaSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const classPhotoInputRef = useRef<HTMLInputElement>(null);
  const teacherPhotoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      apiFetch(`/api/admin/pages/${id}/content`).then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          const msg = data?.error || (r.status === 401 ? 'Please log in' : r.status === 403 ? 'Access denied to this page' : r.status === 404 ? 'Content not found' : 'Failed to load');
          throw new Error(msg);
        }
        return data;
      }),
      apiFetch(`/api/admin/pages/${id}/meta`).then(async (r) => {
        if (!r.ok) return { type: 'graduation' as PageType, labels: null };
        return r.json();
      }),
    ])
      .then(([contentData, metaData]) => {
        setPost(contentData);
        setPageType(metaData?.type ?? 'graduation');
        setLabels(metaData?.labels ?? null);
        setSectionVisibility((prev) => ({ ...prev, ...metaData?.sectionVisibility }));
      })
      .catch((e) => setError(e.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [id]);

  function update<K extends keyof Post>(key: K, value: Post[K]) {
    setPost((p) => (p ? { ...p, [key]: value } : null));
  }

  function addStudent() {
    setPost((p) => (p ? { ...p, students: [...p.students, { name: '' }] } : null));
  }

  function removeStudent(idx: number) {
    setPost((p) =>
      p ? { ...p, students: p.students.filter((_, i) => i !== idx) } : null
    );
  }

  function updateStudent(idx: number, field: keyof Student, value: string | boolean) {
    setPost((p) => {
      if (!p) return null;
      const next = [...p.students];
      next[idx] = { ...next[idx], [field]: value };
      return { ...p, students: next };
    });
  }

  function removeGalleryUrl(idx: number) {
    setPost((p) =>
      p ? { ...p, gallery: p.gallery.filter((_, i) => i !== idx) } : null
    );
  }

  function addGalleryUrlsBulk(paths: string[]) {
    const trimmed = paths.map((p) => p.trim()).filter(Boolean);
    if (trimmed.length === 0) return;
    setPost((p) => (p ? { ...p, gallery: [...p.gallery, ...trimmed] } : null));
  }

  async function uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiFetch(`/api/admin/pages/${id}/upload`, { method: 'POST', body: formData });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || `Upload failed (${res.status})`);
    }
    const data = await res.json();
    return data.path as string;
  }

  async function handleClassPhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    if (!file || !post || !id) return;
    input.value = '';
    setUploading(true);
    setError('');
    try {
      const path = await uploadImage(file);
      update('classPhoto', path);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleTeacherPhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    if (!file || !post || !id) return;
    input.value = '';
    setUploading(true);
    setError('');
    try {
      const path = await uploadImage(file);
      update('teacherPhoto', path);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const fileList = input.files;
    if (!fileList?.length || !post || !id) return;
    const files = Array.from(fileList);
    input.value = '';
    setUploading(true);
    setError('');
    try {
      const paths: string[] = [];
      for (const file of files) {
        const path = await uploadImage(file);
        paths.push(path);
      }
      addGalleryUrlsBulk(paths);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function saveMetaSettings() {
    if (!id) return;
    setMetaSaving(true);
    setError('');
    setMetaSaved(false);
    try {
      const res = await apiFetch(`/api/admin/pages/${id}/meta`, {
        method: 'PUT',
        body: JSON.stringify({ type: pageType, labels: labels || undefined, sectionVisibility }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Failed to save (${res.status})`);
      }
      setMetaSaved(true);
      setTimeout(() => setMetaSaved(false), 3000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to save';
      const isParseError = msg.includes('JSON') || msg.includes('Unexpected token') || msg.toLowerCase().includes('fetch');
      setError(isParseError ? 'Network error. Is the API server running? Try: npm run dev:server' : msg);
    } finally {
      setMetaSaving(false);
    }
  }

  function updateLabel<K extends keyof PageLabels>(key: K, value: string) {
    setLabels((l) => ({ ...(l || {} as PageLabels), [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!post || !id) return;
    if (sectionVisibility.classPhoto !== false && !post.classPhoto?.trim()) {
      setError('Please upload a class photo.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      // Save both content and page settings (type, labels, section visibility)
      const [contentRes, metaRes] = await Promise.all([
        apiFetch(`/api/admin/pages/${id}/content`, {
          method: 'PUT',
          body: JSON.stringify(post),
        }),
        apiFetch(`/api/admin/pages/${id}/meta`, {
          method: 'PUT',
          body: JSON.stringify({ type: pageType, labels: labels || undefined, sectionVisibility }),
        }),
      ]);
      if (!contentRes.ok) {
        const data = await contentRes.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to save content');
      }
      if (!metaRes.ok) {
        const data = await metaRes.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to save page settings');
      }
      navigate('/admin/content', { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-slate-500">Loading...</div>;
  if (error && !post) {
    const isNetworkError = error.toLowerCase().includes('fetch') || error.toLowerCase().includes('network');
    return (
      <div className="space-y-4">
        <p className="text-red-500">{error}</p>
        {isNetworkError && (
          <p className="text-sm text-slate-500">
            Make sure the API server is running: <code className="bg-slate-100 px-1 rounded">npm run dev:server</code>
          </p>
        )}
        <div className="flex gap-4">
          <Link to="/admin/content" className="text-blue-600 hover:underline">← Back to content</Link>
          {(error.toLowerCase().includes('log in') || error.toLowerCase().includes('unauthorized')) && (
            <Link to="/admin/login" className="text-blue-600 hover:underline">Go to login</Link>
          )}
        </div>
      </div>
    );
  }
  if (!post) return null;

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link to="/admin/content" className="text-slate-600 hover:text-slate-800">
          ← Back to content
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">Edit: {id}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            <p className="font-medium">{error}</p>
            {error.toLowerCase().includes('fetch') && (
              <p className="text-sm mt-1">Make sure the API server is running: <code className="bg-red-100 px-1 rounded">npm run dev:server</code></p>
            )}
          </div>
        )}

        <div className="bg-white rounded-xl shadow border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-800">Page type & visible sections</h2>
          <p className="text-sm text-slate-500">Choose how labels appear and which sections to show on the public page.</p>
          <div>
            <label className={labelClass}>Visible sections</label>
            <div className="flex flex-wrap gap-4 mt-2">
              {SECTION_OPTIONS.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sectionVisibility[key] !== false}
                    onChange={(e) => setSectionVisibility((v) => ({ ...v, [key]: e.target.checked }))}
                    className="rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-700">{label}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-1">Uncheck to hide a section from the public page. Click &quot;Save&quot; at the bottom to save everything, or &quot;Save page settings&quot; to save only these options.</p>
          </div>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label htmlFor="pageType" className={labelClass}>Type</label>
              <select
                id="pageType"
                value={pageType}
                onChange={(e) => setPageType(e.target.value as PageType)}
                className={inputClass}
              >
                {PAGE_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => setShowCustomLabels(!showCustomLabels)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {showCustomLabels ? 'Hide custom labels' : 'Custom labels...'}
            </button>
            <button
              type="button"
              onClick={saveMetaSettings}
              disabled={metaSaving}
              className="py-2 px-4 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50"
            >
              {metaSaving ? 'Saving...' : metaSaved ? 'Saved!' : 'Save page settings'}
            </button>
          </div>
          {showCustomLabels && (
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
              <p className="text-sm text-slate-500">Override labels shown on the page. Leave blank to use defaults for the selected type.</p>
              {(['themeLabel', 'titleLabel', 'subtitleLabel', 'peopleLabel', 'peopleTagLabel', 'messageLabel', 'messageAuthorLabel'] as const).map((key) => (
                <div key={key}>
                  <label htmlFor={key} className={labelClass}>{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                  <input
                    id={key}
                    type="text"
                    value={labels?.[key] ?? ''}
                    onChange={(e) => updateLabel(key, e.target.value)}
                    placeholder={key}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-800">Section & basic info</h2>
          <div>
            <label htmlFor="sectionName" className={labelClass}>Section name</label>
            <input
              id="sectionName"
              type="text"
              value={post.sectionName}
              onChange={(e) => update('sectionName', e.target.value)}
              className={inputClass}
              required
            />
          </div>
          {sectionVisibility.classPhoto !== false && (
            <>
              <div>
                <label htmlFor="batch" className={labelClass}>Batch</label>
                <input
                  id="batch"
                  type="text"
                  value={post.batch}
                  onChange={(e) => update('batch', e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label htmlFor="location" className={labelClass}>Location</label>
                <input
                  id="location"
                  type="text"
                  value={post.location}
                  onChange={(e) => update('location', e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
            </>
          )}
          <div>
            <label htmlFor="quote" className={labelClass}>Quote</label>
            <input
              id="quote"
              type="text"
              value={post.quote}
              onChange={(e) => update('quote', e.target.value)}
              className={inputClass}
              required
            />
          </div>
        </div>

        {(sectionVisibility.classPhoto !== false || sectionVisibility.gallery !== false) && (
          <div className="bg-white rounded-xl shadow border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">Images</h2>
              {uploading && <span className="text-sm text-amber-600 font-medium">Uploading…</span>}
            </div>
            {sectionVisibility.classPhoto !== false && (
              <ImageUploadSlot
                src={post.classPhoto}
                onRemove={() => update('classPhoto', '')}
                onFileChange={handleClassPhotoUpload}
                label="Class photo"
                uploading={uploading}
                inputRef={classPhotoInputRef}
                size="lg"
                required
              />
            )}
            {sectionVisibility.gallery !== false && (
              <div className="space-y-3">
                <label className={labelClass}>Gallery</label>
                <div className="flex gap-2 items-center mb-2">
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    multiple
                    className="hidden"
                    aria-label="Upload gallery images"
                    onChange={handleGalleryUpload}
                  />
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={uploading}
                    className="text-sm py-1.5 px-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50"
                  >
                    {uploading ? 'Uploading…' : 'Upload images'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {post.gallery.length === 0 ? (
                    <div className="flex items-center justify-center w-14 h-14 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500 text-xs">
                      No images yet
                    </div>
                  ) : (
                    post.gallery.map((url, idx) => (
                      <div key={idx} className="relative group">
                        <ImagePreview src={url} alt={`Gallery ${idx + 1}`} size="md" />
                        <button
                          type="button"
                          onClick={() => removeGalleryUrl(idx)}
                          className="absolute top-1 right-1 px-2 py-1 text-xs bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {sectionVisibility.teacherMessage !== false && (
          <div className="bg-white rounded-xl shadow border border-slate-200 p-6 space-y-4">
            <h2 className="font-semibold text-slate-800">Teacher</h2>
          <div>
            <label htmlFor="teacherName" className={labelClass}>Teacher name</label>
            <input
              id="teacherName"
              type="text"
              value={post.teacherName}
              onChange={(e) => update('teacherName', e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label htmlFor="teacherTitle" className={labelClass}>Teacher title</label>
            <input
              id="teacherTitle"
              type="text"
              value={post.teacherTitle}
              onChange={(e) => update('teacherTitle', e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <ImageUploadSlot
            src={post.teacherPhoto || ''}
            onRemove={() => update('teacherPhoto', '')}
            onFileChange={handleTeacherPhotoUpload}
            label="Teacher photo"
            uploading={uploading}
            inputRef={teacherPhotoInputRef}
            size="lg"
          />
          <div>
            <label htmlFor="teacherMessage" className={labelClass}>Teacher message</label>
            <textarea
              id="teacherMessage"
              value={post.teacherMessage}
              onChange={(e) => update('teacherMessage', e.target.value)}
              rows={4}
              className={inputClass}
              required
            />
          </div>
          </div>
        )}

        {sectionVisibility.peopleList !== false && (
          <div className="bg-white rounded-xl shadow border border-slate-200 p-6 space-y-4">
            <h2 className="font-semibold text-slate-800">Students</h2>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-500">Add students with optional honor flag</span>
            <button
              type="button"
              onClick={addStudent}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              + Add student
            </button>
          </div>
          {post.students.map((s, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <input
                type="text"
                value={s.name}
                onChange={(e) => updateStudent(idx, 'name', e.target.value)}
                placeholder="Student name"
                aria-label={`Student ${idx + 1} name`}
                className={inputClass}
              />
              <label className="flex items-center gap-2 shrink-0">
                <input
                  type="checkbox"
                  checked={!!s.honor}
                  onChange={(e) => updateStudent(idx, 'honor', e.target.checked)}
                />
                <span className="text-sm text-slate-600">Honor</span>
              </label>
              <button
                type="button"
                onClick={() => removeStudent(idx)}
                className="px-3 py-2 text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ))}
          <div>
            <label className={labelClass}>Together since</label>
            <input
              type="text"
              value={post.togetherSince}
              onChange={(e) => update('togetherSince', e.target.value)}
              placeholder="June 2025"
              className={inputClass}
              required
            />
          </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="py-2 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <Link
            to="/admin/content"
            className="py-2 px-6 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
