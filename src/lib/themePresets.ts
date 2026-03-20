export const DEFAULT_THEME = 'blue' as const;

export type PageThemePreset =
  | 'default'
  | 'blue'
  | 'green'
  | 'rose'
  | 'amber'
  | 'indigo'
  | 'violet'
  | 'cyan'
  | 'red'
  | 'slate'
  | 'fuchsia'
  | 'emerald'
  | 'sky'
  | 'lime'
  | 'orange'
  | 'teal'
  | 'pink'
  | 'stone'
  | 'navy'
  | 'cobalt'
  | 'midnight'
  | 'mint'
  | 'sage'
  | 'forest'
  | 'coral'
  | 'scarlet'
  | 'crimson'
  | 'gold'
  | 'honey'
  | 'bronze'
  | 'plum'
  | 'grape'
  | 'lavender'
  | 'aqua'
  | 'turquoise'
  | 'ocean'
  | 'copper'
  | 'rust'
  | 'charcoal'
  | 'graphite'
  | 'ruby'
  | 'wine'
  | 'jade'
  | 'moss'
  | 'iris'
  | 'periwinkle'
  | 'peach'
  | 'apricot'
  | 'lilac'
  | 'steel'
  | 'silver';

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
  navy: {
    primary: '#172554',
    accent: '#2563eb',
    cardBg: '#172554',
    gradientStart: '#172554',
    gradientEnd: '#1e3a8a',
  },
  cobalt: {
    primary: '#1e3a5f',
    accent: '#0284c7',
    cardBg: '#1e3a5f',
    gradientStart: '#1e3a5f',
    gradientEnd: '#0c4a6e',
  },
  midnight: {
    primary: '#0f172a',
    accent: '#475569',
    cardBg: '#0f172a',
    gradientStart: '#0f172a',
    gradientEnd: '#1e293b',
  },
  mint: {
    primary: '#134e4a',
    accent: '#2dd4bf',
    cardBg: '#134e4a',
    gradientStart: '#0f766e',
    gradientEnd: '#115e59',
  },
  sage: {
    primary: '#365314',
    accent: '#a3e635',
    cardBg: '#365314',
    gradientStart: '#3f6212',
    gradientEnd: '#4d7c0f',
  },
  forest: {
    primary: '#052e16',
    accent: '#22c55e',
    cardBg: '#052e16',
    gradientStart: '#052e16',
    gradientEnd: '#14532d',
  },
  coral: {
    primary: '#9f1239',
    accent: '#fb7185',
    cardBg: '#9f1239',
    gradientStart: '#881337',
    gradientEnd: '#be123c',
  },
  scarlet: {
    primary: '#7f1d1d',
    accent: '#f87171',
    cardBg: '#7f1d1d',
    gradientStart: '#7f1d1d',
    gradientEnd: '#991b1b',
  },
  crimson: {
    primary: '#881337',
    accent: '#e11d48',
    cardBg: '#881337',
    gradientStart: '#9f1239',
    gradientEnd: '#be123c',
  },
  gold: {
    primary: '#713f12',
    accent: '#eab308',
    cardBg: '#713f12',
    gradientStart: '#78350f',
    gradientEnd: '#92400e',
  },
  honey: {
    primary: '#854d0e',
    accent: '#fbbf24',
    cardBg: '#854d0e',
    gradientStart: '#a16207',
    gradientEnd: '#ca8a04',
  },
  bronze: {
    primary: '#78350f',
    accent: '#d97706',
    cardBg: '#78350f',
    gradientStart: '#92400e',
    gradientEnd: '#b45309',
  },
  plum: {
    primary: '#581c87',
    accent: '#c084fc',
    cardBg: '#581c87',
    gradientStart: '#6b21a8',
    gradientEnd: '#7e22ce',
  },
  grape: {
    primary: '#3b0764',
    accent: '#a78bfa',
    cardBg: '#3b0764',
    gradientStart: '#4c1d95',
    gradientEnd: '#5b21b6',
  },
  lavender: {
    primary: '#4c1d95',
    accent: '#c4b5fd',
    cardBg: '#4c1d95',
    gradientStart: '#5b21b6',
    gradientEnd: '#6d28d9',
  },
  aqua: {
    primary: '#155e75',
    accent: '#22d3ee',
    cardBg: '#155e75',
    gradientStart: '#0e7490',
    gradientEnd: '#0891b2',
  },
  turquoise: {
    primary: '#115e59',
    accent: '#5eead4',
    cardBg: '#115e59',
    gradientStart: '#0f766e',
    gradientEnd: '#14b8a6',
  },
  ocean: {
    primary: '#164e63',
    accent: '#38bdf8',
    cardBg: '#164e63',
    gradientStart: '#0c4a6e',
    gradientEnd: '#155e75',
  },
  copper: {
    primary: '#7c2d12',
    accent: '#ea580c',
    cardBg: '#7c2d12',
    gradientStart: '#9a3412',
    gradientEnd: '#c2410c',
  },
  rust: {
    primary: '#7f1d1d',
    accent: '#f97316',
    cardBg: '#7f1d1d',
    gradientStart: '#991b1b',
    gradientEnd: '#b91c1c',
  },
  charcoal: {
    primary: '#27272a',
    accent: '#71717a',
    cardBg: '#27272a',
    gradientStart: '#3f3f46',
    gradientEnd: '#52525b',
  },
  graphite: {
    primary: '#1c1917',
    accent: '#a8a29e',
    cardBg: '#1c1917',
    gradientStart: '#292524',
    gradientEnd: '#44403c',
  },
  ruby: {
    primary: '#701a75',
    accent: '#e879f9',
    cardBg: '#701a75',
    gradientStart: '#86198f',
    gradientEnd: '#a21caf',
  },
  wine: {
    primary: '#4c0519',
    accent: '#f472b6',
    cardBg: '#4c0519',
    gradientStart: '#831843',
    gradientEnd: '#9d174d',
  },
  jade: {
    primary: '#064e3b',
    accent: '#34d399',
    cardBg: '#064e3b',
    gradientStart: '#065f46',
    gradientEnd: '#047857',
  },
  moss: {
    primary: '#422006',
    accent: '#a16207',
    cardBg: '#422006',
    gradientStart: '#713f12',
    gradientEnd: '#854d0e',
  },
  iris: {
    primary: '#3730a3',
    accent: '#818cf8',
    cardBg: '#3730a3',
    gradientStart: '#4338ca',
    gradientEnd: '#4f46e5',
  },
  periwinkle: {
    primary: '#312e81',
    accent: '#a5b4fc',
    cardBg: '#312e81',
    gradientStart: '#3730a3',
    gradientEnd: '#4338ca',
  },
  peach: {
    primary: '#c2410c',
    accent: '#fdba74',
    cardBg: '#c2410c',
    gradientStart: '#ea580c',
    gradientEnd: '#f97316',
  },
  apricot: {
    primary: '#9a3412',
    accent: '#fb923c',
    cardBg: '#9a3412',
    gradientStart: '#c2410c',
    gradientEnd: '#ea580c',
  },
  lilac: {
    primary: '#5b21b6',
    accent: '#e9d5ff',
    cardBg: '#5b21b6',
    gradientStart: '#6d28d9',
    gradientEnd: '#7c3aed',
  },
  steel: {
    primary: '#374151',
    accent: '#9ca3af',
    cardBg: '#374151',
    gradientStart: '#4b5563',
    gradientEnd: '#6b7280',
  },
  silver: {
    primary: '#52525b',
    accent: '#d4d4d8',
    cardBg: '#52525b',
    gradientStart: '#71717a',
    gradientEnd: '#a1a1aa',
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
  { value: 'navy', label: 'Navy' },
  { value: 'cobalt', label: 'Cobalt' },
  { value: 'midnight', label: 'Midnight' },
  { value: 'mint', label: 'Mint' },
  { value: 'sage', label: 'Sage' },
  { value: 'forest', label: 'Forest' },
  { value: 'coral', label: 'Coral' },
  { value: 'scarlet', label: 'Scarlet' },
  { value: 'crimson', label: 'Crimson' },
  { value: 'gold', label: 'Gold' },
  { value: 'honey', label: 'Honey' },
  { value: 'bronze', label: 'Bronze' },
  { value: 'plum', label: 'Plum' },
  { value: 'grape', label: 'Grape' },
  { value: 'lavender', label: 'Lavender' },
  { value: 'aqua', label: 'Aqua' },
  { value: 'turquoise', label: 'Turquoise' },
  { value: 'ocean', label: 'Ocean' },
  { value: 'copper', label: 'Copper' },
  { value: 'rust', label: 'Rust' },
  { value: 'charcoal', label: 'Charcoal' },
  { value: 'graphite', label: 'Graphite' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'wine', label: 'Wine' },
  { value: 'jade', label: 'Jade' },
  { value: 'moss', label: 'Moss' },
  { value: 'iris', label: 'Iris' },
  { value: 'periwinkle', label: 'Periwinkle' },
  { value: 'peach', label: 'Peach' },
  { value: 'apricot', label: 'Apricot' },
  { value: 'lilac', label: 'Lilac' },
  { value: 'steel', label: 'Steel' },
  { value: 'silver', label: 'Silver' },
];
