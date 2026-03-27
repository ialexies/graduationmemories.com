import type { V2Block, V2PageContent } from '../types';

export type LintIssue = { level: 'error' | 'warning'; message: string; blockId?: string };

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function isProbablyUrl(s: string): boolean {
  const t = s.trim();
  if (!t || t === '#') return true;
  try {
    if (t.startsWith('/')) return true;
    const u = new URL(t);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function lintBlock(block: V2Block): LintIssue[] {
  const issues: LintIssue[] = [];
  const id = block.id;
  const p = block.props || {};

  if (block.visibility === false) return issues;

  switch (block.type) {
    case 'header':
      if (!str(p.title).trim()) issues.push({ level: 'error', message: 'Header: title is empty', blockId: id });
      break;
    case 'richText':
      if (!str(p.content).trim()) issues.push({ level: 'warning', message: 'Rich text: content is empty', blockId: id });
      break;
    case 'cta': {
      const href = str(p.href);
      if (!str(p.label).trim()) issues.push({ level: 'warning', message: 'CTA: label is empty', blockId: id });
      if (href && !isProbablyUrl(href)) issues.push({ level: 'warning', message: 'CTA: link URL may be invalid', blockId: id });
      break;
    }
    case 'image':
      if (!str(p.src).trim()) issues.push({ level: 'error', message: 'Image: URL is required', blockId: id });
      if (str(p.src) && !str(p.alt).trim()) issues.push({ level: 'warning', message: 'Image: alt text is empty', blockId: id });
      break;
    case 'imageGrid': {
      const imgs = Array.isArray(p.images) ? p.images.filter((x): x is string => typeof x === 'string') : [];
      if (imgs.length === 0) issues.push({ level: 'warning', message: 'Image grid: no images', blockId: id });
      break;
    }
    case 'audio':
      if (!str(p.src).trim()) issues.push({ level: 'warning', message: 'Audio: URL is empty', blockId: id });
      break;
    case 'footer': {
      if (!str(p.shopName).trim()) issues.push({ level: 'warning', message: 'Footer: shop name is empty', blockId: id });
      const link = str(p.linkUrl);
      if (link && !isProbablyUrl(link)) issues.push({ level: 'warning', message: 'Footer: link URL may be invalid', blockId: id });
      break;
    }
    default:
      break;
  }

  return issues;
}

export function lintV2PageContent(content: V2PageContent): { errors: LintIssue[]; warnings: LintIssue[] } {
  const errors: LintIssue[] = [];
  const warnings: LintIssue[] = [];
  const raw = JSON.stringify(content);
  if (raw.length > 4_000_000) {
    warnings.push({ level: 'warning', message: 'Page JSON is very large; consider reducing content.' });
  }
  const meta = content.meta;
  const seo = meta && typeof meta === 'object' && !Array.isArray(meta) ? (meta as { seo?: unknown }).seo : undefined;
  if (seo && typeof seo === 'object' && seo !== null && !Array.isArray(seo)) {
    const o = seo as Record<string, unknown>;
    const og = str(o.ogImage);
    if (og && !isProbablyUrl(og)) warnings.push({ level: 'warning', message: 'SEO: OG image URL may be invalid' });
  }
  for (const b of content.blocks || []) {
    for (const issue of lintBlock(b)) {
      if (issue.level === 'error') errors.push(issue);
      else warnings.push(issue);
    }
  }
  return { errors, warnings };
}
