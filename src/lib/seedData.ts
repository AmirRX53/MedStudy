import { saveStored, savePreference } from './storage';
import type { Disease, Subject } from '../types';
import type { ReviewState } from './srs';

const DAY = 24 * 60 * 60 * 1000;

// ─── Subjects & chapters ─────────────────────────────────────────────────────

interface DemoSubjectDef {
  id: string;
  name: string;
  chapters: { id: string; name: string }[];
}

const SUBJECT_DEFS: DemoSubjectDef[] = [
  {
    id: 'sub-cardiology',
    name: 'Cardiology',
    chapters: [
      { id: 'ch-cad', name: 'Coronary Artery Disease' },
      { id: 'ch-rhythm', name: 'Heart Failure & Arrhythmias' },
      { id: 'ch-valve', name: 'Valvular Disease' },
    ],
  },
  {
    id: 'sub-neurology',
    name: 'Neurology',
    chapters: [
      { id: 'ch-stroke', name: 'Stroke & Cerebrovascular' },
      { id: 'ch-seizure', name: 'Seizures' },
      { id: 'ch-neurodegen', name: 'Neurodegenerative' },
    ],
  },
  {
    id: 'sub-endocrinology',
    name: 'Endocrinology',
    chapters: [
      { id: 'ch-diabetes', name: 'Diabetes' },
      { id: 'ch-thyroid', name: 'Thyroid' },
    ],
  },
  {
    id: 'sub-gastro',
    name: 'Gastroenterology',
    chapters: [
      { id: 'ch-liver', name: 'Liver' },
      { id: 'ch-ibd', name: 'Inflammatory Bowel' },
      { id: 'ch-motility', name: 'Motility' },
    ],
  },
];

// ─── Diseases ────────────────────────────────────────────────────────────────
// Keyword counts deliberately vary (0 to 5) so empty cards, quizzes, and stats
// all have something to show.

interface DemoDiseaseDef {
  id: string;
  subjectId: string;
  chapterId: string;
  name: string;
  keywords: string[];
}

const DISEASE_DEFS: DemoDiseaseDef[] = [
  // Cardiology
  { id: 'd-myo-infarction', subjectId: 'sub-cardiology', chapterId: 'ch-cad', name: 'Myocardial Infarction', keywords: ['Chest pain', 'ST elevation', 'Troponin', 'Nitroglycerin', 'Thrombolysis'] },
  { id: 'd-stable-angina', subjectId: 'sub-cardiology', chapterId: 'ch-cad', name: 'Stable Angina', keywords: ['Chest pain', 'Exercise-induced', 'Nitroglycerin'] },
  { id: 'd-unstable-angina', subjectId: 'sub-cardiology', chapterId: 'ch-cad', name: 'Unstable Angina', keywords: ['Chest pain at rest', 'ECG changes', 'Cardiac enzymes'] },
  { id: 'd-atrial-fib', subjectId: 'sub-cardiology', chapterId: 'ch-rhythm', name: 'Atrial Fibrillation', keywords: ['Irregular rhythm', 'Anticoagulation', 'CHA2DS2-VASc'] },
  { id: 'd-heart-failure', subjectId: 'sub-cardiology', chapterId: 'ch-rhythm', name: 'Heart Failure', keywords: ['Dyspnea', 'Edema', 'Reduced ejection fraction', 'Diuretics'] },
  { id: 'd-vtach', subjectId: 'sub-cardiology', chapterId: 'ch-rhythm', name: 'Ventricular Tachycardia', keywords: ['Wide QRS', 'Palpitations', 'Syncope'] },
  { id: 'd-aortic-stenosis', subjectId: 'sub-cardiology', chapterId: 'ch-valve', name: 'Aortic Stenosis', keywords: ['Systolic murmur', 'Syncope', 'Valve replacement'] },
  { id: 'd-mitral-regurg', subjectId: 'sub-cardiology', chapterId: 'ch-valve', name: 'Mitral Regurgitation', keywords: ['Holosystolic murmur', 'Dyspnea'] },

  // Neurology
  { id: 'd-ischemic-stroke', subjectId: 'sub-neurology', chapterId: 'ch-stroke', name: 'Ischemic Stroke', keywords: ['Focal deficit', 'tPA', 'FAST'] },
  { id: 'd-ich', subjectId: 'sub-neurology', chapterId: 'ch-stroke', name: 'Intracerebral Hemorrhage', keywords: ['Sudden headache', 'Hypertension', 'CT'] },
  { id: 'd-tia', subjectId: 'sub-neurology', chapterId: 'ch-stroke', name: 'Transient Ischemic Attack', keywords: ['Transient deficit', 'Resolution within 24 hours'] },
  { id: 'd-gtc-seizure', subjectId: 'sub-neurology', chapterId: 'ch-seizure', name: 'Generalized Tonic-Clonic Seizure', keywords: ['Loss of consciousness', 'Tonic-clonic', 'Anticonvulsants'] },
  { id: 'd-absence-seizure', subjectId: 'sub-neurology', chapterId: 'ch-seizure', name: 'Absence Seizure', keywords: ['Brief staring', 'Childhood onset'] },
  { id: 'd-parkinson', subjectId: 'sub-neurology', chapterId: 'ch-neurodegen', name: 'Parkinson Disease', keywords: ['Resting tremor', 'Rigidity', 'Levodopa'] },
  { id: 'd-alzheimer', subjectId: 'sub-neurology', chapterId: 'ch-neurodegen', name: 'Alzheimer Disease', keywords: ['Memory loss', 'Amyloid plaques', 'Acetylcholinesterase inhibitors'] },
  { id: 'd-ms', subjectId: 'sub-neurology', chapterId: 'ch-neurodegen', name: 'Multiple Sclerosis', keywords: ['Optic neuritis', 'Demyelination', 'MRI'] },

  // Endocrinology
  { id: 'd-type1', subjectId: 'sub-endocrinology', chapterId: 'ch-diabetes', name: 'Type 1 Diabetes', keywords: ['Insulin deficiency', 'Polyuria', 'Ketoacidosis'] },
  { id: 'd-type2', subjectId: 'sub-endocrinology', chapterId: 'ch-diabetes', name: 'Type 2 Diabetes', keywords: ['Insulin resistance', 'Metformin', 'Hyperglycemia'] },
  { id: 'd-dka', subjectId: 'sub-endocrinology', chapterId: 'ch-diabetes', name: 'Diabetic Ketoacidosis', keywords: ['Hyperglycemia', 'Ketones', 'Metabolic acidosis'] },
  { id: 'd-hypothyroid', subjectId: 'sub-endocrinology', chapterId: 'ch-thyroid', name: 'Hypothyroidism', keywords: ['Fatigue', 'Weight gain', 'Levothyroxine'] },
  { id: 'd-hyperthyroid', subjectId: 'sub-endocrinology', chapterId: 'ch-thyroid', name: 'Hyperthyroidism', keywords: ['Weight loss', 'Tachycardia', 'Methimazole'] },
  { id: 'd-graves', subjectId: 'sub-endocrinology', chapterId: 'ch-thyroid', name: 'Graves Disease', keywords: ['Exophthalmos', 'TSH receptor antibodies', 'Goiter'] },

  // Gastroenterology
  { id: 'd-cirrhosis', subjectId: 'sub-gastro', chapterId: 'ch-liver', name: 'Cirrhosis', keywords: ['Portal hypertension', 'Ascites', 'Liver fibrosis'] },
  { id: 'd-hepatic-enceph', subjectId: 'sub-gastro', chapterId: 'ch-liver', name: 'Hepatic Encephalopathy', keywords: ['Confusion', 'Elevated ammonia', 'Lactulose'] },
  { id: 'd-hep-c', subjectId: 'sub-gastro', chapterId: 'ch-liver', name: 'Hepatitis C', keywords: ['Jaundice', 'HCV RNA', 'Antiviral therapy'] },
  { id: 'd-crohn', subjectId: 'sub-gastro', chapterId: 'ch-ibd', name: 'Crohn Disease', keywords: ['Abdominal pain', 'Transmural inflammation', 'Fistula'] },
  { id: 'd-uc', subjectId: 'sub-gastro', chapterId: 'ch-ibd', name: 'Ulcerative Colitis', keywords: ['Bloody diarrhea', 'Colonic ulcers', 'Mesalamine'] },
  { id: 'd-celiac', subjectId: 'sub-gastro', chapterId: 'ch-ibd', name: 'Celiac Disease', keywords: ['Gluten sensitivity', 'Villous atrophy', 'Malabsorption'] },
  { id: 'd-gerd', subjectId: 'sub-gastro', chapterId: 'ch-motility', name: 'Gastroesophageal Reflux Disease', keywords: ['Heartburn'] },
  { id: 'd-ibs', subjectId: 'sub-gastro', chapterId: 'ch-motility', name: 'Irritable Bowel Syndrome', keywords: [] },
];

export function buildDemoSubjects(): Subject[] {
  return SUBJECT_DEFS.map((s, subjectIndex) => ({
    id: s.id,
    name: s.name,
    order: subjectIndex,
    chapters: s.chapters.map((c, chapterIndex) => ({
      id: c.id,
      name: c.name,
      subjectId: s.id,
      order: chapterIndex,
    })),
  }));
}

export function buildDemoDiseases(): Disease[] {
  return DISEASE_DEFS.map(d => ({
    id: d.id,
    name: d.name,
    subjectId: d.subjectId,
    chapterId: d.chapterId,
    keywords: d.keywords,
  }));
}

// ─── Review scores (legacy 1-3 scale) ────────────────────────────────────────
// A mix of easy (>= 2.3), medium (1.5-2.3), and hard (< 1.5) averages, plus a
// spread of review counts. Diseases without an entry are unrated.

export function buildDemoCardScores(): Record<string, { count: number; average: number }> {
  return {
    'd-stable-angina': { count: 5, average: 2.8 },
    'd-unstable-angina': { count: 2, average: 2.0 },
    'd-atrial-fib': { count: 8, average: 1.6 },
    'd-heart-failure': { count: 12, average: 2.4 },
    'd-vtach': { count: 4, average: 1.4 },
    'd-aortic-stenosis': { count: 6, average: 1.2 },
    'd-mitral-regurg': { count: 3, average: 2.2 },
    'd-ischemic-stroke': { count: 15, average: 2.7 },
    'd-ich': { count: 4, average: 2.0 },
    'd-tia': { count: 2, average: 3.0 },
    'd-parkinson': { count: 9, average: 2.3 },
    'd-alzheimer': { count: 11, average: 1.3 },
    'd-ms': { count: 7, average: 2.2 },
    'd-type1': { count: 20, average: 2.9 },
    'd-type2': { count: 14, average: 2.1 },
    'd-dka': { count: 3, average: 1.8 },
    'd-graves': { count: 5, average: 2.6 },
    'd-cirrhosis': { count: 10, average: 1.5 },
    'd-hepatic-enceph': { count: 2, average: 1.1 },
    'd-crohn': { count: 4, average: 2.5 },
    'd-uc': { count: 3, average: 1.9 },
  };
}

// ─── Spaced-repetition state ─────────────────────────────────────────────────
// Deliberate variety: overdue cards, cards due today/tomorrow, cards scheduled
// days/weeks/months out (up to the 365-day cap), lapsed cards, and fresh cards.
// Diseases without an entry are new cards and are due immediately.

export function buildDemoReviewState(): Record<string, ReviewState> {
  const now = Date.now();
  return {
    'd-myo-infarction': { due: now - 2 * DAY, interval: 1, ease: 2.3, reps: 1, lapses: 1 },
    'd-stable-angina': { due: now + 6 * DAY, interval: 6, ease: 2.5, reps: 2, lapses: 0 },
    'd-atrial-fib': { due: now - 1 * DAY, interval: 2, ease: 2.2, reps: 3, lapses: 1 },
    'd-heart-failure': { due: now + 30 * DAY, interval: 30, ease: 2.6, reps: 4, lapses: 0 },
    'd-vtach': { due: now - 4 * DAY, interval: 1, ease: 1.9, reps: 1, lapses: 2 },
    'd-aortic-stenosis': { due: now + 1 * DAY, interval: 1, ease: 2.0, reps: 1, lapses: 2 },
    'd-mitral-regurg': { due: now + 2 * DAY, interval: 2, ease: 2.4, reps: 2, lapses: 0 },
    'd-ischemic-stroke': { due: now + 90 * DAY, interval: 90, ease: 2.8, reps: 6, lapses: 0 },
    'd-tia': { due: now + 14 * DAY, interval: 14, ease: 2.7, reps: 3, lapses: 0 },
    'd-parkinson': { due: now + 14 * DAY, interval: 14, ease: 2.5, reps: 3, lapses: 0 },
    'd-alzheimer': { due: now - 5 * DAY, interval: 3, ease: 1.8, reps: 2, lapses: 3 },
    'd-ms': { due: now + 6 * DAY, interval: 6, ease: 2.4, reps: 2, lapses: 0 },
    'd-type1': { due: now + 365 * DAY, interval: 365, ease: 2.9, reps: 10, lapses: 0 },
    'd-type2': { due: now + 1 * DAY, interval: 1, ease: 2.1, reps: 1, lapses: 1 },
    'd-graves': { due: now + 3 * DAY, interval: 3, ease: 2.4, reps: 2, lapses: 0 },
    'd-cirrhosis': { due: now - 3 * DAY, interval: 1, ease: 2.1, reps: 1, lapses: 2 },
    'd-crohn': { due: now + 6 * DAY, interval: 6, ease: 2.5, reps: 2, lapses: 0 },
    'd-hepatic-enceph': { due: now - 1 * DAY, interval: 1, ease: 1.7, reps: 1, lapses: 3 },
  };
}

const HARD_KEYWORDS: string[] = [
  'CHA2DS2-VASc',
  'Holosystolic murmur',
  'Amyloid plaques',
  'Exophthalmos',
  'Portal hypertension',
  'Transmural inflammation',
  'Ketoacidosis',
];

// ─── Seed action ─────────────────────────────────────────────────────────────

/** Replace all local study data with the demo dataset. */
export function seedDemoData(): void {
  saveStored('medstudy-subjects', buildDemoSubjects());
  saveStored('medstudy-diseases', buildDemoDiseases());
  saveStored('medstudy-card-scores', buildDemoCardScores());
  saveStored('medstudy-hard-keywords', HARD_KEYWORDS);
  saveStored('medstudy-review-state', buildDemoReviewState());
  savePreference('medstudy-quizzes-completed', '5');
}
