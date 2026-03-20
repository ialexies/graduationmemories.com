import { BrowserRouter, Routes, Route, useParams, useSearchParams } from 'react-router-dom';
import { usePost } from './hooks/usePost';
import { PostPage } from './pages/PostPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AccessDeniedPage } from './pages/AccessDeniedPage';
import { AuthProvider } from './contexts/AuthContext';
import { AdminProtectedRoute } from './pages/admin/AdminProtectedRoute';
import { RequireAdmin } from './pages/admin/RequireAdmin';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminPagesPage } from './pages/admin/AdminPagesPage';
import { AdminContentPage } from './pages/admin/AdminContentPage';
import { PageContentEditor } from './pages/admin/PageContentEditor';
import { FooterEditorPage } from './pages/admin/FooterEditorPage';
import { AdminTokensPage } from './pages/admin/AdminTokensPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';

const TOKEN_STORAGE_PREFIX = 'gm_token_';

function PostRoute() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('t');
  const tokenFromStorage = id ? sessionStorage.getItem(`${TOKEN_STORAGE_PREFIX}${id}`) : null;
  const token = tokenFromUrl || tokenFromStorage;
  const { post, footer, loading, error } = usePost(id, token);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  if (error) {
    return <AccessDeniedPage reason={error} />;
  }

  if (!post || !footer) {
    return <AccessDeniedPage reason="not_found" />;
  }

  return <PostPage post={post} footer={footer} />;
}

function RootRoute() {
  return <NotFoundPage />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<RootRoute />} />
          <Route path="/:id" element={<PostRoute />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="content" element={<AdminContentPage />} />
              <Route path="content/:id" element={<PageContentEditor />} />
              <Route path="footer" element={<FooterEditorPage />} />
              <Route path="pages" element={<RequireAdmin><AdminPagesPage /></RequireAdmin>} />
              <Route path="tokens" element={<RequireAdmin><AdminTokensPage /></RequireAdmin>} />
              <Route path="users" element={<RequireAdmin><AdminUsersPage /></RequireAdmin>} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
