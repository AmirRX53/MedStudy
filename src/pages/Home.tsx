import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useSubjects } from '../contexts/SubjectsContext';
import { useDiseases } from '../contexts/DiseasesContext';

export default function HomePage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { subjects } = useSubjects();
  const { diseases } = useDiseases();

  const [cardScores, setCardScores] = useState<Record<string, { count: number; average: number }>>({});
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('medstudy-card-scores');
      if (raw) setCardScores(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  // Random card — pick a new random disease each time
  const [randomDisease, setRandomDisease] = useState(() => {
    if (diseases.length === 0) return null;
    return diseases[Math.floor(Math.random() * diseases.length)];
  });

  const pickNewRandom = useCallback(() => {
    if (diseases.length <= 1) return;
    setIsFlipped(false);
    setTimeout(() => {
      setRandomDisease(prev => {
        let next;
        do {
          next = diseases[Math.floor(Math.random() * diseases.length)];
        } while (next.id === prev?.id && diseases.length > 1);
        return next;
      });
    }, 100);
  }, [diseases]);

  // Stats
  const totalSubjects = subjects.length;
  const totalChapters = subjects.reduce((sum, s) => sum + s.chapters.length, 0);
  const totalDiseases = diseases.length;
  const totalKeywords = diseases.reduce((sum, d) => sum + d.keywords.length, 0);
  const totalReviewed = Object.values(cardScores).reduce((sum, s) => sum + s.count, 0);

  // Feature cards
  const shortcuts = [
    { icon: '📚', title: t('subjectsShortcut'), desc: t('subjectsShortcutDesc'), path: '/subjects', color: '#3b82f6' },
    { icon: '🦠', title: t('diseasesShortcut'), desc: t('diseasesShortcutDesc'), path: '/diseases', color: '#ef4444' },
    { icon: '🃏', title: t('flashcardsShortcut'), desc: t('flashcardsShortcutDesc'), path: '/flashcards', color: '#8b5cf6' },
    { icon: '🎯', title: t('practiceShortcut'), desc: t('practiceShortcutDesc'), path: '/practice', color: '#10b981' },
    { icon: '📊', title: t('statisticsShortcut'), desc: t('statisticsShortcutDesc'), path: '/statistics', color: '#f97316' },
  ];

  const features = [
    t('feature1'), t('feature2'), t('feature3'), t('feature4'), t('feature5'),
  ];

  const getSubjectChapter = (d: typeof randomDisease) => {
    if (!d) return { subjectName: '', chapterName: '' };
    const subject = subjects.find(s => s.id === d.subjectId);
    const chapter = subject?.chapters.find(c => c.id === d.chapterId);
    return { subjectName: subject?.name || '?', chapterName: chapter?.name || '?' };
  };

  const { subjectName, chapterName } = getSubjectChapter(randomDisease);

  return (
    <div className="page-container home-page">
      {/* ─── Hero / Welcome ──────────────────────────────────────────────── */}
      <section className="home-hero">
        <div className="home-hero-content">
          <span className="home-hero-badge">🏥 {t('appTitle')}</span>
          <h1 className="home-hero-title">{t('welcomeTitle')}</h1>
          <p className="home-hero-desc">{t('welcomeDesc')}</p>
          <div className="home-hero-actions">
            <button className="btn home-hero-primary" onClick={() => navigate('/practice')}>🎯 {t('practice')}</button>
            <button className="btn home-hero-secondary" onClick={() => navigate('/flashcards')}>🃏 {t('flashcards')}</button>
          </div>
        </div>
        <div className="home-hero-orb home-hero-orb-one" />
        <div className="home-hero-orb home-hero-orb-two" />
        <div className="home-hero-wave" />
      </section>

      {/* ─── Dashboard Highlights ───────────────────────────────────────── */}
      <div className="home-dashboard-grid">
        <section className="home-stats-panel">
          <div className="home-panel-heading">
            <span className="home-section-kicker">{t('overview')}</span>
            <h2>{t('statistics')}</h2>
          </div>
          <div className="home-stats-row" aria-label={t('overview')}>
        <div className="home-stat-pill" onClick={() => navigate('/subjects')}>
          <span className="home-stat-num">{totalSubjects}</span>
          <span className="home-stat-label">{t('subjects')}</span>
        </div>
        <div className="home-stat-pill" onClick={() => navigate('/subjects')}>
          <span className="home-stat-num">{totalChapters}</span>
          <span className="home-stat-label">{t('chapters')}</span>
        </div>
        <div className="home-stat-pill" onClick={() => navigate('/diseases')}>
          <span className="home-stat-num">{totalDiseases}</span>
          <span className="home-stat-label">{t('diseasesLabel')}</span>
        </div>
        <div className="home-stat-pill" onClick={() => navigate('/statistics')}>
          <span className="home-stat-num">{totalKeywords}</span>
          <span className="home-stat-label">{t('keywordsCountLabel')}</span>
        </div>
        <div className="home-stat-pill" onClick={() => navigate('/flashcards')}>
          <span className="home-stat-num">{totalReviewed}</span>
          <span className="home-stat-label">{t('cardsReviewed')}</span>
        </div>
          </div>
        </section>

        {/* ─── Card of the Day ────────────────────────────────────────────── */}
        <section className="home-cotd card">
        <div className="home-cotd-header">
          <span className="home-cotd-icon">🃏</span>
          <div>
            <h3 className="home-cotd-title">{t('cardOfTheHour')}</h3>
            <p className="home-cotd-desc">{t('cardOfTheHourDesc')}</p>
          </div>
        </div>

        {randomDisease ? (
          <div className="home-flashcard-stage">
            <div
              className={`home-flashcard ${isFlipped ? 'flipped' : ''}`}
              onClick={() => setIsFlipped(f => !f)}
            >
              {/* Front */}
              <div className="home-flashcard-front">
                <div className="home-flashcard-front-inner">
                  <div className="home-flashcard-name">{randomDisease.name}</div>
                  <div className="home-flashcard-front-footer">
                    <span className="home-flashcard-kw-count">
                      {t('keywordsCount').replace('{{count}}', String(randomDisease.keywords.length))}
                    </span>
                    <span className="home-flashcard-address">
                      {subjectName} › {chapterName}
                    </span>
                  </div>
                </div>
                <div className="home-flashcard-hint">{t('clickToReveal')}</div>
              </div>

              {/* Back */}
              <div className="home-flashcard-back">
                <div className="home-flashcard-back-inner">
                  <div className="home-flashcard-back-name">{randomDisease.name}</div>
                  <div className="home-flashcard-back-keywords">
                    {randomDisease.keywords.length === 0 ? (
                      <span className="flashcard-no-kw">—</span>
                    ) : (
                      randomDisease.keywords.map(kw => (
                        <span key={kw} className="keyword-chip">{kw}</span>
                      ))
                    )}
                  </div>
                </div>
                <div className="home-flashcard-back-address">
                  {subjectName} › {chapterName}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="home-flashcard-controls">
              <button className="btn btn-ghost btn-sm" onClick={() => setIsFlipped(f => !f)}>
                {isFlipped ? `📋 ${t('front')}` : `💡 ${t('back')}`}
              </button>
              <button className="btn btn-primary btn-sm" onClick={pickNewRandom}>
                🔀 {t('shuffleCards')}
              </button>
            </div>
          </div>
        ) : (
          <div className="home-cotd-empty">
            <p>{t('noCardAvailable')}</p>
          </div>
        )}
        </section>
      </div>

      {/* ─── Quick Access Shortcuts ──────────────────────────────────────── */}
      <div className="home-section-heading">
        <div>
          <span className="home-section-kicker">{t('quickStart')}</span>
          <h3 className="home-section-title">{t('getStarted')}</h3>
        </div>
        <p className="home-section-desc">{t('quickStartDesc')}</p>
      </div>
      <div className="home-shortcuts-grid">
        {shortcuts.map(sc => (
          <div key={sc.path} className="home-shortcut-card" onClick={() => navigate(sc.path)}>
            <div className="home-shortcut-icon" style={{ background: `${sc.color}15`, color: sc.color }}>{sc.icon}</div>
            <div className="home-shortcut-info">
              <span className="home-shortcut-title">{sc.title}</span>
              <span className="home-shortcut-desc">{sc.desc}</span>
            </div>
            <span className="home-shortcut-arrow">→</span>
          </div>
        ))}
      </div>

      {/* ─── Study Goal ──────────────────────────────────────────────────── */}
      <div className="home-study-goal card">
        <div className="home-study-goal-icon">🎯</div>
        <div>
          <h3 className="home-study-goal-title">{t('studyGoalTitle')}</h3>
          <p className="home-study-goal-desc">{t('studyGoalDesc')}</p>
        </div>
      </div>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer className="home-footer">
        <div className="home-footer-top">
          <div className="home-footer-brand">
            <span className="home-footer-logo">🏥</span>
            <span className="home-footer-appname">{t('appTitle')}</span>
          </div>
          <p className="home-footer-about">{t('aboutDesc')}</p>
        </div>
        <div className="home-footer-features">
          <h4 className="home-footer-section-title">{t('features')}</h4>
          <ul className="home-footer-feature-list">
            {features.map((f, i) => (
              <li key={i} className="home-footer-feature-item">
                <span className="home-footer-check">✓</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
        <div className="home-footer-bottom">
          <span className="home-footer-version">{t('version')}</span>
          <span className="home-footer-made">{t('madeWith')}</span>
          <span className="home-footer-copy">{t('copyright')}</span>
        </div>
      </footer>
    </div>
  );
}
