import { Link } from 'react-router-dom';

export function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/admin/pages"
          className="block p-6 bg-white rounded-xl shadow border border-slate-200 hover:border-blue-300"
        >
          <h2 className="font-semibold text-slate-800">Pages</h2>
          <p className="text-sm text-slate-500 mt-1">Enable or disable class pages</p>
        </Link>
        <Link
          to="/admin/tokens"
          className="block p-6 bg-white rounded-xl shadow border border-slate-200 hover:border-blue-300"
        >
          <h2 className="font-semibold text-slate-800">Tokens</h2>
          <p className="text-sm text-slate-500 mt-1">Create and revoke access tokens</p>
        </Link>
        <Link
          to="/admin/users"
          className="block p-6 bg-white rounded-xl shadow border border-slate-200 hover:border-blue-300"
        >
          <h2 className="font-semibold text-slate-800">Users</h2>
          <p className="text-sm text-slate-500 mt-1">Manage admin users</p>
        </Link>
      </div>
    </div>
  );
}
