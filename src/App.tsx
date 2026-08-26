import { HashRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import BackToTop from './components/BackToTop';
import HomePage from './pages/Home';
import SubjectsPage from './pages/Subjects';
import DiseasesPage from './pages/Diseases';
import FlashcardsPage from './pages/Flashcards';
import PracticePage from './pages/Practice';
import StatisticsPage from './pages/Statistics';

function App() {
  return (
    <HashRouter>
      <div className="app-shell">
        <Header />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/subjects" element={<SubjectsPage />} />
            <Route path="/diseases" element={<DiseasesPage />} />
            <Route path="/flashcards" element={<FlashcardsPage />} />
            <Route path="/practice" element={<PracticePage />} />
            <Route path="/statistics" element={<StatisticsPage />} />
          </Routes>
        </main>
        <BackToTop />
      </div>
    </HashRouter>
  );
}

export default App;
