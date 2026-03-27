import type { V2BlockType } from '../../types';

/** Human-readable names for block types in the editor UI */
export const V2_BLOCK_TYPE_LABELS: Record<V2BlockType, string> = {
  header: 'Header',
  richText: 'Rich text',
  peopleList: 'People list',
  imageGrid: 'Image grid',
  cta: 'Call to action',
  footer: 'Footer',
  image: 'Image',
  authorCard: 'Author card',
  audio: 'Audio',
};

/** Known `content.labels` keys from migration + typical use */
export const PAGE_LABEL_PRESETS: { key: string; title: string; hint: string }[] = [
  { key: 'headerEyebrow', title: 'Banner / top line', hint: 'Small label above the main title (e.g. product or event name)' },
  { key: 'headerTitleLabel', title: 'Section title label', hint: 'Label shown next to or above the main heading' },
  { key: 'peopleListTitle', title: 'List section title', hint: 'Heading above names or items' },
  { key: 'peopleTagText', title: 'Badge / tag wording', hint: 'Short word for tags next to people (e.g. honor)' },
  { key: 'messageBlockTitle', title: 'Message section title', hint: 'Heading above a long message or story' },
  { key: 'authorLabel', title: 'Author line label', hint: 'Label before the author name' },
];

export type TextAlign = 'left' | 'center' | 'right';
export type FontPreset = 'default' | 'serif' | 'strong';
export type ContentSize = 'sm' | 'md' | 'lg';
export type ImageWidthPreset = 'full' | 'wide' | 'normal' | 'narrow';
export type ImageAlign = 'left' | 'center' | 'right';
export type ImageRatio = 'auto' | '16:9' | '4:3' | '1:1' | '3:4';
export type ImageFit = 'cover' | 'contain';
export type ImageRadius = 'none' | 'sm' | 'md' | 'lg' | 'pill';
export type ImageBorder = 'none' | 'thin';
export type ImageShadow = 'none' | 'sm' | 'md' | 'lg';
export type ImageFocalPoint = 'center' | 'top' | 'bottom' | 'left' | 'right';
export type ImageLoading = 'lazy' | 'eager';
export type HeaderBgType = 'gradient' | 'solid' | 'image';
export type HeaderBgPreset = 'ocean' | 'royal' | 'sunset' | 'forest' | 'slate' | 'snow';
export type HeaderHeightPreset = 'sm' | 'md' | 'lg' | 'screen';
export type HeaderRadiusPreset = 'none' | 'sm' | 'md' | 'lg' | 'pill';
export type HeaderTitleSize = 'sm' | 'md' | 'lg' | 'xl';
export type HeaderSubtitleSize = 'sm' | 'md' | 'lg';
export type HeaderTextColorMode = 'auto' | 'light' | 'dark';

export function alignClass(t: unknown): string {
  if (t === 'center') return 'text-center';
  if (t === 'right') return 'text-right';
  return 'text-left';
}

export function fontPresetClass(p: unknown): string {
  if (p === 'serif') return 'font-serif';
  if (p === 'strong') return 'font-semibold';
  return '';
}

export function contentSizeClass(s: unknown): string {
  if (s === 'sm') return 'text-sm [&_p]:text-sm [&_li]:text-sm';
  if (s === 'lg') return 'text-lg [&_p]:text-lg [&_li]:text-lg';
  return '';
}

export function imageWidthClass(v: unknown): string {
  if (v === 'wide') return 'max-w-6xl';
  if (v === 'normal') return 'max-w-4xl';
  if (v === 'narrow') return 'max-w-2xl';
  return 'w-full';
}

export function imageAlignClass(v: unknown): string {
  if (v === 'left') return 'mr-auto';
  if (v === 'right') return 'ml-auto';
  return 'mx-auto';
}

export function imageRatioClass(v: unknown): string {
  if (v === '16:9') return 'aspect-video';
  if (v === '4:3') return 'aspect-[4/3]';
  if (v === '1:1') return 'aspect-square';
  if (v === '3:4') return 'aspect-[3/4]';
  return '';
}

export function imageFitClass(v: unknown): string {
  return v === 'contain' ? 'object-contain' : 'object-cover';
}

export function imageRadiusClass(v: unknown): string {
  if (v === 'none') return 'rounded-none';
  if (v === 'sm') return 'rounded';
  if (v === 'md') return 'rounded-lg';
  if (v === 'pill') return 'rounded-[999px]';
  return 'rounded-xl';
}

export function imageBorderClass(v: unknown): string {
  return v === 'thin' ? 'border border-slate-200' : '';
}

export function imageShadowClass(v: unknown): string {
  if (v === 'sm') return 'shadow-sm';
  if (v === 'md') return 'shadow';
  if (v === 'lg') return 'shadow-lg';
  return '';
}

export function imageFocalPointClass(v: unknown): string {
  if (v === 'top') return 'object-top';
  if (v === 'bottom') return 'object-bottom';
  if (v === 'left') return 'object-left';
  if (v === 'right') return 'object-right';
  return 'object-center';
}

export function imageLoadingValue(v: unknown): 'lazy' | 'eager' {
  return v === 'eager' ? 'eager' : 'lazy';
}

export function headerGradientClass(v: unknown): string {
  if (v === 'sunset') return 'bg-gradient-to-r from-rose-500 to-orange-400';
  if (v === 'forest') return 'bg-gradient-to-r from-emerald-600 to-green-500';
  if (v === 'slate') return 'bg-gradient-to-r from-slate-700 to-slate-500';
  if (v === 'snow') return 'bg-gradient-to-r from-slate-100 to-slate-50';
  if (v === 'ocean') return 'bg-gradient-to-r from-cyan-600 to-blue-500';
  return 'bg-gradient-to-r from-blue-600 to-indigo-600';
}

export function headerSolidClass(v: unknown): string {
  if (v === 'sunset') return 'bg-orange-500';
  if (v === 'forest') return 'bg-emerald-600';
  if (v === 'slate') return 'bg-slate-700';
  if (v === 'snow') return 'bg-slate-100';
  if (v === 'ocean') return 'bg-cyan-600';
  return 'bg-blue-600';
}

export function headerHeightClass(v: unknown): string {
  if (v === 'sm') return 'min-h-[220px]';
  if (v === 'lg') return 'min-h-[420px]';
  if (v === 'screen') return 'min-h-[70vh]';
  return 'min-h-[320px]';
}

export function headerRadiusClass(v: unknown): string {
  if (v === 'none') return 'rounded-none';
  if (v === 'sm') return 'rounded';
  if (v === 'md') return 'rounded-lg';
  if (v === 'pill') return 'rounded-[40px]';
  return 'rounded-2xl';
}

export function headerTitleSizeClass(v: unknown): string {
  if (v === 'sm') return 'text-2xl';
  if (v === 'md') return 'text-3xl';
  if (v === 'xl') return 'text-5xl';
  return 'text-4xl';
}

export function headerSubtitleSizeClass(v: unknown): string {
  if (v === 'sm') return 'text-sm';
  if (v === 'lg') return 'text-xl';
  return 'text-base';
}

export function headerTextColorClass(mode: unknown, bgType: unknown, preset: unknown): string {
  if (mode === 'light') return 'text-white';
  if (mode === 'dark') return 'text-slate-900';
  if (bgType === 'solid' || bgType === 'gradient') {
    if (preset === 'snow') return 'text-slate-900';
    return 'text-white';
  }
  return 'text-white';
}
