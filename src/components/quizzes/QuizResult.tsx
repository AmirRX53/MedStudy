import { useEffect, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { incrementQuizzesCompleted } from './quizUtils';

interface QuizResultProps {
  correct: number;
  total: number;
  onBack: () => void;
}

export default function QuizResult({ correct, total, onBack }: QuizResultProps) {
  const { t } = useLanguage();
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const counted = useRef(false);

  useEffect(() => {
    if (!counted.current) {
      counted.current = true;
      incrementQuizzesCompleted();
    }
  }, []);

  let emoji: string;
  let color: string;
  let message: string;

  if (pct >= 90) {
    emoji = '🏆';
    color = '#10b981';
    message = t('excellentWork');
  } else if (pct >= 70) {
    emoji = '👏';
    color = '#3b82f6';
    message = t('goodJob');
  } else if (pct >= 50) {
    emoji = '💪';
    color = '#f59e0b';
    message = t('keepTrying');
  } else {
    emoji = '📚';
    color = '#ef4444';
    message = t('needsReview');
  }

  return (
    <div className="quiz-result">
      <div className="quiz-result-icon">{emoji}</div>
      <h2 className="quiz-result-title" style={{ color }}>{t('quizComplete')}</h2>
      <p className="quiz-result-message">{message}</p>

      <div className="quiz-result-score-ring">
        <svg viewBox="0 0 120 120" className="quiz-result-ring">
          <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border)" strokeWidth="8" />
          <circle
            cx="60" cy="60" r="52"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * 327} 327`}
            transform="rotate(-90 60 60)"
            className="quiz-result-ring-fill"
          />
        </svg>
        <div className="quiz-result-pct">
          <span className="quiz-result-pct-num" style={{ color }}>{pct}%</span>
        </div>
      </div>

      <div className="quiz-result-details">
        <span className="quiz-result-detail correct">{t('correct')}: {Number(correct.toFixed(1))}</span>
        <span className="quiz-result-detail wrong">{t('incorrect')}: {Number((total - correct).toFixed(1))}</span>
        <span className="quiz-result-detail total">{t('total')}: {total}</span>
      </div>

      <button className="btn btn-primary" onClick={onBack}>
        {t('backToQuizTypes')}
      </button>
    </div>
  );
}
