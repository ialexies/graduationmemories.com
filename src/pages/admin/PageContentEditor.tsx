import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../../lib/api';
import type { Post, Student } from '../../types';

const inputClass =
  'w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
const labelClass = 'block text-sm font-medium text-slate-600 mb-1';

export function PageContentEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    apiFetch(`/api/admin/pages/${id}/content`)
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          const msg = data?.error || (r.status === 401 ? 'Please log in' : r.status === 403 ? 'Access denied to this page' : r.status === 404 ? 'Content not found' : 'Failed to load');
          throw new Error(msg);
        }
        return data;
      })
      .then(setPost)
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

  function addGalleryUrl() {
    setPost((p) => (p ? { ...p, gallery: [...p.gallery, ''] } : null));
  }

  function removeGalleryUrl(idx: number) {
    setPost((p) =>
      p ? { ...p, gallery: p.gallery.filter((_, i) => i !== idx) } : null
    );
  }

  function updateGalleryUrl(idx: number, value: string) {
    setPost((p) => {
      if (!p) return null;
      const next = [...p.gallery];
      next[idx] = value;
      return { ...p, gallery: next };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!post || !id) return;
    setSaving(true);
    setError('');
    try {
      const res = await apiFetch(`/api/admin/pages/${id}/content`, {
        method: 'PUT',
        body: JSON.stringify(post),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
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
        {error && <p className="text-red-500">{error}</p>}

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

        <div className="bg-white rounded-xl shadow border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-800">Images</h2>
          <div>
            <label className={labelClass}>Class photo path</label>
            <input
              type="text"
              value={post.classPhoto}
              onChange={(e) => update('classPhoto', e.target.value)}
              placeholder="/assets/h322x/class-photo.jpg"
              className={inputClass}
              required
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className={labelClass}>Gallery (image paths)</label>
              <button
                type="button"
                onClick={addGalleryUrl}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + Add URL
              </button>
            </div>
            {post.gallery.map((url, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => updateGalleryUrl(idx, e.target.value)}
                  placeholder="/assets/h322x/photos-slide/1.jpg"
                  aria-label={`Gallery image ${idx + 1}`}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => removeGalleryUrl(idx)}
                  className="px-3 py-2 text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

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
          <div>
            <label htmlFor="teacherPhoto" className={labelClass}>Teacher photo path</label>
            <input
              id="teacherPhoto"
              type="text"
              value={post.teacherPhoto || ''}
              onChange={(e) => update('teacherPhoto', e.target.value)}
              placeholder="/assets/h322x/teacher.jpg"
              className={inputClass}
            />
          </div>
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
