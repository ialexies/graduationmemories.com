import { BrowserRouter, Routes, Route, useParams, useSearchParams } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PageLoaderSkeleton } from './components/Skeleton';
import { ToastProvider } from './contexts/ToastContext';
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
import { BackupPage } from './pages/admin/BackupPage';

const TOKEN_STORAGE_PREFIX = 'gm_token_';

function PostRoute() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('t');
  const tokenFromStorage = id ? sessionStorage.getItem(`${TOKEN_STORAGE_PREFIX}${id}`) : null;
  const token = tokenFromUrl || tokenFromStorage;
  const { post, footer, labels, sectionVisibility, colorTheme, type, loading, error } = usePost(id, token);

  if (loading) {
    return <PageLoaderSkeleton />;
  }

  if (error) {
    return <AccessDeniedPage reason={error} />;
  }

  if (!post || !footer) {
    return <AccessDeniedPage reason="not_found" />;
  }

  return <PostPage post={post} footer={footer} labels={labels} sectionVisibility={sectionVisibility} colorTheme={colorTheme} pageType={type} />;
}

function RootRoute() {
  return <NotFoundPage />;
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
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
                  <Route path="backup" element={<RequireAdmin><BackupPage /></RequireAdmin>} />
                </Route>
              </Route>
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
