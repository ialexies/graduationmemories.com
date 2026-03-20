export const DEFAULT_THEME = 'blue' as const;

export type PageThemePreset = 'default' | 'blue' | 'green' | 'rose' | 'amber' | 'indigo';

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
];
