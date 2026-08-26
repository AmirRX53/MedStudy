import { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import type { QuizQuestion } from './quizUtils';
import { updateDiseaseScore } from './quizUtils';
import QuizResult from './QuizResult';

interface Props {
  questions: QuizQuestion[];
  onBack: () => void;
}

export default function MatchKeywordsQuiz({ questions, onBack }: Props) {
  const { t } = useLanguage();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  if (questions.length === 0) {
    return (
      <div className="quiz-empty">
        <p>{t('noQuestionsAvailable')}</p>
        <button className="btn btn-ghost" onClick={onBack}>{t('backToQuizTypes')}</button>
      </div>
    );
  }

  if (showResult) {
    const totalCorrect = Object.values(answers).reduce((sum, v) => sum + v, 0);
    const totalPairs = questions.reduce((sum, q) => sum + (q.matchPairs?.length ?? 0), 0);
    return <QuizResult correct={totalCorrect} total={totalPairs} onBack={onBack} />;
  }

  const q = questions[currentIdx];
  const pairs = q.matchPairs ?? [];
  const diseases = q.matchDiseases ?? [];
  const options = q.matchOptions ?? [];

  const matchedKeywords = Object.keys(matches);
  const isComplete = matchedKeywords.length === pairs.length;
  const progress = ((currentIdx + 1) / questions.length) * 100;

  const handleKeywordClick = (keyword: string) => {
    setSelectedKeyword(keyword);
  };

  const handleDiseaseClick = (diseaseId: string) => {
    if (!selectedKeyword) return;
    // Remove any existing match for this disease or keyword
    const newMatches = { ...matches };
    // Remove if this disease already has a different keyword mapped
    Object.entries(newMatches).forEach(([k, v]) => {
      if (v === diseaseId && k !== selectedKeyword) {
        delete newMatches[k];
      }
    });
    newMatches[selectedKeyword] = diseaseId;
    setMatches(newMatches);
    setSelectedKeyword(null);
  };

  const handleSubmit = () => {
    let correct = 0;
    pairs.forEach(pair => {
      const pairCorrect = matches[pair.keyword] === pair.diseaseId;
      if (pairCorrect) correct++;
      // Score each disease in the match group
      updateDiseaseScore(pair.diseaseId, pairCorrect);
    });
    setAnswers(prev => ({ ...prev, [q.id]: correct }));

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setMatches({});
      setSelectedKeyword(null);
    } else {
      setShowResult(true);
    }
  };

  const getMatchedDiseaseName = (keyword: string) => {
    const diseaseId = matches[keyword];
    if (!diseaseId) return null;
    return diseases.find(d => d.id === diseaseId)?.name ?? diseaseId;
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

      <p className="quiz-question-text">{t('matchInstruction')}</p>

      {/* Keywords column */}
      <div className="match-keywords-section">
        <h4 className="match-col-title">{t('keywords')}</h4>
        <div className="match-keywords-grid">
          {options.map(keyword => {
            const isMatched = matchedKeywords.includes(keyword);
            const isSelected = selectedKeyword === keyword;
            const matchedDisease = isMatched ? getMatchedDiseaseName(keyword) : null;

            return (
              <button
                key={keyword}
                className={`match-keyword-btn ${isSelected ? 'selected' : ''} ${isMatched ? 'matched' : ''}`}
                onClick={() => !isMatched && handleKeywordClick(keyword)}
                disabled={isMatched}
              >
                <span className="match-kw-text">{keyword}</span>
                {matchedDisease && (
                  <span className="match-kw-arrow">→ {matchedDisease}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Diseases column */}
      <div className="match-diseases-section">
        <h4 className="match-col-title">{t('diseases')}</h4>
        <div className="match-diseases-grid">
          {diseases.map(disease => {
            const matchedKeyword = Object.entries(matches).find(([_, v]) => v === disease.id)?.[0];
            const isTarget = selectedKeyword !== null;

            return (
              <button
                key={disease.id}
                className={`match-disease-btn ${isTarget ? 'selectable' : ''} ${matchedKeyword ? 'matched' : ''}`}
                onClick={() => handleDiseaseClick(disease.id)}
                disabled={!selectedKeyword}
              >
                <span className="match-disease-name">{disease.name}</span>
                {matchedKeyword && (
                  <span className="match-disease-arrow">← {matchedKeyword}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit when all matched */}
      {isComplete && (
        <div className="quiz-feedback-area">
          <button className="btn btn-primary" onClick={handleSubmit}>
            {currentIdx < questions.length - 1 ? t('nextGroup') : t('seeResults')}
          </button>
        </div>
      )}
    </div>
  );
}
