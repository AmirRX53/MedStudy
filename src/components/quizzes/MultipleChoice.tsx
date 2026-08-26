import { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import type { QuizQuestion } from './quizUtils';
import { updateDiseaseScore } from './quizUtils';
import QuizResult from './QuizResult';

interface Props {
  questions: QuizQuestion[];
  onBack: () => void;
}

export default function MultipleChoiceQuiz({ questions, onBack }: Props) {
  const { t } = useLanguage();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
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
  const isCorrect = selected === q.correctAnswer;
  const progress = ((currentIdx + 1) / questions.length) * 100;

  const handleSelect = (option: string) => {
    if (isAnswered) return;
    setSelected(option);
    const correct = option === q.correctAnswer;
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

      {/* Progress bar */}
      <div className="quiz-progress">
        <div className="quiz-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Disease info */}
      <div className="quiz-disease-info">
        <span className="quiz-disease-name">{q.disease.name}</span>
      </div>

      {/* Question */}
      <p className="quiz-question-text">{q.question}</p>

      {/* Options */}
      <div className="quiz-options">
        {q.options?.map((option, i) => {
          let cls = 'quiz-option';
          if (isAnswered) {
            if (option === q.correctAnswer) cls += ' correct';
            else if (option === selected) cls += ' wrong';
          }
          return (
            <button
              key={i}
              className={cls}
              onClick={() => handleSelect(option)}
              disabled={isAnswered}
            >
              <span className="quiz-option-letter">{String.fromCharCode(65 + i)}</span>
              <span className="quiz-option-text">{option}</span>
              {isAnswered && option === q.correctAnswer && <span className="quiz-option-check">✓</span>}
              {isAnswered && option === selected && option !== q.correctAnswer && <span className="quiz-option-cross">✗</span>}
            </button>
          );
        })}
      </div>

      {/* Feedback + Next */}
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
