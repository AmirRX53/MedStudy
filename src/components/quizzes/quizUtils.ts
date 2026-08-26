import type { Disease, Subject, Language } from '../../types';
import { translations, type TranslationKey } from '../../i18n';
import {
  loadStored,
  saveStored,
  loadPreference,
  savePreference,
} from '../../lib/storage';

function quizText(language: Language, key: TranslationKey, values: Record<string, string> = {}): string {
  let text = translations[language][key] || translations.en[key];
  Object.entries(values).forEach(([name, value]) => {
    text = text.replace(`{{${name}}}`, value);
  });
  return text;
}

export interface QuizQuestion {
  id: string;
  disease: Disease;
  question?: string;
  correctAnswer?: string;
  options?: string[];
  statement?: string;
  isTrue?: boolean;
  sentence?: string;
  blankIndex?: number;
  answer?: string;
  matchPairs?: { keyword: string; diseaseId: string; diseaseName: string }[];
  matchDiseases?: { id: string; name: string }[];
  matchOptions?: string[];
  multiSelectQuestion?: string;
  multiSelectCorrect?: string[];
  multiSelectCount?: number;
}

export type Difficulty = 'random' | 'easy' | 'medium' | 'hard';

export function loadCardScores(): Record<string, { count: number; average: number }> {
  return loadStored('medstudy-card-scores', {}, value => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
    return Object.values(value).every(score => {
      if (typeof score !== 'object' || score === null || Array.isArray(score)) return false;
      const candidate = score as { count?: unknown; average?: unknown };
      return typeof candidate.count === 'number' && typeof candidate.average === 'number';
    });
  });
}

// Build a balanced exam pool from easy, medium, and hard diseases.
// Higher scores mean easier material; unrated diseases are treated as medium.
export function filterByDifficulty(
  diseases: Disease[],
  difficulty: Difficulty,
  cardScores: Record<string, { count: number; average: number }>,
  requestedCount = diseases.length,
): Disease[] {
  const targetCount = Math.min(Math.max(requestedCount, 0), diseases.length);
  if (targetCount === 0) return [];

  const buckets: Record<Exclude<Difficulty, 'random'>, Disease[]> = {
    easy: [],
    medium: [],
    hard: [],
  };

  diseases.forEach(disease => {
    const average = cardScores[disease.id]?.average ?? 2;
    const category: Exclude<Difficulty, 'random'> = average >= 2.3
      ? 'easy'
      : average < 1.5
        ? 'hard'
        : 'medium';
    buckets[category].push(disease);
  });

  (Object.keys(buckets) as Exclude<Difficulty, 'random'>[]).forEach(category => {
    buckets[category] = shuffle(buckets[category]);
  });

  const categories: Exclude<Difficulty, 'random'>[] = difficulty === 'random'
    ? shuffle(['easy', 'medium', 'hard'] as Exclude<Difficulty, 'random'>[])
    : [difficulty, ...(['easy', 'medium', 'hard'] as const).filter(category => category !== difficulty)];

  const baseQuota = Math.floor(targetCount / categories.length);
  const remainder = targetCount % categories.length;
  const quotas: Record<Exclude<Difficulty, 'random'>, number> = {
    easy: baseQuota,
    medium: baseQuota,
    hard: baseQuota,
  };
  categories.slice(0, remainder).forEach(category => { quotas[category] += 1; });

  const selected: Disease[] = [];
  const takeFrom = (category: Exclude<Difficulty, 'random'>, count: number) => {
    while (count > 0 && buckets[category].length > 0) {
      const disease = buckets[category].pop();
      if (disease) {
        selected.push(disease);
        count -= 1;
      }
    }
  };

  categories.forEach(category => takeFrom(category, quotas[category]));

  let remaining = targetCount - selected.length;
  while (remaining > 0) {
    const fallbackCategory = categories.find(category => buckets[category].length > 0);
    if (!fallbackCategory) break;
    takeFrom(fallbackCategory, 1);
    remaining -= 1;
  }

  return shuffle(selected);
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickRandom<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, Math.min(Math.max(n, 0), arr.length));
}

let _qId = 0;
export function qid(): string {
  return `q-${Date.now()}-${++_qId}`;
}

export function diseasePath(disease: Disease, subjects: Subject[]): string {
  const subject = subjects.find(s => s.id === disease.subjectId);
  const chapter = subject?.chapters.find(c => c.id === disease.chapterId);
  if (subject && chapter) return `${subject.name} › ${chapter.name}`;
  if (subject) return subject.name;
  return '';
}

/**
 * Return the source of wrong choices for a target disease.
 *
 * The target questions may come from a one-question/difficulty-filtered pool,
 * so this pool must be passed separately. Chapter peers are preferred when the
 * chapter contains at least two diseases; otherwise the same subject is used.
 */
function getDistractorDiseases(target: Disease, pool: Disease[]): Disease[] {
  const chapterDiseases = pool.filter(disease =>
    disease.subjectId === target.subjectId && disease.chapterId === target.chapterId,
  );

  if (chapterDiseases.length >= 2) {
    return chapterDiseases.filter(disease => disease.id !== target.id);
  }

  return pool.filter(disease =>
    disease.id !== target.id && disease.subjectId === target.subjectId,
  );
}

function getFallbackOptions(
  targetKeyword: string,
  existing: string[],
  language: Language,
  count: number,
): string[] {
  if (count <= 0) return [];
  const fallbackTerms = quizText(language, 'fallbackTerms').split('|');
  return fallbackTerms
    .filter(term => term !== targetKeyword && !existing.includes(term))
    .slice(0, count);
}

export function generateMultipleChoice(
  diseases: Disease[],
  count: number,
  _subjects: Subject[],
  language: Language = 'en',
  distractorPool: Disease[] = diseases,
): QuizQuestion[] {
  const questions: QuizQuestion[] = [];

  for (const disease of shuffle(diseases).slice(0, Math.max(count, 0))) {
    if (disease.keywords.length === 0) continue;

    const targetKeyword = pickRandom(disease.keywords, 1)[0];
    const distractorDiseases = getDistractorDiseases(disease, distractorPool);
    const wrongOptions = pickRandom(
      [...new Set(
        distractorDiseases
          .flatMap(candidate => candidate.keywords)
          .filter(keyword => keyword !== targetKeyword),
      )],
      3,
    );

    wrongOptions.push(...getFallbackOptions(
      targetKeyword,
      wrongOptions,
      language,
      3 - wrongOptions.length,
    ));
    if (wrongOptions.length < 3) continue;

    questions.push({
      id: qid(),
      disease,
      question: quizText(language, 'multipleChoiceQuestion', { name: disease.name }),
      correctAnswer: targetKeyword,
      options: shuffle([targetKeyword, ...wrongOptions]),
    });
  }

  return questions;
}

export function generateTrueFalse(
  diseases: Disease[],
  count: number,
  _subjects: Subject[],
  language: Language = 'en',
  distractorPool: Disease[] = diseases,
): QuizQuestion[] {
  const questions: QuizQuestion[] = [];

  for (const disease of shuffle(diseases).slice(0, Math.max(count, 0))) {
    if (disease.keywords.length === 0) continue;

    const isTrue = Math.random() > 0.5;
    const correctKeyword = pickRandom(disease.keywords, 1)[0];
    let keyword = correctKeyword;

    if (!isTrue) {
      const ownKeywords = new Set(disease.keywords);
      const wrongKeywords = [...new Set(
        getDistractorDiseases(disease, distractorPool)
          .flatMap(candidate => candidate.keywords)
          .filter(candidate => !ownKeywords.has(candidate)),
      )];
      keyword = pickRandom(wrongKeywords, 1)[0]
        || getFallbackOptions(correctKeyword, [], language, 1)[0]
        || (language === 'fa' ? 'نامرتبط' : 'Unrelated');
    }

    questions.push({
      id: qid(),
      disease,
      statement: quizText(language, 'trueFalseStatement', { name: disease.name, keyword }),
      isTrue,
    });
  }

  return questions;
}

export function generateFillBlank(
  diseases: Disease[],
  count: number,
  _subjects: Subject[],
  language: Language = 'en',
  distractorPool: Disease[] = diseases,
): QuizQuestion[] {
  const questions: QuizQuestion[] = [];

  for (const disease of shuffle(diseases).slice(0, Math.max(count, 0))) {
    if (disease.keywords.length === 0) continue;

    const keywords = shuffle(disease.keywords);
    const blankKeyword = keywords[0];
    const sentence = keywords.map(keyword => keyword === blankKeyword ? '______' : keyword).join(', ');
    const distractorDiseases = getDistractorDiseases(disease, distractorPool);
    const wrongAnswers = pickRandom(
      [...new Set(
        distractorDiseases
          .flatMap(candidate => candidate.keywords)
          .filter(keyword => keyword !== blankKeyword),
      )],
      3,
    );

    wrongAnswers.push(...getFallbackOptions(
      blankKeyword,
      wrongAnswers,
      language,
      3 - wrongAnswers.length,
    ));

    questions.push({
      id: qid(),
      disease,
      sentence,
      answer: blankKeyword,
      options: shuffle([blankKeyword, ...wrongAnswers.slice(0, 3)]),
    });
  }

  return questions;
}

export function generateMatchKeywords(
  diseases: Disease[],
  count: number,
  _subjects: Subject[],
): QuizQuestion[] {
  const eligible = shuffle(diseases.filter(disease => disease.keywords.length > 0));
  if (eligible.length < 2) return [];

  const groupSize = Math.min(4, eligible.length);
  const questions: QuizQuestion[] = [];
  const groupCount = Math.min(count, Math.ceil(eligible.length / groupSize));

  for (let i = 0; i < groupCount; i++) {
    const groupDiseases = eligible.slice(i * groupSize, (i + 1) * groupSize);
    if (groupDiseases.length < 2) continue;

    const usedKeywords = new Set<string>();
    const pairs: { keyword: string; diseaseId: string; diseaseName: string }[] = [];
    for (const disease of groupDiseases) {
      const keyword = shuffle([...new Set(disease.keywords)])
        .find(candidate => !usedKeywords.has(candidate));
      if (!keyword) continue;
      usedKeywords.add(keyword);
      pairs.push({ keyword, diseaseId: disease.id, diseaseName: disease.name });
    }
    if (pairs.length < 2) continue;

    questions.push({
      id: qid(),
      disease: groupDiseases[0],
      matchPairs: pairs,
      matchDiseases: pairs.map(pair => ({ id: pair.diseaseId, name: pair.diseaseName })),
      matchOptions: shuffle(pairs.map(pair => pair.keyword)),
    });
  }

  return questions;
}

export function updateDiseaseScore(diseaseId: string, correct: boolean): void {
  const scores = loadCardScores();
  const existing = scores[diseaseId] || { count: 0, average: 0 };
  const points = correct ? 3 : 1;
  const count = existing.count + 1;
  scores[diseaseId] = {
    count,
    average: (existing.average * existing.count + points) / count,
  };
  saveStored('medstudy-card-scores', scores);
}

export function incrementQuizzesCompleted(): void {
  const count = Number(loadPreference('medstudy-quizzes-completed', '0')) || 0;
  savePreference('medstudy-quizzes-completed', String(count + 1));
}

export function updateDiseaseScoreFractional(diseaseId: string, fraction: number): void {
  const scores = loadCardScores();
  const existing = scores[diseaseId] || { count: 0, average: 0 };
  const points = 1 + Math.max(0, Math.min(1, fraction)) * 2;
  const count = existing.count + 1;
  scores[diseaseId] = {
    count,
    average: (existing.average * existing.count + points) / count,
  };
  saveStored('medstudy-card-scores', scores);
}

export function generateMultiSelect(
  diseases: Disease[],
  count: number,
  _subjects: Subject[],
  language: Language = 'en',
): QuizQuestion[] {
  const questions: QuizQuestion[] = [];

  for (const disease of shuffle(diseases).slice(0, Math.max(count, 0))) {
    if (disease.keywords.length === 0) continue;

    const correctCount = Math.min(disease.keywords.length, 5);
    const correctKeywords = pickRandom(disease.keywords, correctCount);
    const correctSet = new Set(correctKeywords);
    const uniqueWrong = (items: string[]) => [...new Set(items)].filter(keyword => !correctSet.has(keyword));
    const sameChapterDiseases = diseases.filter(candidate =>
      candidate.id !== disease.id
        && candidate.subjectId === disease.subjectId
        && candidate.chapterId === disease.chapterId,
    );
    const sameSubjectDiseases = diseases.filter(candidate =>
      candidate.id !== disease.id && candidate.subjectId === disease.subjectId,
    );
    const chapterPool = uniqueWrong(sameChapterDiseases.flatMap(candidate => candidate.keywords));
    const subjectPool = uniqueWrong(sameSubjectDiseases.flatMap(candidate => candidate.keywords));
    const wrongKeywords: string[] = [];

    for (const keyword of shuffle(sameChapterDiseases.length >= 1 ? chapterPool : subjectPool)) {
      if (wrongKeywords.length >= correctCount) break;
      wrongKeywords.push(keyword);
    }
    if (wrongKeywords.length < correctCount) {
      for (const keyword of shuffle(subjectPool)) {
        if (wrongKeywords.length >= correctCount || wrongKeywords.includes(keyword)) break;
        wrongKeywords.push(keyword);
      }
    }

    questions.push({
      id: qid(),
      disease,
      multiSelectQuestion: quizText(language, 'multiSelectQuestion', { name: disease.name }),
      multiSelectCorrect: correctKeywords,
      multiSelectCount: correctKeywords.length,
      options: shuffle([...correctKeywords, ...wrongKeywords]),
    });
  }

  return questions;
}
