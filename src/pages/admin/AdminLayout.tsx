import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  function handleLogout() {
    logout();
    navigate('/admin/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <div className="flex gap-6">
          <Link to="/admin" className="font-semibold text-slate-800">
            Dashboard
          </Link>
          <Link to="/admin/content" className="text-slate-600 hover:text-slate-800">
            Content
          </Link>
          <Link to="/admin/footer" className="text-slate-600 hover:text-slate-800">
            Footer
          </Link>
          {isAdmin && (
            <>
              <Link to="/admin/pages" className="text-slate-600 hover:text-slate-800">
                Pages
              </Link>
              <Link to="/admin/tokens" className="text-slate-600 hover:text-slate-800">
                Tokens
              </Link>
              <Link to="/admin/users" className="text-slate-600 hover:text-slate-800">
                Users
              </Link>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-slate-600 hover:text-slate-800"
          >
            Logout
          </button>
        </div>
      </nav>
      <main className="p-6 max-w-4xl">
        <Outlet />
      </main>
    </div>
  );
}
