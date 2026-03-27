import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const navLinks = [
  { to: '/admin', label: 'Dashboard', adminOnly: false },
  { to: '/admin/content', label: 'Content', adminOnly: false },
  { to: '/admin/footer', label: 'Footer', adminOnly: false },
  { to: '/admin/pages', label: 'Pages', adminOnly: true },
  { to: '/admin/v2/pages', label: 'V2 Pages', adminOnly: false },
  { to: '/admin/tokens', label: 'Tokens', adminOnly: true },
  { to: '/admin/users', label: 'Users', adminOnly: true },
  { to: '/admin/backup', label: 'Backup', adminOnly: true },
];

function MenuIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/admin/login', { replace: true });
  }

  const linkClass = "block py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg px-3";

  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="md:hidden p-2 -ml-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
          <div className="hidden md:flex gap-6">
            {navLinks.map(({ to, label, adminOnly }) => {
              if (adminOnly && !isAdmin) return null;
              return (
                <Link key={to} to={to} className="text-slate-600 hover:text-slate-800 first:font-semibold first:text-slate-800">
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <span className="text-sm text-slate-500 truncate max-w-[120px] sm:max-w-none" title={user?.email}>
            {user?.email}
          </span>
          <button
            onClick={handleLogout}
            className="text-sm text-slate-600 hover:text-slate-800 whitespace-nowrap"
          >
            Logout
          </button>
        </div>
      </nav>

      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-10 bg-slate-900/50 md:hidden"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
          <div className="fixed top-[49px] left-0 right-0 z-20 md:hidden bg-white border-b border-slate-200 shadow-lg">
            <div className="px-4 py-3 flex flex-col gap-1">
              {navLinks.map(({ to, label, adminOnly }) => {
                if (adminOnly && !isAdmin) return null;
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMenuOpen(false)}
                    className={linkClass}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}

      <main className="p-4 sm:p-6 w-full max-w-none">
        <Outlet />
      </main>
    </div>
  );
}
