import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import { usePosts } from './hooks/usePosts';
import { PostPage } from './pages/PostPage';
import { NotFoundPage } from './pages/NotFoundPage';

function PostRoute() {
  const { id } = useParams<{ id: string }>();
  const { loading, error, getPost, getFooter } = usePosts();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-red-500">Failed to load content.</div>
      </div>
    );
  }

  if (!id) {
    return <NotFoundPage />;
  }

  const post = getPost(id);
  const footer = getFooter();

  if (!post || !footer) {
    return <NotFoundPage />;
  }

  return <PostPage post={post} footer={footer} />;
}

function RootRoute() {
  return <NotFoundPage />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route path="/:id" element={<PostRoute />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
