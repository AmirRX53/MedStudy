import { useMemo, useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSubjects } from '../contexts/SubjectsContext';
import { useDiseases } from '../contexts/DiseasesContext';

// ─── Tooltip Component ────────────────────────────────────────────────────────

function TooltipWrap({ tooltip, children }: { tooltip: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <div
      className="tooltip-wrap"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      {show && <div className="tooltip-box">{tooltip}</div>}
    </div>
  );
}

// ─── Sortable Table Header ────────────────────────────────────────────────────

type SortDir = 'asc' | 'desc';

function SortHeader({ label, sortKey, activeSort, dir, onSort }: {
  label: string; sortKey: string; activeSort: string; dir: SortDir; onSort: (key: string) => void;
}) {
  const isActive = activeSort === sortKey;
  return (
    <span
      className={`sort-header ${isActive ? 'active' : ''}`}
      onClick={() => onSort(sortKey)}
    >
      {label}
      {isActive && <span className="sort-arrow">{dir === 'asc' ? ' ↑' : ' ↓'}</span>}
    </span>
  );
}

// ─── Helper Components ────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color, tooltip }: {
  label: string; value: string | number; icon: string; color: string; tooltip?: string;
}) {
  const card = (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: `${color}20`, color }}>{icon}</div>
      <div className="stat-info">
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
      </div>
    </div>
  );
  return tooltip ? <TooltipWrap tooltip={tooltip}>{card}</TooltipWrap> : card;
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="stat-bar-track">
      <div className="stat-bar-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function ScoreBar({ easy, medium, hard }: { easy: number; medium: number; hard: number }) {
  const total = easy + medium + hard;
  if (total === 0) return <div className="stat-bar-track"><div className="stat-bar-fill" style={{ width: '0%' }} /></div>;
  return (
    <div className="stat-bar-track score-bar">
      <div className="stat-bar-segment" style={{ width: `${(easy / total) * 100}%`, background: '#10b981' }} />
      <div className="stat-bar-segment" style={{ width: `${(medium / total) * 100}%`, background: '#f59e0b' }} />
      <div className="stat-bar-segment" style={{ width: `${(hard / total) * 100}%`, background: '#ef4444' }} />
    </div>
  );
}

function RankItem({ name, score, rank, maxScore, tooltip }: {
  name: string; score: number; rank: number; maxScore: number; tooltip?: string;
}) {
  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
  const color = score >= 2.3 ? '#10b981' : score >= 1.5 ? '#f59e0b' : '#ef4444';
  const item = (
    <div className="rank-item">
      <span className="rank-medal">{medal}</span>
      <span className="rank-name">{name}</span>
      <div className="rank-bar-wrap">
        <div className="rank-bar" style={{ width: `${maxScore > 0 ? (score / maxScore) * 100 : 0}%`, background: color }} />
      </div>
      <span className="rank-score" style={{ color }}>{score.toFixed(1)}</span>
    </div>
  );
  return tooltip ? <TooltipWrap tooltip={tooltip}>{item}</TooltipWrap> : item;
}

// ─── Sortable Table Hook ──────────────────────────────────────────────────────

function useSortableData<T>(items: T[], defaultKey: string, defaultDir: SortDir = 'desc') {
  const [sortKey, setSortKey] = useState(defaultKey);
  const [sortDir, setSortDir] = useState<SortDir>(defaultDir);

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey] as string | number;
      const bVal = (b as Record<string, unknown>)[sortKey] as string | number;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      const numA = Number(aVal) || 0;
      const numB = Number(bVal) || 0;
      return sortDir === 'asc' ? numA - numB : numB - numA;
    });
  }, [items, sortKey, sortDir]);

  const requestSort = (key: string) => {
    if (key === sortKey) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
  };

  return { sorted, sortKey, sortDir, requestSort };
}

// ─── Main Statistics Page ─────────────────────────────────────────────────────

type StatsTab = 'general' | 'subject' | 'chapter' | 'disease';

export default function StatisticsPage() {
  const { t } = useLanguage();
  const { subjects } = useSubjects();
  const { diseases } = useDiseases();

  const [activeTab, setActiveTab] = useState<StatsTab>('general');
  const [cardScores, setCardScores] = useState<Record<string, { count: number; average: number }>>({});
  const [hardKeywords, setHardKeywords] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const scores = localStorage.getItem('medstudy-card-scores');
      if (scores) setCardScores(JSON.parse(scores));
      const hk = localStorage.getItem('medstudy-hard-keywords');
      if (hk) setHardKeywords(new Set(JSON.parse(hk)));
    } catch { /* ignore */ }
  }, []);

  // ─── Computed Stats ─────────────────────────────────────────────────────────

  const totalSubjects = subjects.length;
  const totalChapters = subjects.reduce((sum, s) => sum + s.chapters.length, 0);
  const totalDiseases = diseases.length;
  const totalKeywords = diseases.reduce((sum, d) => sum + d.keywords.length, 0);
  const avgKeywords = totalDiseases > 0 ? (totalKeywords / totalDiseases) : 0;

  const scoreEntries = Object.values(cardScores);
  const totalReviewed = scoreEntries.reduce((sum, s) => sum + s.count, 0);
  const avgScoreOverall = scoreEntries.length > 0
    ? scoreEntries.reduce((sum, s) => sum + s.average, 0) / scoreEntries.length
    : 0;

  const hardCount = scoreEntries.filter(s => s.average <= 1.5).length;
  const mediumCount = scoreEntries.filter(s => s.average > 1.5 && s.average < 2.3).length;
  const easyCount = scoreEntries.filter(s => s.average >= 2.3).length;

  const [quizzesCompleted, setQuizzesCompleted] = useState(0);
  useEffect(() => {
    try {
      const q = localStorage.getItem('medstudy-quizzes-completed');
      if (q) setQuizzesCompleted(Number(q));
    } catch { /* ignore */ }
  }, []);

  // ─── Per-Entity Stats ───────────────────────────────────────────────────────

  const subjectStats = useMemo(() => {
    return subjects.map(subject => {
      const subjectDiseases = diseases.filter(d => d.subjectId === subject.id);
      const keywordCount = subjectDiseases.reduce((sum, d) => sum + d.keywords.length, 0);
      const scores = subjectDiseases.map(d => cardScores[d.id]).filter(Boolean);
      const avgScore = scores.length > 0 ? scores.reduce((sum, s) => sum + s.average, 0) / scores.length : 0;
      const reviewed = scores.reduce((sum, s) => sum + s.count, 0);
      return { id: subject.id, name: subject.name, chapters: subject.chapters.length, diseases: subjectDiseases.length, keywords: keywordCount, avgScore, reviewed };
    });
  }, [subjects, diseases, cardScores]);

  const chapterStats = useMemo(() => {
    const stats: { id: string; name: string; subjectName: string; diseases: number; keywords: number; avgScore: number; reviewed: number }[] = [];
    subjects.forEach(subject => {
      subject.chapters.forEach(chapter => {
        const chapterDiseases = diseases.filter(d => d.chapterId === chapter.id);
        const keywordCount = chapterDiseases.reduce((sum, d) => sum + d.keywords.length, 0);
        const scores = chapterDiseases.map(d => cardScores[d.id]).filter(Boolean);
        const avgScore = scores.length > 0 ? scores.reduce((sum, s) => sum + s.average, 0) / scores.length : 0;
        const reviewed = scores.reduce((sum, s) => sum + s.count, 0);
        stats.push({ id: chapter.id, name: chapter.name, subjectName: subject.name, diseases: chapterDiseases.length, keywords: keywordCount, avgScore, reviewed });
      });
    });
    return stats;
  }, [subjects, diseases, cardScores]);

  const diseaseStats = useMemo(() => {
    return diseases.map(disease => {
      const subject = subjects.find(s => s.id === disease.subjectId);
      const chapter = subject?.chapters.find(c => c.id === disease.chapterId);
      const score = cardScores[disease.id];
      const hardKwCount = disease.keywords.filter(kw => hardKeywords.has(kw)).length;
      return {
        id: disease.id, name: disease.name, subjectName: subject?.name || '?', chapterName: chapter?.name || '?',
        keywords: disease.keywords.length, hardKeywords: hardKwCount, avgScore: score?.average || 0, reviewed: score?.count || 0,
        path: `${subject?.name || '?'} › ${chapter?.name || '?'}`,
      };
    });
  }, [diseases, subjects, cardScores, hardKeywords]);

  // ─── Top/Low Scorers (all scored) ──────────────────────────────────────────

  const scoredDiseases = diseaseStats.filter(d => d.reviewed > 0);
  const topDiseases = [...scoredDiseases].sort((a, b) => b.avgScore - a.avgScore).slice(0, 3);
  const lowDiseases = [...scoredDiseases].sort((a, b) => a.avgScore - b.avgScore).slice(0, 3);
  const scoredSubjects = subjectStats.filter(s => s.reviewed > 0);
  const topSubjects = [...scoredSubjects].sort((a, b) => b.avgScore - a.avgScore).slice(0, 3);
  const lowSubjects = [...scoredSubjects].sort((a, b) => a.avgScore - b.avgScore).slice(0, 3);
  const scoredChapters = chapterStats.filter(c => c.reviewed > 0);
  const topChapters = [...scoredChapters].sort((a, b) => b.avgScore - a.avgScore).slice(0, 3);
  const lowChapters = [...scoredChapters].sort((a, b) => a.avgScore - b.avgScore).slice(0, 3);

  // ─── Sortable Data Hooks ────────────────────────────────────────────────────

  const { sorted: sortedSubjects, sortKey: subSort, sortDir: subDir, requestSort: subSortReq } = useSortableData(subjectStats, 'name', 'asc');
  const { sorted: sortedChapters, sortKey: chSort, sortDir: chDir, requestSort: chSortReq } = useSortableData(chapterStats, 'name', 'asc');
  const { sorted: sortedDiseases, sortKey: disSort, sortDir: disDir, requestSort: disSortReq } = useSortableData(diseaseStats, 'name', 'asc');

  const hasData = totalSubjects > 0 || totalDiseases > 0;

  if (!hasData) {
    return (
      <div className="page-container placeholder-page">
        <div className="placeholder-icon">📊</div>
        <h2 className="page-title">{t('statistics')}</h2>
        <p className="placeholder-desc">{t('noDataYet')}</p>
      </div>
    );
  }

  const tabs: { key: StatsTab; label: string; icon: string }[] = [
    { key: 'general', label: t('generalTab'), icon: '📊' },
    { key: 'subject', label: t('bySubjectTab'), icon: '📚' },
    { key: 'chapter', label: t('byChapterTab'), icon: '📖' },
    { key: 'disease', label: t('byDiseaseTab'), icon: '🦠' },
  ];

  const scoreColor = (s: number) => s >= 2.3 ? '#10b981' : s >= 1.5 ? '#f59e0b' : '#ef4444';

  // Reusable top/low rank section for separate cards
  const renderRankCards = (
    topItems: { id: string; name: string; avgScore: number; reviewed: number; [k: string]: string | number }[],
    lowItems: { id: string; name: string; avgScore: number; reviewed: number; [k: string]: string | number }[],
    icon: string,
    entityLabel: string,
    tooltipFn: (item: { id: string; name: string; avgScore: number; reviewed: number; [k: string]: string | number }) => string,
  ) => (
    <div className="stats-ranks-grid">
      {topItems.length > 0 && (
        <div className="card stats-section">
          <h3 className="section-title">{icon} {t('topScorers')} — {entityLabel}</h3>
          {topItems.map((item, i) => (
            <RankItem key={item.id} name={item.name} score={item.avgScore} rank={i + 1} maxScore={3}
              tooltip={tooltipFn(item)} />
          ))}
        </div>
      )}
      {lowItems.length > 0 && (
        <div className="card stats-section">
          <h3 className="section-title">{icon} {t('lowScorers')} — {entityLabel}</h3>
          {lowItems.map((item, i) => (
            <RankItem key={item.id} name={item.name} score={item.avgScore} rank={i + 1} maxScore={3}
              tooltip={tooltipFn(item)} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">📊 {t('statistics')}</h2>
      </div>

      {/* ─── Tab Navigation ────────────────────────────────────────────────────── */}
      <div className="stats-tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`stats-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span className="stats-tab-icon">{tab.icon}</span>
            <span className="stats-tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════════
          GENERAL TAB
         ════════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'general' && (
        <>
          <h3 className="section-title">{t('overview')}</h3>
          <div className="stats-overview-grid">
            <StatCard label={t('totalSubjects')} value={totalSubjects} icon="📚" color="#3b82f6"
              tooltip={t('tooltipTotalSubjects')} />
            <StatCard label={t('totalChapters')} value={totalChapters} icon="📖" color="#8b5cf6"
              tooltip={t('tooltipTotalChapters')} />
            <StatCard label={t('totalDiseaseCount')} value={totalDiseases} icon="🦠" color="#ef4444"
              tooltip={t('tooltipTotalDiseases')} />
            <StatCard label={t('avgKeywordsPerDisease')} value={avgKeywords.toFixed(1)} icon="🏷️" color="#f97316"
              tooltip={t('tooltipAverageKeywords')} />
            <StatCard label={t('totalKeywords')} value={totalKeywords} icon="🔑" color="#14b8a6"
              tooltip={t('tooltipTotalKeywords')} />
            <StatCard label={t('hardKeywordsCount')} value={hardKeywords.size} icon="🔴" color="#dc2626"
              tooltip={t('tooltipHardKeywords')} />
            <StatCard label={t('quizzesCompleted')} value={quizzesCompleted} icon="✅" color="#10b981"
              tooltip={t('tooltipQuizzesCompleted')} />
            <StatCard label={t('cardsReviewed')} value={totalReviewed} icon="🃏" color="#6366f1"
              tooltip={t('tooltipCardsReviewed')} />
            <StatCard label={t('avgScoreOverall')} value={scoreEntries.length > 0 ? avgScoreOverall.toFixed(1) : '—'} icon="⭐"
              color={scoreEntries.length > 0 ? scoreColor(avgScoreOverall) : '#6b7280'}
              tooltip={t('tooltipAverageScore')} />
          </div>

          {scoreEntries.length > 0 && (
            <div className="card stats-section">
              <h3 className="section-title">{t('scoreDistribution')}</h3>
              <div className="score-dist-row">
                <div className="score-dist-item">
                  <span className="score-dist-label" style={{ color: '#10b981' }}>😊 {t('easyLabel')}</span>
                  <span className="score-dist-value">{easyCount}</span>
                </div>
                <div className="score-dist-item">
                  <span className="score-dist-label" style={{ color: '#f59e0b' }}>🤔 {t('mediumLabel')}</span>
                  <span className="score-dist-value">{mediumCount}</span>
                </div>
                <div className="score-dist-item">
                  <span className="score-dist-label" style={{ color: '#ef4444' }}>😰 {t('hardLabel')}</span>
                  <span className="score-dist-value">{hardCount}</span>
                </div>
              </div>
              <ScoreBar easy={easyCount} medium={mediumCount} hard={hardCount} />
            </div>
          )}

          {/* Top/Low for all entities: subjects → chapters → diseases */}
          {renderRankCards(topSubjects, lowSubjects, '📚', t('subjects'),
            s => t('tooltipSubjectRank').replace('{{diseases}}', String(s.diseases)).replace('{{keywords}}', String(s.keywords)).replace('{{reviewed}}', String(s.reviewed)))}
          {renderRankCards(topChapters, lowChapters, '📖', t('chapters'),
            c => t('tooltipChapterRank').replace('{{subject}}', String(c.subjectName)).replace('{{diseases}}', String(c.diseases)).replace('{{keywords}}', String(c.keywords)).replace('{{reviewed}}', String(c.reviewed)))}
          {renderRankCards(topDiseases, lowDiseases, '🦠', t('diseasesLabel'),
            d => t('tooltipDiseaseRank').replace('{{path}}', String(d.path)).replace('{{reviewed}}', String(d.reviewed)).replace('{{score}}', Number(d.avgScore).toFixed(1)))}
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════════════
          BY SUBJECT TAB
         ════════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'subject' && (
        <>
          <div className="card stats-section">
            <h3 className="section-title">{t('perSubject')}</h3>
            {subjectStats.length === 0 && <p className="empty-hint">{t('noDataYet')}</p>}
            <div className="stats-table">
              <div className="stats-table-header stats-table-6">
                <SortHeader label={t('name')} sortKey="name" activeSort={subSort} dir={subDir} onSort={subSortReq} />
                <SortHeader label={t('chapters')} sortKey="chapters" activeSort={subSort} dir={subDir} onSort={subSortReq} />
                <SortHeader label={t('diseasesLabel')} sortKey="diseases" activeSort={subSort} dir={subDir} onSort={subSortReq} />
                <SortHeader label={t('keywordsCountLabel')} sortKey="keywords" activeSort={subSort} dir={subDir} onSort={subSortReq} />
                <SortHeader label={t('avgScore')} sortKey="avgScore" activeSort={subSort} dir={subDir} onSort={subSortReq} />
                <span>{t('score')}</span>
              </div>
              {sortedSubjects.map(s => (
                <TooltipWrap key={s.id} tooltip={t('tooltipSubjectStats').replace('{{name}}', s.name).replace('{{chapters}}', String(s.chapters)).replace('{{diseases}}', String(s.diseases)).replace('{{keywords}}', String(s.keywords)).replace('{{reviewed}}', String(s.reviewed))}>
                  <div className="stats-table-row stats-table-6">
                    <span className="stats-name">{s.name}</span>
                    <span>{s.chapters}</span>
                    <span>{s.diseases}</span>
                    <span>{s.keywords}</span>
                    <span style={{ color: s.avgScore > 0 ? scoreColor(s.avgScore) : 'var(--text-muted)' }}>
                      {s.avgScore > 0 ? s.avgScore.toFixed(1) : '—'}
                    </span>
                    <span className="stats-bar-cell">
                      <ProgressBar value={s.avgScore} max={3} color={scoreColor(s.avgScore)} />
                    </span>
                  </div>
                </TooltipWrap>
              ))}
            </div>
          </div>
          {renderRankCards(topSubjects, lowSubjects, '📚', t('subjects'),
            s => t('tooltipSubjectRank').replace('{{diseases}}', String(s.diseases)).replace('{{keywords}}', String(s.keywords)).replace('{{reviewed}}', String(s.reviewed)))}
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════════════
          BY CHAPTER TAB
         ════════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'chapter' && (
        <>
          <div className="card stats-section">
            <h3 className="section-title">{t('perChapter')}</h3>
            {chapterStats.length === 0 && <p className="empty-hint">{t('noDataYet')}</p>}
            <div className="stats-table">
              <div className="stats-table-header stats-table-6">
                <SortHeader label={t('name')} sortKey="name" activeSort={chSort} dir={chDir} onSort={chSortReq} />
                <SortHeader label={t('subject')} sortKey="subjectName" activeSort={chSort} dir={chDir} onSort={chSortReq} />
                <SortHeader label={t('diseasesLabel')} sortKey="diseases" activeSort={chSort} dir={chDir} onSort={chSortReq} />
                <SortHeader label={t('keywordsCountLabel')} sortKey="keywords" activeSort={chSort} dir={chDir} onSort={chSortReq} />
                <SortHeader label={t('avgScore')} sortKey="avgScore" activeSort={chSort} dir={chDir} onSort={chSortReq} />
                <span>{t('score')}</span>
              </div>
              {sortedChapters.map(c => (
                <TooltipWrap key={c.id} tooltip={t('tooltipChapterStats').replace('{{name}}', c.name).replace('{{subject}}', c.subjectName).replace('{{diseases}}', String(c.diseases)).replace('{{keywords}}', String(c.keywords)).replace('{{reviewed}}', String(c.reviewed))}>
                  <div className="stats-table-row stats-table-6">
                    <span className="stats-name">{c.name}</span>
                    <span className="stats-secondary">{c.subjectName}</span>
                    <span>{c.diseases}</span>
                    <span>{c.keywords}</span>
                    <span style={{ color: c.avgScore > 0 ? scoreColor(c.avgScore) : 'var(--text-muted)' }}>
                      {c.avgScore > 0 ? c.avgScore.toFixed(1) : '—'}
                    </span>
                    <span className="stats-bar-cell">
                      <ProgressBar value={c.avgScore} max={3} color={scoreColor(c.avgScore)} />
                    </span>
                  </div>
                </TooltipWrap>
              ))}
            </div>
          </div>
          {renderRankCards(topChapters, lowChapters, '📖', t('chapters'),
            c => t('tooltipChapterRank').replace('{{subject}}', String(c.subjectName)).replace('{{diseases}}', String(c.diseases)).replace('{{keywords}}', String(c.keywords)).replace('{{reviewed}}', String(c.reviewed)))}
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════════════
          BY DISEASE TAB
         ════════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'disease' && (
        <>
          <div className="card stats-section">
            <h3 className="section-title">{t('perDisease')}</h3>
            {diseaseStats.length === 0 && <p className="empty-hint">{t('noDataYet')}</p>}
            <div className="stats-table">
              <div className="stats-table-header stats-table-7">
                <SortHeader label={t('name')} sortKey="name" activeSort={disSort} dir={disDir} onSort={disSortReq} />
                <SortHeader label={t('subject')} sortKey="subjectName" activeSort={disSort} dir={disDir} onSort={disSortReq} />
                <SortHeader label={t('chapter')} sortKey="chapterName" activeSort={disSort} dir={disDir} onSort={disSortReq} />
                <SortHeader label={t('keywordsCountLabel')} sortKey="keywords" activeSort={disSort} dir={disDir} onSort={disSortReq} />
                <SortHeader label={t('hardKeywordsCount')} sortKey="hardKeywords" activeSort={disSort} dir={disDir} onSort={disSortReq} />
                <SortHeader label={t('avgScore')} sortKey="avgScore" activeSort={disSort} dir={disDir} onSort={disSortReq} />
                <span>{t('score')}</span>
              </div>
              {sortedDiseases.map(d => (
                <TooltipWrap key={d.id} tooltip={t('tooltipDiseaseStats').replace('{{name}}', d.name).replace('{{path}}', d.path).replace('{{keywords}}', String(d.keywords)).replace('{{hardKeywords}}', String(d.hardKeywords)).replace('{{reviewed}}', String(d.reviewed))}>
                  <div className="stats-table-row stats-table-7">
                    <span className="stats-name">{d.name}</span>
                    <span className="stats-secondary">{d.subjectName}</span>
                    <span className="stats-secondary">{d.chapterName}</span>
                    <span>{d.keywords}</span>
                    <span style={{ color: d.hardKeywords > 0 ? '#ef4444' : 'var(--text-muted)' }}>{d.hardKeywords}</span>
                    <span style={{ color: d.avgScore > 0 ? scoreColor(d.avgScore) : 'var(--text-muted)' }}>
                      {d.avgScore > 0 ? d.avgScore.toFixed(1) : '—'}
                    </span>
                    <span className="stats-bar-cell">
                      <ProgressBar value={d.avgScore} max={3} color={scoreColor(d.avgScore)} />
                    </span>
                  </div>
                </TooltipWrap>
              ))}
            </div>
          </div>
          {renderRankCards(topDiseases, lowDiseases, '🦠', t('diseasesLabel'),
            d => t('tooltipDiseaseStats').replace('{{name}}', String(d.name)).replace('{{path}}', String(d.path)).replace('{{keywords}}', String(d.keywords)).replace('{{hardKeywords}}', String(d.hardKeywords)).replace('{{reviewed}}', String(d.reviewed)))}
        </>
      )}
    </div>
  );
}
