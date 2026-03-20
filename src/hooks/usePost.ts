import { useState, useEffect } from 'react';
import type { Post, Footer as FooterType, PageType, PageLabels, SectionVisibility } from '../types';

interface UsePostResult {
  post: Post | null;
  footer: FooterType | null;
  type: PageType;
  labels: PageLabels | null;
  sectionVisibility: SectionVisibility | null;
  colorTheme: string;
  loading: boolean;
  error: 'token_required' | 'invalid' | 'disabled' | 'not_found' | 'network' | null;
}

const DEFAULT_LABELS: PageLabels = {
  themeLabel: 'Event Memories',
  titleLabel: 'Event',
  subtitleLabel: 'Date',
  peopleLabel: 'Attendees',
  peopleTagLabel: 'VIP',
  messageLabel: 'Message from Host',
  messageAuthorLabel: 'Host',
};

export function usePost(pageId: string | undefined, token: string | null): UsePostResult {
  const [post, setPost] = useState<Post | null>(null);
  const [footer, setFooter] = useState<FooterType | null>(null);
  const [type, setType] = useState<PageType>('event');
  const [labels, setLabels] = useState<PageLabels | null>(null);
  const [sectionVisibility, setSectionVisibility] = useState<SectionVisibility | null>(null);
  const [colorTheme, setColorTheme] = useState<string>('default');
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
        setType(data.type || 'event');
        setLabels(data.labels || DEFAULT_LABELS);
        setSectionVisibility(data.sectionVisibility || { classPhoto: true, gallery: true, teacherMessage: true, teacherAudio: true, peopleList: true, studentPhotos: false });
        setColorTheme(data.colorTheme || 'default');
        sessionStorage.setItem(`gm_token_${pageId}`, token);
        window.history.replaceState(null, '', `/${pageId}`);
      })
      .catch(() => setError('network'))
      .finally(() => setLoading(false));
  }, [pageId, token]);

  return { post, footer, type, labels, sectionVisibility, colorTheme, loading, error };
}
