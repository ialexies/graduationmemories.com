import { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';

interface PageRow {
  id: string;
  label?: string | null;
}

export function BackupPage() {
  const { addToast } = useToast();
  const [pages, setPages] = useState<PageRow[]>([]);
  const [pageId, setPageId] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [confirmFull, setConfirmFull] = useState('');
  const [restoring, setRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState('');

  useEffect(() => {
    apiFetch('/api/admin/pages')
      .then((r) => r.json())
      .then((data) => {
        setPages(data.pages || []);
        if (data.pages?.length) setPageId(data.pages[0].id);
      })
      .catch(() => {});
  }, []);

  async function downloadFull() {
    setDownloading(true);
    try {
      const res = await apiFetch('/api/admin/backup');
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Download failed (${res.status})`);
      }
      const blob = await res.blob();
      const cd = res.headers.get('Content-Disposition');
      const match = cd?.match(/filename="([^"]+)"/);
      const name = match?.[1] || `gradmemories-backup-full-${new Date().toISOString().slice(0, 10)}.zip`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
      addToast('Backup downloaded', 'success');
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'Download failed', 'error');
    } finally {
      setDownloading(false);
    }
  }

  async function downloadPage() {
    if (!pageId) return;
    setDownloading(true);
    try {
      const res = await apiFetch(`/api/admin/backup?pageId=${encodeURIComponent(pageId)}`);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Download failed (${res.status})`);
      }
      const blob = await res.blob();
      const cd = res.headers.get('Content-Disposition');
      const match = cd?.match(/filename="([^"]+)"/);
      const name = match?.[1] || `gradmemories-backup-page-${pageId}.zip`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
      addToast('Page backup downloaded', 'success');
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'Download failed', 'error');
    } finally {
      setDownloading(false);
    }
  }

  async function handleRestore(e: React.FormEvent) {
    e.preventDefault();
    setRestoreError('');
    if (!restoreFile) {
      setRestoreError('Choose a backup ZIP file');
      return;
    }
    const formData = new FormData();
    formData.append('file', restoreFile);
    formData.append('confirm', confirmFull.trim() === 'RESTORE' ? 'RESTORE' : '');
    setRestoring(true);
    try {
      const res = await apiFetch('/api/admin/backup/restore', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Restore failed (${res.status})`);
      }
      addToast(data.message || 'Restore completed', 'success');
      setRestoreFile(null);
      setConfirmFull('');
    } catch (e) {
      setRestoreError(e instanceof Error ? e.message : 'Restore failed');
    } finally {
      setRestoring(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Backup &amp; restore</h1>
      <p className="text-slate-500 mb-6">
        Download a ZIP of the database and uploaded assets, or restore from a ZIP. Full restore replaces
        all users, pages, tokens, and files—treat backups as sensitive (password hashes and tokens inside).
      </p>

      <div className="bg-white rounded-xl shadow border border-slate-200 p-6 mb-6">
        <h2 className="font-semibold text-slate-800 mb-3">Export</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <button
            type="button"
            onClick={downloadFull}
            disabled={downloading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {downloading ? 'Preparing…' : 'Download full backup'}
          </button>
        </div>
        <p className="text-sm text-slate-500 mt-3">
          Includes all pages, users, tokens, footer, and files under <code className="text-xs bg-slate-100 px-1 rounded">assets/</code>.
        </p>

        <div className="mt-6 pt-6 border-t border-slate-100">
          <h3 className="text-sm font-medium text-slate-700 mb-2">Single page</h3>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm text-slate-600 mb-1">Page</label>
              <select
                value={pageId}
                onChange={(e) => setPageId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                aria-label="Page to export"
              >
                {pages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label?.trim() ? `${p.label} (${p.id})` : p.id}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={downloadPage}
              disabled={downloading || !pageId}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 font-medium"
            >
              Download page backup
            </button>
          </div>
          <p className="text-sm text-slate-500 mt-2">
            Merges into an existing site on restore (adds or overwrites that page). Tokens get new IDs;{' '}
            <code className="text-xs bg-slate-100 px-1 rounded">user_id</code> is cleared if that user does not exist locally.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-800 mb-3">Restore from ZIP</h2>
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          <strong>Full backup:</strong> type <code className="bg-amber-100 px-1 rounded">RESTORE</code> in the
          confirmation field. This deletes all current data and replaces it with the backup. You will likely need to log in
          again.
        </p>
        <p className="text-sm text-slate-600 mb-4">
          <strong>Page backup:</strong> leave confirmation empty (or anything other than RESTORE). Only that page and its
          assets are updated; the rest of the site is unchanged.
        </p>
        <form onSubmit={handleRestore} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Backup ZIP</label>
            <input
              type="file"
              accept=".zip,application/zip"
              onChange={(e) => setRestoreFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-600"
              aria-label="Backup ZIP file to restore"
            />
          </div>
          <div>
            <label htmlFor="confirm-restore" className="block text-sm font-medium text-slate-700 mb-1">
              Full restore confirmation
            </label>
            <input
              id="confirm-restore"
              type="text"
              value={confirmFull}
              onChange={(e) => setConfirmFull(e.target.value)}
              placeholder="Type RESTORE only for full site replace"
              className="w-full max-w-md px-3 py-2 border border-slate-300 rounded-lg"
              autoComplete="off"
            />
          </div>
          {restoreError && (
            <div className="text-red-600 text-sm" role="alert">
              {restoreError}
            </div>
          )}
          <button
            type="submit"
            disabled={restoring || !restoreFile}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
          >
            {restoring ? 'Restoring…' : 'Restore from ZIP'}
          </button>
        </form>
      </div>
    </div>
  );
}
