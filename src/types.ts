export type PageType = 'graduation' | 'wedding' | 'event';

export type PageThemePreset = 'default' | 'blue' | 'green' | 'rose' | 'amber' | 'indigo' | 'violet' | 'cyan' | 'red' | 'slate' | 'fuchsia' | 'emerald' | 'sky' | 'lime' | 'orange' | 'teal' | 'pink' | 'stone';

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
  peopleList?: boolean;
}

export interface Student {
  name: string;
  honor?: boolean;
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
