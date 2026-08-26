export interface Chapter {
  id: string;
  name: string;
  subjectId: string;
  order: number;
}

export interface Subject {
  id: string;
  name: string;
  order: number;
  chapters: Chapter[];
}

export type Theme = 'light' | 'dark';
export type Language = 'en' | 'fa';
export type AccentColor = 'blue' | 'green' | 'purple' | 'red' | 'orange' | 'teal';

export interface Disease {
  id: string;
  name: string;
  subjectId: string;
  chapterId: string;
  keywords: string[];
}
