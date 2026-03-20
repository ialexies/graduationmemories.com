import { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

interface Page {
  id: string;
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'editor'>('admin');
  const [assignUserId, setAssignUserId] = useState<number | null>(null);
  const [assignPageId, setAssignPageId] = useState('');

  useEffect(() => {
    Promise.all([
      apiFetch('/api/admin/users').then((r) => r.json()),
      apiFetch('/api/admin/pages').then((r) => r.json()),
    ])
      .then(([userData, pageData]) => {
        setUsers(userData.users);
        setPages(pageData.pages);
        if (pageData.pages.length) setAssignPageId(pageData.pages[0].id);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password || !name) return;
    setCreating(true);
    setError('');
    try {
      const res = await apiFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({ email, password, name, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setUsers((prev) => [...prev, data]);
      setEmail('');
      setPassword('');
      setName('');
      setRole('admin');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setCreating(false);
    }
  }

  async function assignPage() {
    if (!assignUserId || !assignPageId) return;
    const res = await apiFetch('/api/admin/assign', {
      method: 'POST',
      body: JSON.stringify({ user_id: assignUserId, page_id: assignPageId }),
    });
    if (!res.ok) {
      setError('Failed to assign');
      return;
    }
    setAssignUserId(null);
    alert('Page assigned');
  }

  if (loading) return <div className="text-slate-500">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Users</h1>

      <div className="bg-white rounded-xl shadow border border-slate-200 p-6 mb-6">
        <h2 className="font-semibold text-slate-800 mb-3">Create User</h2>
        <form onSubmit={createUser} className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'editor')}
              className="px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow border border-slate-200 p-6 mb-6">
        <h2 className="font-semibold text-slate-800 mb-3">Assign Page to User</h2>
        <div className="flex gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">User</label>
            <select
              value={assignUserId ?? ''}
              onChange={(e) => setAssignUserId(e.target.value ? parseInt(e.target.value, 10) : null)}
              className="px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="">Select user</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Page</label>
            <select
              value={assignPageId}
              onChange={(e) => setAssignPageId(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg"
            >
              {pages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={assignPage}
            disabled={!assignUserId}
            className="py-2 px-4 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50"
          >
            Assign
          </button>
        </div>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-800">Name</th>
              <th className="text-left px-4 py-3 font-medium text-slate-800">Email</th>
              <th className="text-left px-4 py-3 font-medium text-slate-800">Role</th>
              <th className="text-left px-4 py-3 font-medium text-slate-800">Created</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 text-slate-800">{u.name}</td>
                <td className="px-4 py-3 text-slate-600">{u.email}</td>
                <td className="px-4 py-3 text-slate-500">{u.role}</td>
                <td className="px-4 py-3 text-slate-500 text-sm">{u.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
