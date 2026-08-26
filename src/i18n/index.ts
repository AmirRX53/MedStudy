import { en } from './en';
import { fa } from './fa';
import type { Language } from '../types';

export const translations: Record<Language, typeof en> = { en, fa };

export type TranslationKey = keyof typeof en;
