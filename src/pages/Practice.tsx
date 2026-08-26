import { useState, useMemo, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSubjects } from '../contexts/SubjectsContext';
import { useDiseases } from '../contexts/DiseasesContext';
import type { Difficulty, QuizQuestion } from '../components/quizzes/quizUtils';
import { filterByDifficulty, loadCardScores, generateMultipleChoice, generateTrueFalse, generateFillBlank, generateMatchKeywords, generateMultiSelect } from '../components/quizzes/quizUtils';
import MultipleChoiceQuiz from '../components/quizzes/MultipleChoice';
import TrueFalseQuiz from '../components/quizzes/TrueFalse';
import FillBlankQuiz from '../components/quizzes/FillBlank';
import MatchKeywordsQuiz from '../components/quizzes/MatchKeywords';
import MultiSelectQuiz from '../components/quizzes/MultiSelect';

interface Subset {
  id: string;
  subjectId: string | null;
  chapterId: string | null;
  subjectName: string;
  chapterName: string;
}

type QuizType = 'multipleChoice' | 'trueFalse' | 'fillBlank' | 'matchKeywords' | 'multiSelect' | null;

export default function PracticePage() {
  const { t, language } = useLanguage();
  const { subjects } = useSubjects();
  const { diseases } = useDiseases();

  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedChapter, setSelectedChapter] = useState('all');
  const [subsets, setSubsets] = useState<Subset[]>([]);
  const [questionCount, setQuestionCount] = useState(1);
  const [difficulty, setDifficulty] = useState<Difficulty>('random');
  const [activeQuiz, setActiveQuiz] = useState<QuizType>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);

  const availableChapters = useMemo(() => {
    if (!selectedSubject) return [];
    const s = subjects.find(s => s.id === selectedSubject);
    return s?.chapters || [];
  }, [selectedSubject, subjects]);

  const previewCount = useMemo(() => {
    if (selectedSubject === 'all') return diseases.length;
    if (!selectedSubject) return 0;
    return diseases.filter(d => {
      if (selectedSubject === 'all' || d.subjectId === selectedSubject) {
        if (selectedChapter === 'all' || !selectedChapter || d.chapterId === selectedChapter) return true;
      }
      return false;
    }).length;
  }, [selectedSubject, selectedChapter, diseases]);

  const totalAvailable = useMemo(() => {
    if (subsets.length === 0) return 0;
    const diseaseIds = new Set<string>();
    subsets.forEach(sub => {
      diseases.forEach(d => {
        if (sub.subjectId && d.subjectId !== sub.subjectId) return;
        if (sub.chapterId && d.chapterId !== sub.chapterId) return;
        diseaseIds.add(d.id);
      });
    });
    return diseaseIds.size;
  }, [subsets, diseases]);

  const maxQuestions = totalAvailable;

  // Diseases filtered by difficulty for quiz generation
  const selectedDiseases = useMemo(() => {
    if (subsets.length === 0) return [];
    const diseaseIds = new Set<string>();
    subsets.forEach(sub => {
      diseases.forEach(d => {
        if (sub.subjectId && d.subjectId !== sub.subjectId) return;
        if (sub.chapterId && d.chapterId !== sub.chapterId) return;
        diseaseIds.add(d.id);
      });
    });
    return diseases.filter(d => diseaseIds.has(d.id) && d.keywords.length > 0);
  }, [subsets, diseases]);

  // Multi-select uses the selected diseases as its question scope, but its
  // choices are sampled independently from the complete keyword pool within
  // that scope. Other quiz types continue using the balanced question pool.
  const quizDiseases = useMemo(() => {
    const scores = loadCardScores();
    return filterByDifficulty(selectedDiseases, difficulty, scores, questionCount);
  }, [selectedDiseases, difficulty, questionCount]);

  const addSubset = useCallback(() => {
    if (!selectedSubject) return;
    const subjectId = selectedSubject === 'all' ? null : selectedSubject;
    const chapterId = selectedChapter === 'all' ? null : selectedChapter;
    const subjectName = subjectId
      ? subjects.find(s => s.id === subjectId)?.name || '?'
      : t('selectSubjectAll');
    const chapterName = chapterId
      ? availableChapters.find(c => c.id === chapterId)?.name || '?'
      : t('selectChapterAll');

    const exists = subsets.some(s => s.subjectId === subjectId && s.chapterId === chapterId);
    if (exists) return;

    setSubsets(prev => [...prev, {
      id: `${subjectId || 'all'}-${chapterId || 'all'}-${Date.now()}`,
      subjectId, chapterId, subjectName, chapterName,
    }]);
    setSelectedSubject('all');
    setSelectedChapter('all');
  }, [selectedSubject, selectedChapter, subjects, availableChapters, subsets, t]);

  const removeSubset = (id: string) => {
    setSubsets(prev => prev.filter(s => s.id !== id));
  };

  const clearAll = () => {
    setSubsets([]);
    setSelectedSubject('all');
    setSelectedChapter('all');
    setQuestionCount(1);
  };

  const handleStartQuiz = (type: QuizType) => {
    const questionCountForQuiz = Math.min(questionCount, quizDiseases.length);
    const questions = type === 'multiSelect'
      ? generateMultiSelect(selectedDiseases, questionCountForQuiz, subjects, language)
      : type === 'multipleChoice'
        ? generateMultipleChoice(quizDiseases, questionCountForQuiz, subjects, language, selectedDiseases)
        : type === 'trueFalse'
          ? generateTrueFalse(quizDiseases, questionCountForQuiz, subjects, language, selectedDiseases)
          : type === 'fillBlank'
            ? generateFillBlank(quizDiseases, questionCountForQuiz, subjects, language, selectedDiseases)
            : type === 'matchKeywords'
              ? generateMatchKeywords(quizDiseases, questionCountForQuiz, subjects)
              : [];
    setQuizQuestions(questions);
    setActiveQuiz(type);
  };

  const handleBackToQuizzes = () => {
    setActiveQuiz(null);
    setQuizQuestions([]);
  };

  // ─── Quiz View ──────────────────────────────────────────────────────────────

  if (activeQuiz) {
    switch (activeQuiz) {
      case 'multipleChoice':
        return <MultipleChoiceQuiz questions={quizQuestions} onBack={handleBackToQuizzes} />;
      case 'trueFalse':
        return <TrueFalseQuiz questions={quizQuestions} onBack={handleBackToQuizzes} />;
      case 'fillBlank':
        return <FillBlankQuiz questions={quizQuestions} onBack={handleBackToQuizzes} />;
      case 'matchKeywords':
        return <MatchKeywordsQuiz questions={quizQuestions} onBack={handleBackToQuizzes} />;
      case 'multiSelect':
        return <MultiSelectQuiz questions={quizQuestions} onBack={handleBackToQuizzes} />;
    }
  }

  // ─── Quiz Type Selection ────────────────────────────────────────────────────

  const quizTypes = [
    { key: 'multipleChoice' as const, icon: '🔘', color: '#3b82f6' },
    { key: 'trueFalse' as const, icon: '✅', color: '#10b981' },
    { key: 'fillBlank' as const, icon: '📝', color: '#f97316' },
    { key: 'matchKeywords' as const, icon: '🔗', color: '#8b5cf6' },
    { key: 'multiSelect' as const, icon: '☑️', color: '#ec4899' },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">🎯 {t('practice')}</h2>
      </div>

      {/* ─── Subset Selector ──────────────────────────────────────────────────── */}
      <div className="card practice-selector">
        <div className="practice-selector-row">
          <select
            className="filter-select"
            value={selectedSubject}
            onChange={e => { setSelectedSubject(e.target.value); setSelectedChapter(''); }}
          >
            <option value="all">{t('selectSubjectAll')}</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <select
            className="filter-select"
            value={selectedChapter}
            onChange={e => setSelectedChapter(e.target.value)}
            disabled={!selectedSubject || selectedSubject === 'all'}
          >
            <option value="all">{t('selectChapterAll')}</option>
            {availableChapters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <button className="btn btn-primary btn-sm" onClick={addSubset} disabled={!selectedSubject}>
            + {t('addSubset')}
          </button>

          {subsets.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={clearAll}>
              {t('clearAll')}
            </button>
          )}
        </div>

        {selectedSubject && previewCount > 0 && (
          <div className="practice-preview">
            {t('totalDiseases').replace('{{count}}', String(previewCount))}
          </div>
        )}

        {subsets.length > 0 && (
          <div className="practice-subsets">
            {subsets.map(sub => (
              <span key={sub.id} className="practice-subset-tag">
                <span className="subset-address">
                  {sub.subjectName}
                  {sub.chapterId && <><span className="path-sep">›</span>{sub.chapterName}</>}
                </span>
                <button className="chip-remove" onClick={() => removeSubset(sub.id)}>×</button>
              </span>
            ))}
          </div>
        )}

        {subsets.length === 0 && (
          <p className="empty-hint">{t('noSubsets')}</p>
        )}
      </div>

      {/* ─── Question Count Slider ────────────────────────────────────────────── */}
      <div className="card practice-slider">
        <div className="slider-header">
          <label className="form-label">{t('questionCount')}</label>
          <span className="slider-value">{questionCount} / {maxQuestions || 1}</span>
        </div>
        <input
          type="range"
          className="practice-range"
          min={1}
          max={maxQuestions || 1}
          value={Math.min(questionCount, maxQuestions || 1)}
          onChange={e => setQuestionCount(Number(e.target.value))}
          disabled={maxQuestions === 0}
          style={{ '--progress': `${((questionCount - 1) / (maxQuestions - 1 || 1)) * 100}%` } as React.CSSProperties}
        />
      </div>

      {/* ─── Difficulty Selector ──────────────────────────────────────────────── */}
      <div className="card practice-difficulty">
        <label className="form-label">{t('difficulty')}</label>
        <p className="practice-difficulty-hint">{t('balancedDifficultyHint')}</p>
        <div className="difficulty-options">
          {([
            { key: 'random' as const, icon: '🎲', color: '#6b7280' },
            { key: 'easy' as const, icon: '😊', color: '#10b981' },
            { key: 'medium' as const, icon: '🤔', color: '#f59e0b' },
            { key: 'hard' as const, icon: '😰', color: '#ef4444' },
          ]).map(opt => (
            <button
              key={opt.key}
              className={`difficulty-btn ${difficulty === opt.key ? 'active' : ''}`}
              onClick={() => setDifficulty(opt.key)}
              style={difficulty === opt.key ? { borderColor: opt.color, color: opt.color, background: `${opt.color}15` } : undefined}
            >
              <span className="difficulty-icon">{opt.icon}</span>
              <span className="difficulty-label">{t(opt.key)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Quiz Types ──────────────────────────────────────────────────────── */}
      <div className="practice-quiz-section">
        <h3 className="section-title">{t('quizTypes')}</h3>
        <div className="practice-quiz-grid">
          {quizTypes.map(qt => (
            <div key={qt.key} className="practice-quiz-card" style={{ borderTopColor: qt.color }}>
              <div className="quiz-card-icon" style={{ color: qt.color }}>{qt.icon}</div>
              <h4 className="quiz-card-title">{t(qt.key as any)}</h4>
              <p className="quiz-card-desc">{t(`${qt.key}Desc` as any)}</p>
              <button
                className="btn btn-primary btn-sm quiz-card-btn"
                disabled={totalAvailable === 0}
                style={{ background: qt.color }}
                onClick={() => handleStartQuiz(qt.key)}
              >
                {t('startQuiz')}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
