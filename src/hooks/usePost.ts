import { useState, useEffect } from 'react';
import type { Post, Footer as FooterType } from '../types';

interface UsePostResult {
  post: Post | null;
  footer: FooterType | null;
  loading: boolean;
  error: 'token_required' | 'invalid' | 'disabled' | 'not_found' | 'network' | null;
}

export function usePost(pageId: string | undefined, token: string | null): UsePostResult {
  const [post, setPost] = useState<Post | null>(null);
  const [footer, setFooter] = useState<FooterType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<UsePostResult['error']>(null);

  useEffect(() => {
    if (!pageId) {
      setLoading(false);
      setError('not_found');
      return;
    }

    if (!token) {
      setLoading(false);
      setError('token_required');
      return;
    }

    setLoading(true);
    setError(null);

    const url = `/api/pages/${pageId}?t=${encodeURIComponent(token)}`;
    fetch(url)
      .then(async (res) => {
        if (res.status === 401) {
          sessionStorage.removeItem(`gm_token_${pageId}`);
          setError('invalid');
          return;
        }
        if (res.status === 403) {
          sessionStorage.removeItem(`gm_token_${pageId}`);
          setError('disabled');
          return;
        }
        if (res.status === 404) {
          setError('not_found');
          return;
        }
        if (!res.ok) {
          setError('network');
          return;
        }
        const data = await res.json();
        setPost(data.post);
        setFooter(data.footer);
        sessionStorage.setItem(`gm_token_${pageId}`, token);
        window.history.replaceState(null, '', `/${pageId}`);
      })
      .catch(() => setError('network'))
      .finally(() => setLoading(false));
  }, [pageId, token]);

  return { post, footer, loading, error };
}
