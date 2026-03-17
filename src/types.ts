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
