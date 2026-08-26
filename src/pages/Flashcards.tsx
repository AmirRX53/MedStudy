import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { useSubjects } from "../contexts/SubjectsContext";
import { useDiseases } from "../contexts/DiseasesContext";
import { loadStored, saveStored } from "../lib/storage";
import {
  gradeCard,
  isDue,
  loadReviewState,
  nextIntervals,
  saveReviewState,
  type Grade,
  type ReviewState,
} from "../lib/srs";
import type { Disease } from "../types";

const GRADE_ICONS: Record<Grade, string> = {
  again: "🔁",
  hard: "😰",
  good: "🙂",
  easy: "😊",
};

// ─── Flashcard Component ──────────────────────────────────────────────────────

function Flashcard({
  disease,
  subjectName,
  chapterName,
  isFlipped,
  showAddress,
  zoom,
  onClick,
  direction,
  hardKeywords,
  onToggleHard,
  averageScore,
  onGrade,
  intervalPreview,
}: {
  disease: { id: string; name: string; keywords: string[] };
  subjectName: string;
  chapterName: string;
  isFlipped: boolean;
  showAddress: boolean;
  zoom: number;
  onClick: () => void;
  direction: "left" | "right" | "none";
  hardKeywords: Set<string>;
  onToggleHard: (keyword: string) => void;
  averageScore: number;
  onGrade: (grade: Grade) => void;
  intervalPreview: Record<Grade, number>;
}) {
  const { t } = useLanguage();

  const directionClass =
    direction === "left"
      ? "card-slide-left"
      : direction === "right"
        ? "card-slide-right"
        : "";

  const gradeButtons: Grade[] = ["again", "hard", "good", "easy"];
  const gradeLabels: Record<Grade, string> = {
    again: t("gradeAgain"),
    hard: t("gradeHard"),
    good: t("gradeGood"),
    easy: t("gradeEasy"),
  };
  const gradeClasses: Record<Grade, string> = {
    again: "grade-btn-again",
    hard: "grade-btn-hard",
    good: "grade-btn-good",
    easy: "grade-btn-easy",
  };
  const formatInterval = (days: number) =>
    t("daysAhead").replace("{{count}}", String(days));

  return (
    <div
      className={`flashcard-wrapper ${directionClass}`}
      style={{ transform: `scale(${zoom})` }}
    >
      <div
        className={`flashcard ${isFlipped ? "flipped" : ""}`}
        onClick={onClick}
      >
        {/* Front */}
        <div className="flashcard-front">
          <div className="flashcard-front-inner">
            <div className="flashcard-name">{disease.name}</div>
            {averageScore > 0 && (
              <div className="flashcard-score-badge">
                <span
                  className={`score-value ${averageScore >= 2.3 ? "score-easy" : averageScore >= 1.5 ? "score-medium" : "score-hard"}`}
                >
                  {averageScore.toFixed(1)}
                </span>
              </div>
            )}
            <div className="flashcard-front-footer">
              <span className="flashcard-kw-count">
                {t("keywordsCount").replace(
                  "{{count}}",
                  String(disease.keywords.length),
                )}
              </span>
              {showAddress && (
                <span className="flashcard-address">
                  {subjectName} › {chapterName}
                </span>
              )}
            </div>
          </div>
          <div className="flashcard-hint">{t("clickToReveal")}</div>
        </div>

        {/* Back */}
        <div className="flashcard-back">
          <div className="flashcard-back-inner">
            <div className="flashcard-back-name">{disease.name}</div>
            <div className="flashcard-back-keywords">
              {disease.keywords.length === 0 ? (
                <span className="flashcard-no-kw">—</span>
              ) : (
                disease.keywords.map((kw) => (
                  <span
                    key={kw}
                    className={`keyword-chip ${hardKeywords.has(kw) ? "hard" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleHard(kw);
                    }}
                  >
                    {kw}
                  </span>
                ))
              )}
            </div>
          </div>
          {showAddress && (
            <div className="flashcard-back-address">
              {subjectName} › {chapterName}
            </div>
          )}
          {/* Grade Buttons */}
          <div
            className="flashcard-grade-buttons"
            onClick={(e) => e.stopPropagation()}
          >
            {gradeButtons.map((grade) => (
              <button
                key={grade}
                className={`grade-btn ${gradeClasses[grade]}`}
                onClick={() => onGrade(grade)}
                title={gradeLabels[grade]}
                aria-label={gradeLabels[grade]}
              >
                <span className="grade-main">
                  <span className="grade-icon">{GRADE_ICONS[grade]}</span>
                  <span className="grade-label">{gradeLabels[grade]}</span>
                </span>
                <span className="grade-interval">
                  {formatInterval(intervalPreview[grade])}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Flashcard Help Modal ─────────────────────────────────────────────────────

function HelpModal({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();

  // Close with the Escape key, matching the app's modal conventions.
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const sections: { icon: string; title: string; text: string }[] = [
    { icon: "🃏", title: t("helpBasics"), text: t("helpBasicsText") },
    { icon: "⭐", title: t("helpScoring"), text: t("helpScoringText") },
    { icon: "🗓️", title: t("helpSchedule"), text: t("helpScheduleText") },
    { icon: "🔔", title: t("helpSessions"), text: t("helpSessionsText") },
    { icon: "📌", title: t("helpHardKeywords"), text: t("helpHardKeywordsText") },
    { icon: "🧭", title: t("helpNavigation"), text: t("helpNavigationText") },
    { icon: "🔍", title: t("helpFilters"), text: t("helpFiltersText") },
    { icon: "⌨️", title: t("helpKeyboard"), text: t("helpKeyboardText") },
    { icon: "🔗", title: t("helpRelated"), text: t("helpRelatedText") },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal modal-lg help-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t("helpFlashcards")}
      >
        <h3 className="modal-title">❓ {t("helpFlashcards")}</h3>
        <p className="help-modal-intro">{t("helpIntro")}</p>
        <div className="help-modal-body">
          {sections.map((s) => (
            <div className="help-modal-section" key={s.title}>
              <div className="help-modal-section-icon">{s.icon}</div>
              <div className="help-modal-section-content">
                <h4 className="help-modal-section-title">{s.title}</h4>
                <p className="help-modal-section-text">{s.text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="help-modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            {t("helpGotIt")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Flashcards Page ─────────────────────────────────────────────────────

export default function FlashcardsPage() {
  const { t, dir } = useLanguage();
  const { subjects } = useSubjects();
  const { diseases } = useDiseases();
  const [searchParams] = useSearchParams();

  const [filterSubject, setFilterSubject] = useState(
    () => searchParams.get("subject") || "",
  );
  const [filterChapter, setFilterChapter] = useState(
    () => searchParams.get("chapter") || "",
  );
  const [searchQuery, setSearchQuery] = useState("");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showAddress, setShowAddress] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [direction, setDirection] = useState<"left" | "right" | "none">("none");
  const [shuffledOrder, setShuffledOrder] = useState<number[]>([]);
  const [hardKeywords, setHardKeywords] = useState<Set<string>>(() => {
    try {
      return new Set(loadStored<string[]>("medstudy-hard-keywords", []));
    } catch {
      return new Set();
    }
  });
  const [cardScores, setCardScores] = useState<
    Record<string, { count: number; average: number }>
  >(() => {
    try {
      return loadStored<Record<string, { count: number; average: number }>>("medstudy-card-scores", {});
    } catch {
      return {};
    }
  });
  const [reviewState, setReviewState] = useState<Record<string, ReviewState>>(
    () => {
      try {
        return loadReviewState();
      } catch {
        return {};
      }
    },
  );

  // Spaced-repetition session state.
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionQueue, setSessionQueue] = useState<string[]>([]);
  const [sessionIndex, setSessionIndex] = useState(0);
  const [sessionReviewed, setSessionReviewed] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);
  const [requeued, setRequeued] = useState<Set<string>>(new Set());

  const isTransitioning = useRef(false);
  const [helpOpen, setHelpOpen] = useState(false);

  // Persist hard keywords to localStorage
  useEffect(() => {
    saveStored("medstudy-hard-keywords", [...hardKeywords]);
  }, [hardKeywords]);

  // Persist card scores to localStorage
  useEffect(() => {
    saveStored("medstudy-card-scores", cardScores);
  }, [cardScores]);

  // Persist spaced-repetition state to localStorage
  useEffect(() => {
    saveReviewState(reviewState);
  }, [reviewState]);

  const toggleHardKeyword = useCallback((keyword: string) => {
    setHardKeywords((prev) => {
      const next = new Set(prev);
      if (next.has(keyword)) {
        next.delete(keyword);
      } else {
        next.add(keyword);
      }
      return next;
    });
  }, []);

  // Filter chapters based on selected subject
  const filterChapters = useMemo(() => {
    if (!filterSubject) return [];
    const s = subjects.find((s) => s.id === filterSubject);
    return s?.chapters || [];
  }, [filterSubject, subjects]);

  // Filter diseases (same logic as diseases page)
  const filteredDiseases = useMemo(() => {
    return diseases.filter((d) => {
      if (filterSubject && d.subjectId !== filterSubject) return false;
      if (filterChapter && d.chapterId !== filterChapter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const subject = subjects.find((s) => s.id === d.subjectId);
        const chapter = subject?.chapters.find((c) => c.id === d.chapterId);
        const haystack = [
          d.name,
          subject?.name || "",
          chapter?.name || "",
          ...d.keywords,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [diseases, filterSubject, filterChapter, searchQuery, subjects]);

  // Apply shuffle order to get display list
  const displayDiseases = useMemo(() => {
    if (shuffledOrder.length === filteredDiseases.length) {
      return shuffledOrder.map((i) => filteredDiseases[i]).filter(Boolean);
    }
    return filteredDiseases;
  }, [filteredDiseases, shuffledOrder]);

  // Reset shuffle and exit any review session when filters change
  useEffect(() => {
    setShuffledOrder([]);
    setCurrentIndex(0);
    setSessionActive(false);
    setSessionDone(false);
    setSessionQueue([]);
    setSessionIndex(0);
    setSessionReviewed(0);
    setRequeued(new Set());
  }, [filterSubject, filterChapter, searchQuery]);

  // Clamp index when display list changes
  useEffect(() => {
    if (currentIndex >= displayDiseases.length) {
      setCurrentIndex(Math.max(0, displayDiseases.length - 1));
    }
  }, [displayDiseases.length, currentIndex]);

  // Reset flip when changing cards
  useEffect(() => {
    setIsFlipped(false);
  }, [currentIndex, sessionIndex]);

  const clearFilters = () => {
    setFilterSubject("");
    setFilterChapter("");
    setSearchQuery("");
  };

  const hasFilters = filterSubject || filterChapter || searchQuery;

  // Session deck is the ordered list of due card ids, resolved to diseases.
  const sessionDiseases = useMemo(() => {
    return sessionQueue
      .map((id) => diseases.find((d) => d.id === id))
      .filter((d): d is Disease => Boolean(d));
  }, [sessionQueue, diseases]);

  const deck = sessionActive ? sessionDiseases : displayDiseases;
  const deckIndex = sessionActive ? sessionIndex : currentIndex;
  const currentDisease = deck[deckIndex];

  // Number of cards currently due (new cards are due immediately).
  const dueCount = useMemo(() => {
    const now = Date.now();
    return filteredDiseases.filter((d) => isDue(reviewState[d.id], now)).length;
  }, [filteredDiseases, reviewState]);

  const startSession = useCallback(() => {
    const now = Date.now();
    const dueIds = filteredDiseases
      .filter((d) => isDue(reviewState[d.id], now))
      .map((d) => d.id);
    if (dueIds.length === 0) return;
    setSessionQueue(dueIds);
    setSessionIndex(0);
    setSessionReviewed(0);
    setRequeued(new Set());
    setSessionDone(false);
    setSessionActive(true);
    setIsFlipped(false);
    setDirection("none");
  }, [filteredDiseases, reviewState]);

  const endSession = useCallback(() => {
    setSessionActive(false);
    setSessionDone(false);
    setSessionQueue([]);
    setSessionIndex(0);
    setSessionReviewed(0);
    setRequeued(new Set());
  }, []);

  // Preview the next interval in days for each grade on the current card.
  const intervalPreview = useMemo(() => {
    const state = currentDisease ? reviewState[currentDisease.id] : undefined;
    return nextIntervals(state);
  }, [currentDisease, reviewState]);

  // Grade the current card: update SRS state + legacy score, then advance the
  // session (re-queueing Again cards) or simply record in browse mode.
  const gradeCurrent = useCallback(
    (grade: Grade) => {
      const disease = currentDisease;
      if (!disease || (sessionActive && sessionDone)) return;

      const now = Date.now();
      setReviewState((prev) => ({
        ...prev,
        [disease.id]: gradeCard(prev[disease.id], grade, now),
      }));

      // Keep the legacy 1-3 score scale in sync for stats and quizzes.
      const legacyScore = grade === "again" ? 1 : grade === "hard" ? 2 : 3;
      setCardScores((prev) => {
        const existing = prev[disease.id] || { count: 0, average: 0 };
        const previousTotal = existing.average * existing.count;
        const newCount = existing.count + 1;
        const newAverage = (previousTotal + legacyScore) / newCount;
        return {
          ...prev,
          [disease.id]: { count: newCount, average: newAverage },
        };
      });

      if (sessionActive) {
        setSessionReviewed((n) => n + 1);
        const requeue = grade === "again" && !requeued.has(disease.id);
        if (requeue) {
          setRequeued((prev) => new Set(prev).add(disease.id));
          setSessionQueue((prev) => [...prev, disease.id]);
          setSessionIndex((prev) => prev + 1);
        } else if (sessionIndex + 1 >= sessionQueue.length) {
          setSessionDone(true);
        } else {
          setSessionIndex((prev) => prev + 1);
        }
        setIsFlipped(false);
        setDirection("right");
        setTimeout(() => setDirection("none"), 400);
      }
    },
    [currentDisease, sessionActive, sessionDone, sessionIndex, sessionQueue.length, requeued],
  );

  const navigate = useCallback(
    (dir: "prev" | "next") => {
      if (sessionActive) return;
      if (isTransitioning.current) return;
      if (displayDiseases.length === 0) return;

      isTransitioning.current = true;
      setDirection(dir === "prev" ? "left" : "right");
      setIsFlipped(false);

      // Swap the card immediately so the name, address, and score update without
      // delay; the newly mounted card plays the slide-in animation (see the
      // key={disease.id} on Flashcard below).
      setCurrentIndex((prev) => {
        if (dir === "next") {
          return prev < displayDiseases.length - 1 ? prev + 1 : 0;
        } else {
          return prev > 0 ? prev - 1 : displayDiseases.length - 1;
        }
      });

      // Release the navigation lock once the slide-in animation completes.
      setTimeout(() => {
        setDirection("none");
        isTransitioning.current = false;
      }, 400);
    },
    [displayDiseases.length, sessionActive],
  );

  const shuffle = useCallback(() => {
    if (sessionActive) return;
    if (displayDiseases.length <= 1) return;
    // Pick a random index that's different from current
    // Shuffle by reordering the filtered diseases array
    setShuffledOrder((prev) => {
      const arr = [
        ...(prev.length === filteredDiseases.length
          ? prev
          : filteredDiseases.map((_, i) => i)),
      ];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    });
    setIsFlipped(false);
    setDirection("right");
    setCurrentIndex(0);
    setTimeout(() => setDirection("none"), 400);
  }, [displayDiseases.length, filteredDiseases.length, sessionActive]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Ignore page shortcuts while the help modal is open.
      if (helpOpen) return;
      // Match the visual reading direction: in LTR (English) the left arrow goes
      // back and the right arrow advances; in RTL (Persian) they are reversed.
      const prevKey = dir === "rtl" ? "ArrowRight" : "ArrowLeft";
      const nextKey = dir === "rtl" ? "ArrowLeft" : "ArrowRight";
      if (e.key === prevKey) navigate("prev");
      if (e.key === nextKey) navigate("next");
      if ((e.key === " " || e.key === "Enter") && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement)) {
        e.preventDefault();
        setIsFlipped((f) => !f);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [navigate, dir, helpOpen]);

  const getSubjectChapter = (d: typeof currentDisease) => {
    const subject = subjects.find((s) => s.id === d.subjectId);
    const chapter = subject?.chapters.find((c) => c.id === d.chapterId);
    return {
      subjectName: subject?.name || "?",
      chapterName: chapter?.name || "?",
    };
  };

  const zoomIn = () => setZoom((z) => Math.min(z + 0.1, 1.5));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.1, 0.5));

  const progressCurrent = deckIndex + 1;
  const progressTotal = deck.length;

  const sessionDoneView = (
    <div className="fc-session-done">
      <div className="placeholder-icon">🎉</div>
      <h3 className="fc-session-done-title">{t("sessionComplete")}</h3>
      <p className="fc-session-done-text">
        {t("sessionSummary").replace("{{count}}", String(sessionReviewed))}
      </p>
      <div className="fc-session-done-actions">
        <button className="btn btn-primary" onClick={endSession}>
          {t("endSession")}
        </button>
        <button className="btn btn-ghost" onClick={startSession}>
          {t("startNewSession")}
        </button>
      </div>
    </div>
  );

  const cardView = (
    <>
      {/* Progress Bar */}
      <div className="fc-progress">
        <div className="fc-progress-bar">
          <div
            className="fc-progress-fill"
            style={{
              width: `${progressTotal > 0 ? (progressCurrent / progressTotal) * 100 : 0}%`,
            }}
          />
        </div>
        <span className="fc-progress-text">
          {t("progress")
            .replace("{{current}}", String(progressCurrent))
            .replace("{{total}}", String(progressTotal))}
        </span>
      </div>

      {/* Flashcard */}
      <div className="fc-stage">
        {currentDisease && (
          <Flashcard
            key={currentDisease.id}
            disease={currentDisease}
            subjectName={getSubjectChapter(currentDisease).subjectName}
            chapterName={getSubjectChapter(currentDisease).chapterName}
            isFlipped={isFlipped}
            showAddress={showAddress}
            zoom={zoom}
            onClick={() => setIsFlipped((f) => !f)}
            direction={direction}
            hardKeywords={hardKeywords}
            onToggleHard={toggleHardKeyword}
            averageScore={cardScores[currentDisease.id]?.average || 0}
            onGrade={gradeCurrent}
            intervalPreview={intervalPreview}
          />
        )}
      </div>

      {/* Navigation Controls */}
      <div className="fc-nav">
        {!sessionActive && (
          <button
            className="btn btn-ghost fc-nav-btn fc-nav-edge-btn"
            onClick={() => navigate("prev")}
          >
            <span className="fc-nav-arrow" aria-hidden="true">{dir === "rtl" ? "→" : "←"}</span>
            <span className="fc-nav-label">{t("previousCard")}</span>
          </button>
        )}
        <button
          className="btn btn-primary fc-nav-btn"
          onClick={() => setIsFlipped((f) => !f)}
        >
          {isFlipped ? "🔀" : "💡"} {isFlipped ? t("front") : t("back")}
        </button>
        {!sessionActive && (
          <button
            className="btn btn-ghost fc-nav-btn fc-nav-edge-btn"
            onClick={() => navigate("next")}
          >
            <span className="fc-nav-label">{t("nextCard")}</span>
            <span className="fc-nav-arrow" aria-hidden="true">{dir === "rtl" ? "←" : "→"}</span>
          </button>
        )}
      </div>
    </>
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">🃏 {t("flashcards")}</h2>

        {/* Controls Top */}
        <div className="page-header-actions">
          <button
            className={`btn btn-sm ${sessionActive ? "btn-primary" : "btn-ghost"}`}
            onClick={sessionActive ? endSession : startSession}
            disabled={!sessionActive && dueCount === 0}
            title={t("dueNowHint")}
          >
            🔔{" "}
            {t("dueNow").replace(
              "{{count}}",
              String(sessionActive ? sessionQueue.length - sessionIndex : dueCount),
            )}
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setShowAddress((a) => !a)}
          >
            📍 {t("toggleAddress")}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={shuffle}>
            🔀 {t("shuffleCards")}
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setHelpOpen(true)}
            title={t("helpFlashcards")}
          >
            ❓ {t("help")}
          </button>
          <div className="fc-zoom-controls">
            <button className="icon-btn" onClick={zoomOut} title={t("zoomOut")}>
              −
            </button>
            <span className="fc-zoom-label">{Math.round(zoom * 100)}%</span>
            <button className="icon-btn" onClick={zoomIn} title={t("zoomIn")}>
              +
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <select
          className="filter-select"
          value={filterSubject}
          onChange={(e) => {
            setFilterSubject(e.target.value);
            setFilterChapter("");
          }}
        >
          <option value="">{t("allSubjects")}</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          className="filter-select"
          value={filterChapter}
          onChange={(e) => setFilterChapter(e.target.value)}
          disabled={!filterSubject}
        >
          <option value="">{t("allChapters")}</option>
          {filterChapters.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          className="filter-search"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("searchFlashcards")}
        />
        {hasFilters && (
          <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
            {t("clearFilters")}
          </button>
        )}
      </div>

      {/* Session Banner */}
      {sessionActive && !sessionDone && (
        <div className="fc-session-bar">
          <span className="fc-session-badge">🔔 {t("sessionLabel")}</span>
          <span className="fc-session-progress">
            {t("progress")
              .replace("{{current}}", String(sessionIndex + 1))
              .replace("{{total}}", String(sessionQueue.length))}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={endSession}>
            {t("endSession")}
          </button>
        </div>
      )}

      {/* Card Area */}
      {sessionActive && sessionDone ? (
        sessionDoneView
      ) : sessionActive ? (
        sessionDiseases.length === 0 ? (
          <div className="empty-state">
            <div className="placeholder-icon">🔔</div>
            <p className="empty-text">{t("noDueCards")}</p>
          </div>
        ) : (
          cardView
        )
      ) : displayDiseases.length === 0 ? (
        <div className="empty-state">
          <div className="placeholder-icon">🃏</div>
          <p className="empty-text">
            {diseases.length === 0
              ? t("noFlashcards")
              : t("noFlashcardResults")}
          </p>
        </div>
      ) : (
        cardView
      )}

      {/* Help Modal */}
      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
    </div>
  );
}
