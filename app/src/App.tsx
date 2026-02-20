import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PhraseListPage } from './pages/PhraseListPage';
import { ReferenceRecordPage } from './pages/ReferenceRecordPage';
import { PhraseDetailPage } from './pages/PhraseDetailPage';
import { PracticeRecordPage } from './pages/PracticeRecordPage';
import { ScoreResultPage } from './pages/ScoreResultPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PhraseListPage />} />
        <Route path="/phrases/:id/reference" element={<ReferenceRecordPage />} />
        <Route path="/phrases/:id" element={<PhraseDetailPage />} />
        <Route path="/phrases/:id/practice" element={<PracticeRecordPage />} />
        <Route path="/phrases/:id/result/:takeId" element={<ScoreResultPage />} />
      </Routes>
    </BrowserRouter>
  );
}
