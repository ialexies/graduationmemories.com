export const DEFAULT_THEME = 'blue' as const;

export type PageThemePreset = 'default' | 'blue' | 'green' | 'rose' | 'amber' | 'indigo' | 'violet' | 'cyan' | 'red' | 'slate' | 'fuchsia' | 'emerald' | 'sky' | 'lime' | 'orange' | 'teal' | 'pink' | 'stone';

export interface ThemeColors {
  primary: string;
  accent: string;
  cardBg: string;
  gradientStart: string;
  gradientEnd: string;
}

export const THEME_PRESETS: Record<Exclude<PageThemePreset, 'default'>, ThemeColors> = {
  blue: {
    primary: '#0f172a',
    accent: '#3b82f6',
    cardBg: '#0f172a',
    gradientStart: '#0f172a',
    gradientEnd: '#1e3a8a',
  },
  green: {
    primary: '#14532d',
    accent: '#22c55e',
    cardBg: '#14532d',
    gradientStart: '#14532d',
    gradientEnd: '#166534',
  },
  rose: {
    primary: '#881337',
    accent: '#f43f5e',
    cardBg: '#881337',
    gradientStart: '#881337',
    gradientEnd: '#9f1239',
  },
  amber: {
    primary: '#78350f',
    accent: '#f59e0b',
    cardBg: '#78350f',
    gradientStart: '#78350f',
    gradientEnd: '#92400e',
  },
  indigo: {
    primary: '#1e1b4b',
    accent: '#6366f1',
    cardBg: '#1e1b4b',
    gradientStart: '#1e1b4b',
    gradientEnd: '#312e81',
  },
  violet: {
    primary: '#4c1d95',
    accent: '#8b5cf6',
    cardBg: '#4c1d95',
    gradientStart: '#4c1d95',
    gradientEnd: '#5b21b6',
  },
  cyan: {
    primary: '#0e7490',
    accent: '#06b6d4',
    cardBg: '#0e7490',
    gradientStart: '#0e7490',
    gradientEnd: '#155e75',
  },
  red: {
    primary: '#991b1b',
    accent: '#ef4444',
    cardBg: '#991b1b',
    gradientStart: '#991b1b',
    gradientEnd: '#b91c1c',
  },
  slate: {
    primary: '#334155',
    accent: '#64748b',
    cardBg: '#334155',
    gradientStart: '#334155',
    gradientEnd: '#475569',
  },
  fuchsia: {
    primary: '#86198f',
    accent: '#d946ef',
    cardBg: '#86198f',
    gradientStart: '#86198f',
    gradientEnd: '#9d174d',
  },
  emerald: {
    primary: '#064e3b',
    accent: '#10b981',
    cardBg: '#064e3b',
    gradientStart: '#064e3b',
    gradientEnd: '#065f46',
  },
  sky: {
    primary: '#0c4a6e',
    accent: '#0ea5e9',
    cardBg: '#0c4a6e',
    gradientStart: '#0c4a6e',
    gradientEnd: '#0369a1',
  },
  lime: {
    primary: '#365314',
    accent: '#84cc16',
    cardBg: '#365314',
    gradientStart: '#365314',
    gradientEnd: '#4d7c0f',
  },
  orange: {
    primary: '#9a3412',
    accent: '#f97316',
    cardBg: '#9a3412',
    gradientStart: '#9a3412',
    gradientEnd: '#c2410c',
  },
  teal: {
    primary: '#134e4a',
    accent: '#14b8a6',
    cardBg: '#134e4a',
    gradientStart: '#134e4a',
    gradientEnd: '#0f766e',
  },
  pink: {
    primary: '#831843',
    accent: '#ec4899',
    cardBg: '#831843',
    gradientStart: '#831843',
    gradientEnd: '#9d174d',
  },
  stone: {
    primary: '#44403c',
    accent: '#78716c',
    cardBg: '#44403c',
    gradientStart: '#44403c',
    gradientEnd: '#57534e',
  },
};

export function getThemeColors(presetId: PageThemePreset | string | null | undefined): ThemeColors {
  const id = presetId === 'default' || !presetId ? 'blue' : presetId;
  return THEME_PRESETS[id as keyof typeof THEME_PRESETS] ?? THEME_PRESETS.blue;
}

export function toCssVars(colors: ThemeColors): Record<string, string> {
  return {
    '--theme-primary': colors.primary,
    '--theme-accent': colors.accent,
    '--theme-card-bg': colors.cardBg,
    '--theme-gradient-start': colors.gradientStart,
    '--theme-gradient-end': colors.gradientEnd,
  };
}

export const THEME_OPTIONS: { value: PageThemePreset; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'blue', label: 'Blue' },
  { value: 'green', label: 'Green' },
  { value: 'rose', label: 'Rose' },
  { value: 'amber', label: 'Amber' },
  { value: 'indigo', label: 'Indigo' },
  { value: 'violet', label: 'Violet' },
  { value: 'cyan', label: 'Cyan' },
  { value: 'red', label: 'Red' },
  { value: 'slate', label: 'Slate' },
  { value: 'fuchsia', label: 'Fuchsia' },
  { value: 'emerald', label: 'Emerald' },
  { value: 'sky', label: 'Sky' },
  { value: 'lime', label: 'Lime' },
  { value: 'orange', label: 'Orange' },
  { value: 'teal', label: 'Teal' },
  { value: 'pink', label: 'Pink' },
  { value: 'stone', label: 'Stone' },
];
