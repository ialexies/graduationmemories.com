export type PageType =
  | 'graduation'
  | 'wedding'
  | 'event'
  | 'birthday'
  | 'anniversary'
  | 'reunion'
  | 'retirement'
  | 'babyShower'
  | 'farewell'
  | 'engagement';

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

export interface PageLabels {
  themeLabel: string;
  titleLabel: string;
  subtitleLabel: string;
  peopleLabel: string;
  peopleTagLabel: string;
  messageLabel: string;
  messageAuthorLabel: string;
}

export interface SectionVisibility {
  classPhoto?: boolean;
  gallery?: boolean;
  teacherMessage?: boolean;
  teacherAudio?: boolean;
  peopleList?: boolean;
  studentPhotos?: boolean;
}

export interface Student {
  name: string;
  honor?: boolean;
  photo?: string;
}

export interface TranscriptWord {
  start: number;
  end: number;
  word: string;
}

export interface Post {
  sectionName: string;
  batch: string;
  location: string;
  quote: string;
  classPhoto: string;
  gallery: string[];
  teacherMessage: string;
  teacherName: string;
  teacherPhoto?: string;
  teacherTitle: string;
  teacherAudio?: string;
  teacherAudioTranscript?: TranscriptWord[];
  students: Student[];
  togetherSince: string;
}

export interface Footer {
  linkUrl?: string;
  logo?: string;
  shopName: string;
  tagline: string;
  location: string;
}

export interface PostsData {
  posts: Record<string, Post>;
  footer: Footer;
}

export type V2BlockType =
  | 'header'
  | 'richText'
  | 'peopleList'
  | 'imageGrid'
  | 'cta'
  | 'footer'
  | 'image'
  | 'authorCard'
  | 'audio';

export interface V2Block {
  id: string;
  type: V2BlockType;
  visibility?: boolean;
  styleVariant?: string;
  props: Record<string, unknown>;
}

export interface V2PageContent {
  labels: Record<string, string>;
  blocks: V2Block[];
  meta?: Record<string, unknown>;
}

export interface V2PageRecord {
  id: string;
  slug: string;
  title: string;
  status: 'draft' | 'published' | 'archived';
  theme_id?: string;
  created_at?: string;
  updated_at?: string;
  published_at?: string | null;
}
