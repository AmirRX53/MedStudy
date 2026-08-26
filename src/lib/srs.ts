import { loadStored, saveStored } from './storage';

/**
 * SM-2 spaced-repetition scheduler state for one card (disease).
 *
 * - `due`: epoch milliseconds at which the card is next due for review.
 *   A value of 0 (never reviewed) means the card is due immediately.
 * - `interval`: current interval in days (0 for a new card).
 * - `ease`: ease factor, starts at 2.5 and never drops below 1.3.
 * - `reps`: consecutive successful reviews.
 * - `lapses`: number of times the card was forgotten (graded Again).
 */
export interface ReviewState {
  due: number;
  interval: number;
  ease: number;
  reps: number;
  lapses: number;
}

export type Grade = 'again' | 'hard' | 'good' | 'easy';

const REVIEW_STATE_KEY = 'medstudy-review-state';
const MAX_INTERVAL_DAYS = 365;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// SM-2 quality mapping for the four-button grade scale.
const GRADE_QUALITY: Record<Grade, number> = {
  again: 1,
  hard: 3,
  good: 4,
  easy: 5,
};

export function emptyReviewState(): ReviewState {
  return { due: 0, interval: 0, ease: 2.5, reps: 0, lapses: 0 };
}

export function isDue(state: ReviewState | undefined, now = Date.now()): boolean {
  return (state?.due ?? 0) <= now;
}

/**
 * Pure SM-2 transition for a single review.
 *
 * Passes grow the interval through the classic 1 / 6 / ease-based steps and
 * nudge the ease factor upward. A fail (Again) resets reps, collapses the
 * interval back to 1 day, and increments lapses. All intervals are capped at
 * 365 days.
 */
export function gradeCard(
  state: ReviewState | undefined,
  grade: Grade,
  now = Date.now(),
): ReviewState {
  const current = state ?? emptyReviewState();
  const quality = GRADE_QUALITY[grade];
  let { interval, ease, reps, lapses } = current;

  if (quality >= 3) {
    if (reps === 0) {
      interval = 1;
    } else if (reps === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * ease);
    }
    reps += 1;
    ease = Math.max(1.3, ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  } else {
    reps = 0;
    interval = 1;
    lapses += 1;
  }

  interval = Math.min(MAX_INTERVAL_DAYS, interval);
  return { due: now + interval * MS_PER_DAY, interval, ease, reps, lapses };
}

/**
 * Preview the next interval (in days) for every grade without mutating state.
 * Used to show live interval labels on the flashcard grade buttons.
 */
export function nextIntervals(
  state: ReviewState | undefined,
  now = Date.now(),
): Record<Grade, number> {
  return {
    again: gradeCard(state, 'again', now).interval,
    hard: gradeCard(state, 'hard', now).interval,
    good: gradeCard(state, 'good', now).interval,
    easy: gradeCard(state, 'easy', now).interval,
  };
}

function isReviewState(value: unknown): value is ReviewState {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.due === 'number'
    && typeof candidate.interval === 'number'
    && typeof candidate.ease === 'number'
    && typeof candidate.reps === 'number'
    && typeof candidate.lapses === 'number';
}

export function loadReviewState(): Record<string, ReviewState> {
  return loadStored(REVIEW_STATE_KEY, {}, value => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
    return Object.values(value).every(isReviewState);
  });
}

export function saveReviewState(state: Record<string, ReviewState>): void {
  saveStored(REVIEW_STATE_KEY, state);
}

/**
 * Apply a grade to one card and persist the whole review-state map.
 * Used by quiz result funnels so wrong answers reschedule cards too.
 */
export function recordReviewGrade(
  diseaseId: string,
  grade: Grade,
  now = Date.now(),
): ReviewState {
  const state = loadReviewState();
  const next = gradeCard(state[diseaseId], grade, now);
  state[diseaseId] = next;
  saveReviewState(state);
  return next;
}
