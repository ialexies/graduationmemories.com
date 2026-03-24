import type { TranscriptWord } from '../types';

/** Parse Google Cloud Speech-to-Text JSON into normalized word list */
export function parseGoogleSpeechToText(json: unknown): TranscriptWord[] {
  const words: TranscriptWord[] = [];
  try {
    const obj = json as { results?: Array<{ alternatives?: Array<{ words?: Array<{ startOffset?: string; endOffset?: string; word?: string }> }> }> };
    const results = obj?.results ?? [];
    for (const r of results) {
      const alt = r.alternatives?.[0];
      const w = alt?.words ?? [];
      for (const item of w) {
        const start = parseOffset(item.startOffset);
        const end = parseOffset(item.endOffset);
        const word = item.word?.trim();
        if (word != null && word !== '' && !Number.isNaN(start) && !Number.isNaN(end)) {
          words.push({ start, end, word });
        }
      }
    }
  } catch (_) {
    return [];
  }
  return words;
}

function parseOffset(s: string | undefined): number {
  if (!s || typeof s !== 'string') return NaN;
  const match = s.match(/^([\d.]+)s$/);
  return match ? parseFloat(match[1]) : NaN;
}
