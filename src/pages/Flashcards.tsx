import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { useSubjects } from "../contexts/SubjectsContext";
import { useDiseases } from "../contexts/DiseasesContext";
import { loadStored, saveStored } from "../lib/storage";

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
  onScore,
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
  onScore: (score: number) => void;
}) {
  const { t } = useLanguage();

  const directionClass =
    direction === "left"
      ? "card-slide-left"
      : direction === "right"
        ? "card-slide-right"
        : "";

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
          {/* Score Buttons */}
          <div
            className="flashcard-score-buttons"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="score-btn score-btn-easy"
              onClick={() => onScore(3)}
              title={t("easyTooltip")}
              aria-label={t("easyTooltip")}
            >
              😊
            </button>
            <button
              className="score-btn score-btn-medium"
              onClick={() => onScore(2)}
              title={t("mediumTooltip")}
              aria-label={t("mediumTooltip")}
            >
              🤔
            </button>
            <button
              className="score-btn score-btn-hard"
              onClick={() => onScore(1)}
              title={t("hardTooltip")}
              aria-label={t("hardTooltip")}
            >
              😰
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Flashcards Page ─────────────────────────────────────────────────────

export default function FlashcardsPage() {
  const { t } = useLanguage();
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

  const isTransitioning = useRef(false);

  // Persist hard keywords to localStorage
  useEffect(() => {
    saveStored("medstudy-hard-keywords", [...hardKeywords]);
  }, [hardKeywords]);

  // Persist card scores to localStorage
  useEffect(() => {
    saveStored("medstudy-card-scores", cardScores);
  }, [cardScores]);

  const scoreCard = useCallback((diseaseId: string, score: number) => {
    setCardScores((prev) => {
      const existing = prev[diseaseId] || { count: 0, average: 0 };
      const previousTotal = existing.average * existing.count;
      const newCount = existing.count + 1;
      const newAverage = (previousTotal + score) / newCount;
      return { ...prev, [diseaseId]: { count: newCount, average: newAverage } };
    });
  }, []);

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

  // Reset shuffle when filters change
  useEffect(() => {
    setShuffledOrder([]);
    setCurrentIndex(0);
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
  }, [currentIndex]);

  const clearFilters = () => {
    setFilterSubject("");
    setFilterChapter("");
    setSearchQuery("");
  };

  const hasFilters = filterSubject || filterChapter || searchQuery;
  const currentDisease = displayDiseases[currentIndex];

  const navigate = useCallback(
    (dir: "prev" | "next") => {
      if (isTransitioning.current) return;
      if (displayDiseases.length === 0) return;

      isTransitioning.current = true;
      setDirection(dir === "prev" ? "left" : "right");
      setIsFlipped(false);

      setTimeout(() => {
        setCurrentIndex((prev) => {
          if (dir === "next") {
            return prev < displayDiseases.length - 1 ? prev + 1 : 0;
          } else {
            return prev > 0 ? prev - 1 : displayDiseases.length - 1;
          }
        });
        // Reset direction after animation
        setTimeout(() => {
          setDirection("none");
          isTransitioning.current = false;
        }, 50);
      }, 200);
    },
    [displayDiseases.length],
  );

  const shuffle = useCallback(() => {
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
    setTimeout(() => {
      setCurrentIndex(0);
      setTimeout(() => setDirection("none"), 50);
    }, 200);
  }, [displayDiseases.length, filteredDiseases.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") navigate("next");
      if (e.key === "ArrowLeft") navigate("prev");
      if ((e.key === " " || e.key === "Enter") && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement)) {
        e.preventDefault();
        setIsFlipped((f) => !f);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [navigate]);

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

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">🃏 {t("flashcards")}</h2>

        {/* Controls Top */}
        {/* <div className="fc-controls-top"> */}
        <div className="page-header-actions">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setShowAddress((a) => !a)}
          >
            📍 {t("toggleAddress")}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={shuffle}>
            🔀 {t("shuffleCards")}
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

      {/* Card Area */}
      {displayDiseases.length === 0 ? (
        <div className="empty-state">
          <div className="placeholder-icon">🃏</div>
          <p className="empty-text">
            {diseases.length === 0
              ? t("noFlashcards")
              : t("noFlashcardResults")}
          </p>
        </div>
      ) : (
        <>
          {/* Progress Bar */}
          <div className="fc-progress">
            <div className="fc-progress-bar">
              <div
                className="fc-progress-fill"
                style={{
                  width: `${((currentIndex + 1) / displayDiseases.length) * 100}%`,
                }}
              />
            </div>
            <span className="fc-progress-text">
              {t("progress")
                .replace("{{current}}", String(currentIndex + 1))
                .replace("{{total}}", String(displayDiseases.length))}
            </span>
          </div>

          {/* Flashcard */}
          <div className="fc-stage">
            {currentDisease && (
              <Flashcard
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
                onScore={(score) => scoreCard(currentDisease.id, score)}
              />
            )}
          </div>

          {/* Navigation Controls */}
          <div className="fc-nav">
            <button
              className="btn btn-ghost fc-nav-btn"
              onClick={() => navigate("prev")}
            >
               → {t("previousCard")} 
            </button>
            <button
              className="btn btn-primary fc-nav-btn"
              onClick={() => setIsFlipped((f) => !f)}
            >
              {isFlipped ? "🔀" : "💡"} {isFlipped ? t("front") : t("back")}
            </button>
            <button
              className="btn btn-ghost fc-nav-btn"
              onClick={() => navigate("next")}
            >
              {t("nextCard")} ←
            </button>
          </div>
        </>
      )}
    </div>
  );
}
