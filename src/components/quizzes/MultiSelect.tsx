import { useState } from 'react';
import type { QuizQuestion } from './quizUtils';
import { updateDiseaseScoreFractional } from './quizUtils';
import { useLanguage } from '../../contexts/LanguageContext';
import QuizResult from './QuizResult';

interface Props {
  questions: QuizQuestion[];
  onBack: () => void;
}

export default function MultiSelectQuiz({ questions, onBack }: Props) {
  const { t } = useLanguage();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [scores, setScores] = useState<number[]>([]);

  if (questions.length === 0) {
    return (
      <div className="quiz-empty">
        <p>{t('noQuestionsAvailable')}</p>
        <button className="btn btn-ghost" onClick={onBack}>{t('backToQuizTypes')}</button>
      </div>
    );
  }

  // Result screen — show when we've gone past the last question
  if (submitted && currentIdx >= questions.length) {
    const totalScore = scores.reduce((a, b) => a + b, 0);
    const maxScore = questions.length;
    return (
      <div className="quiz-view">
        <QuizResult
          correct={Math.round(totalScore * 10) / 10}
          total={maxScore}
          onBack={onBack}
        />
      </div>
    );
  }

  const q = questions[currentIdx];
  const correctSet = new Set(q.multiSelectCorrect || []);
  const requiredCount = q.multiSelectCount || 0;
  const progress = ((currentIdx + 1) / questions.length) * 100;

  const toggleOption = (option: string) => {
    if (submitted) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(option)) {
        next.delete(option);
      } else if (next.size < requiredCount) {
        next.add(option);
      }
      return next;
    });
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  // Calculate current question's score (used during submitted state and when moving on)
  let currentCorrectSelected = 0;
  selected.forEach(kw => { if (correctSet.has(kw)) currentCorrectSelected++; });
  const currentScore = requiredCount > 0 ? currentCorrectSelected / requiredCount : 0;

  const handleNext = () => {
    // Save this question's score
    setScores(prev => [...prev, currentScore]);
    // Update disease score with fractional points
    updateDiseaseScoreFractional(q.disease.id, currentScore);

    if (currentIdx < questions.length - 1) {
      // Move to next question
      setCurrentIdx(prev => prev + 1);
      setSelected(new Set());
      setSubmitted(false);
    } else {
      // Last question — go to results
      setCurrentIdx(prev => prev + 1);
      setSubmitted(true);
    }
  };

  const isOptionCorrect = (option: string) => correctSet.has(option);
  const isOptionSelected = (option: string) => selected.has(option);

  const getOptionClass = (option: string) => {
    let cls = 'quiz-option multi-select-option';
    if (submitted) {
      if (isOptionCorrect(option) && isOptionSelected(option)) cls += ' correct selected';
      else if (isOptionCorrect(option) && !isOptionSelected(option)) cls += ' correct missed';
      else if (!isOptionCorrect(option) && isOptionSelected(option)) cls += ' wrong selected';
    } else {
      if (isOptionSelected(option)) cls += ' selected';
    }
    return cls;
  };

  return (
    <div className="quiz-view">
      <div className="quiz-top-bar">
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← {t('backToQuizTypes')}</button>
        <span className="quiz-counter">{currentIdx + 1} / {questions.length}</span>
      </div>

      <div className="quiz-progress">
        <div className="quiz-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="quiz-disease-info">
        <span className="quiz-disease-name">{q.disease.name}</span>
      </div>

      <p className="quiz-question-text">{q.multiSelectQuestion}</p>

      {/* Hint (before submit) or Feedback (after submit) — same position */}
      {!submitted && (
        <div className="multi-select-hint">
          {t('selectAnswersHint').replace('{{count}}', String(requiredCount)).replace('{{total}}', String((q.options?.length || 0)))}
        </div>
      )}

      {submitted && (
        <div className={`quiz-feedback ${currentScore === 1 ? 'correct' : currentScore >= 0.5 ? 'partial' : 'wrong'}`}>
          {currentScore === 1
            ? t('correctAnswer')
            : currentScore >= 0.5
              ? t('partialCorrect').replace('{{score}}', `${currentCorrectSelected}/${requiredCount}`)
              : t('wrongAnswer')
          }
        </div>
      )}

      {/* Selected counter (only before submit) */}
      {!submitted && (
        <div className="multi-select-counter">
          <span className={selected.size === requiredCount ? 'counter-matching' : ''}>
            {selected.size} / {requiredCount}
          </span>
          {t('selected')}
        </div>
      )}

      {/* Options grid */}
      <div className="multi-select-grid">
        {q.options?.map((option, i) => (
          <button
            key={i}
            className={getOptionClass(option)}
            onClick={() => toggleOption(option)}
            disabled={submitted}
          >
            <span className="quiz-option-check">
              {submitted ? (
                isOptionCorrect(option) ? '✓' : isOptionSelected(option) ? '✗' : ''
              ) : (
                isOptionSelected(option) ? '✓' : ''
              )}
            </span>
            <span className="quiz-option-text">{option}</span>
          </button>
        ))}
      </div>

      {/* Submit or Next */}
      <div className="quiz-feedback-area">
        {!submitted && selected.size > 0 && (
          <button className="btn btn-primary" onClick={handleSubmit}>
            {t('confirmAnswer')}
          </button>
        )}

        {submitted && (
          <button className="btn btn-primary" onClick={handleNext}>
            {currentIdx < questions.length - 1 ? t('nextQuestion') : t('seeResults')}
          </button>
        )}
      </div>
    </div>
  );
}
