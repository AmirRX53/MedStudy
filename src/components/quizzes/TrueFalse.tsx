import { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import type { QuizQuestion } from './quizUtils';
import { updateDiseaseScore } from './quizUtils';
import QuizResult from './QuizResult';

interface Props {
  questions: QuizQuestion[];
  onBack: () => void;
}

export default function TrueFalseQuiz({ questions, onBack }: Props) {
  const { t } = useLanguage();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});

  if (questions.length === 0) {
    return (
      <div className="quiz-empty">
        <p>{t('noQuestionsAvailable')}</p>
        <button className="btn btn-ghost" onClick={onBack}>{t('backToQuizTypes')}</button>
      </div>
    );
  }

  if (showResult) {
    const correct = Object.values(answers).filter(Boolean).length;
    return <QuizResult correct={correct} total={questions.length} onBack={onBack} />;
  }

  const q = questions[currentIdx];
  const isAnswered = selected !== null;
  const isCorrect = selected === q.isTrue;
  const progress = ((currentIdx + 1) / questions.length) * 100;

  const handleSelect = (value: boolean) => {
    if (isAnswered) return;
    setSelected(value);
    const correct = value === q.isTrue;
    setAnswers(prev => ({ ...prev, [q.id]: correct }));
    updateDiseaseScore(q.disease.id, correct);
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setSelected(null);
    } else {
      setShowResult(true);
    }
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

      <p className="quiz-question-text quiz-statement">{q.statement}</p>

      <div className="quiz-tf-options">
        <button
          className={`quiz-tf-btn true-btn ${isAnswered && q.isTrue ? 'correct' : ''} ${isAnswered && selected === true && !q.isTrue ? 'wrong' : ''}`}
          onClick={() => handleSelect(true)}
          disabled={isAnswered}
        >
          <span className="tf-icon">✓</span>
          <span>{t('true')}</span>
        </button>
        <button
          className={`quiz-tf-btn false-btn ${isAnswered && !q.isTrue ? 'correct' : ''} ${isAnswered && selected === false && q.isTrue ? 'wrong' : ''}`}
          onClick={() => handleSelect(false)}
          disabled={isAnswered}
        >
          <span className="tf-icon">✗</span>
          <span>{t('false')}</span>
        </button>
      </div>

      {isAnswered && (
        <div className="quiz-feedback-area">
          <div className={`quiz-feedback ${isCorrect ? 'correct' : 'wrong'}`}>
            {isCorrect ? t('correctAnswer') : t('wrongAnswer')}
          </div>
          <button className="btn btn-primary" onClick={handleNext}>
            {currentIdx < questions.length - 1 ? t('nextQuestion') : t('seeResults')}
          </button>
        </div>
      )}
    </div>
  );
}
