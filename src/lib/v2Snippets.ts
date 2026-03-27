import type { V2PageContent } from '../types';

const KEY = 'v2-block-snippets-v1';

export type SavedSnippet = { id: string; name: string; content: V2PageContent };

function read(): SavedSnippet[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

function write(items: SavedSnippet[]) {
  localStorage.setItem(KEY, JSON.stringify(items.slice(0, 30)));
}

export function listSnippets(): SavedSnippet[] {
  return read();
}

export function saveSnippet(name: string, content: V2PageContent): SavedSnippet {
  const items = read();
  const id = `snip_${Date.now().toString(36)}`;
  const row: SavedSnippet = { id, name: name.trim() || 'Snippet', content: JSON.parse(JSON.stringify(content)) };
  items.unshift(row);
  write(items);
  return row;
}

export function deleteSnippet(id: string) {
  write(read().filter((x) => x.id !== id));
}
