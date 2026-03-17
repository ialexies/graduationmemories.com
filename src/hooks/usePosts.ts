import { useState, useEffect, useCallback } from 'react';
import type { Post, PostsData } from '../types';

export function usePosts() {
  const [data, setData] = useState<PostsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetch('/data/posts.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load posts');
        return res.json();
      })
      .then((json: PostsData) => {
        setData(json);
        setError(null);
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, []);

  const getPost = useCallback(
    (id: string): Post | null => {
      if (!data?.posts || !id) return null;
      return data.posts[id] ?? null;
    },
    [data]
  );

  const getFooter = useCallback(() => data?.footer ?? null, [data]);

  return { data, loading, error, getPost, getFooter };
}
