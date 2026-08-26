const desktop = typeof window !== 'undefined' ? window.medStudyDesktop : undefined;
const STORAGE_PREFIX = 'medstudy-';
const LEGACY_KEYS: Record<string, string> = {
  // 'medistudy-theme': 'medstudy-theme',
  'medstudy-language': 'medstudy-lang',
};

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function syncDesktop(action: Promise<void> | undefined): void {
  void action?.catch(error => console.error('MedStudy desktop storage error:', error));
}

export function loadStored<T>(key: string, fallback: T, validator?: (value: unknown) => boolean): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const value: unknown = JSON.parse(raw);
    return !validator || validator(value) ? value as T : fallback;
  } catch {
    return fallback;
  }
}

export function saveStored<T>(key: string, value: T): void {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    syncDesktop(desktop?.set(key, serialized));
  } catch (error) {
    console.error(`Unable to save ${key}:`, error);
  }
}

export function loadPreference(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function savePreference(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
    syncDesktop(desktop?.set(key, value));
  } catch (error) {
    console.error(`Unable to save ${key}:`, error);
  }
}

export function removeStored(key: string): void {
  try {
    localStorage.removeItem(key);
    syncDesktop(desktop?.remove(key));
  } catch (error) {
    console.error(`Unable to remove ${key}:`, error);
  }
}

export async function hydrateDesktopStorage(): Promise<void> {
  if (!desktop) {
    migrateLocalPreferences();
    return;
  }

  const desktopData: Record<string, string> = {};
  for (const key of await desktop.keys()) {
    const value = await desktop.get(key);
    if (value !== null) desktopData[key] = value;
  }

  // Electron storage is authoritative, including the empty state after a delete-all.
  if (desktop) {
    for (const key of localStorageKeys()) localStorage.removeItem(key);
    for (const [key, value] of Object.entries(desktopData)) localStorage.setItem(key, value);
  }

  await migratePreferences(desktopData);
}

function localStorageKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) keys.push(key);
  }
  return keys;
}

function migrateLocalPreferences(): void {
  for (const [legacyKey, canonicalKey] of Object.entries(LEGACY_KEYS)) {
    if (localStorage.getItem(canonicalKey) === null) {
      const legacyValue = localStorage.getItem(legacyKey);
      if (legacyValue !== null) localStorage.setItem(canonicalKey, legacyValue);
    }
    localStorage.removeItem(legacyKey);
  }
}

async function migratePreferences(desktopData: Record<string, string>): Promise<void> {
  for (const [legacyKey, canonicalKey] of Object.entries(LEGACY_KEYS)) {
    if (localStorage.getItem(canonicalKey) === null) {
      const value = desktopData[legacyKey] ?? localStorage.getItem(legacyKey);
      if (value !== null && value !== undefined) {
        localStorage.setItem(canonicalKey, value);
        await desktop?.set(canonicalKey, value);
      }
    }
    localStorage.removeItem(legacyKey);
    if (desktopData[legacyKey] !== undefined) await desktop?.remove(legacyKey);
  }
}

// Preference values are stored as plain strings (not JSON), so they must be
// exported verbatim. JSON-parsing them would turn "3" into the number 3 and
// break the backup round-trip.
const RAW_PREFERENCE_KEYS = new Set([
  'medstudy-theme',
  'medstudy-accent',
  'medstudy-lang',
  'medstudy-language',
  'medstudy-quizzes-completed',
]);

export function readStoredData(): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const key of localStorageKeys()) {
    const raw = localStorage.getItem(key);
    if (raw === null) continue;
    if (RAW_PREFERENCE_KEYS.has(key)) {
      data[key] = raw;
      continue;
    }
    try {
      data[key] = JSON.parse(raw);
    } catch {
      data[key] = raw;
    }
  }
  return data;
}

export function validateStoredData(data: unknown): data is JsonRecord {
  if (!isRecord(data)) return false;
  const subjects = data['medstudy-subjects'];
  if (subjects !== undefined && (!Array.isArray(subjects) || subjects.some(subject => {
    if (!isRecord(subject) || typeof subject.id !== 'string' || typeof subject.name !== 'string' || !Array.isArray(subject.chapters)) return true;
    return subject.chapters.some(chapter => !isRecord(chapter) || typeof chapter.id !== 'string' || typeof chapter.name !== 'string');
  }))) return false;

  const diseases = data['medstudy-diseases'];
  if (diseases !== undefined && (!Array.isArray(diseases) || diseases.some(disease =>
    !isRecord(disease) || typeof disease.id !== 'string' || typeof disease.name !== 'string'
      || typeof disease.subjectId !== 'string' || typeof disease.chapterId !== 'string'
      || !Array.isArray(disease.keywords) || disease.keywords.some(keyword => typeof keyword !== 'string')
  ))) return false;

  const scores = data['medstudy-card-scores'];
  if (scores !== undefined && (!isRecord(scores) || Object.values(scores).some(score =>
    !isRecord(score) || typeof score.count !== 'number' || typeof score.average !== 'number'
  ))) return false;

  const hardKeywords = data['medstudy-hard-keywords'];
  if (hardKeywords !== undefined && (!Array.isArray(hardKeywords) || hardKeywords.some(keyword => typeof keyword !== 'string'))) return false;

  const reviewState = data['medstudy-review-state'];
  if (reviewState !== undefined && (!isRecord(reviewState) || Object.values(reviewState).some(entry =>
    !isRecord(entry) || typeof entry.due !== 'number' || typeof entry.interval !== 'number'
      || typeof entry.ease !== 'number' || typeof entry.reps !== 'number' || typeof entry.lapses !== 'number'
  ))) return false;

  const preferenceKeys = ['medstudy-theme', 'medstudy-accent', 'medstudy-lang', 'medstudy-language'];
  const preferencesValid = preferenceKeys.every(key => data[key] === undefined || typeof data[key] === 'string');

  // Accept both the stored string form and the number form produced by older
  // exports, so backups made before this fix still import.
  const quizzes = data['medstudy-quizzes-completed'];
  const quizzesValid = quizzes === undefined
    || typeof quizzes === 'string'
    || (typeof quizzes === 'number' && Number.isFinite(quizzes));

  return preferencesValid && quizzesValid;
}

export async function replaceStoredData(data: JsonRecord): Promise<void> {
  const normalized: JsonRecord = { ...data };
  if (normalized['medstudy-language'] !== undefined && normalized['medstudy-lang'] === undefined) {
    normalized['medstudy-lang'] = normalized['medstudy-language'];
  }
  delete normalized['medstudy-language'];

  const serialized: Record<string, string> = {};
  for (const [key, value] of Object.entries(normalized)) {
    if (!key.startsWith(STORAGE_PREFIX) || value === undefined) continue;
    serialized[key] = typeof value === 'string' ? value : JSON.stringify(value);
  }

  for (const key of localStorageKeys()) localStorage.removeItem(key);
  for (const [key, value] of Object.entries(serialized)) localStorage.setItem(key, value);
  await desktop?.import(serialized);
}

export async function clearStoredData(): Promise<void> {
  for (const key of localStorageKeys()) localStorage.removeItem(key);
  await desktop?.clear();
}

export function removeDiseaseReviewData(diseaseIds: string[]): void {
  if (diseaseIds.length === 0) return;
  const scores = loadStored<Record<string, { count: number; average: number }>>(
    'medstudy-card-scores',
    {},
    isRecord,
  );
  let changed = false;
  for (const id of diseaseIds) {
    if (id in scores) {
      delete scores[id];
      changed = true;
    }
  }
  if (changed) saveStored('medstudy-card-scores', scores);

  // Keep spaced-repetition state in sync so deleted cards stop being due.
  const reviewState = loadStored<Record<string, unknown>>(
    'medstudy-review-state',
    {},
    isRecord,
  );
  let reviewChanged = false;
  for (const id of diseaseIds) {
    if (id in reviewState) {
      delete reviewState[id];
      reviewChanged = true;
    }
  }
  if (reviewChanged) saveStored('medstudy-review-state', reviewState);
}
