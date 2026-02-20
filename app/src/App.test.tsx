import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom';
import { PhraseListPage } from './pages/PhraseListPage';
import { ReferenceRecordPage } from './pages/ReferenceRecordPage';
import { PhraseDetailPage } from './pages/PhraseDetailPage';
import { PracticeRecordPage } from './pages/PracticeRecordPage';
import { ScoreResultPage } from './pages/ScoreResultPage';

function renderWithRouter(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/" element={<PhraseListPage />} />
        <Route path="/phrases/:id/reference" element={<ReferenceRecordPage />} />
        <Route path="/phrases/:id" element={<PhraseDetailPage />} />
        <Route path="/phrases/:id/practice" element={<PracticeRecordPage />} />
        <Route path="/phrases/:id/result/:takeId" element={<ScoreResultPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ルーティング', () => {
  it('/ → PhraseListPage', () => {
    renderWithRouter('/');
    expect(screen.getByText('PhraseListPage')).toBeInTheDocument();
  });

  it('/phrases/:id/reference → ReferenceRecordPage', () => {
    renderWithRouter('/phrases/abc/reference');
    expect(screen.getByText('ReferenceRecordPage')).toBeInTheDocument();
  });

  it('/phrases/:id → PhraseDetailPage', () => {
    renderWithRouter('/phrases/abc');
    expect(screen.getByText('PhraseDetailPage')).toBeInTheDocument();
  });

  it('/phrases/:id/practice → PracticeRecordPage', () => {
    renderWithRouter('/phrases/abc/practice');
    expect(screen.getByText('PracticeRecordPage')).toBeInTheDocument();
  });

  it('/phrases/:id/result/:takeId → ScoreResultPage', () => {
    renderWithRouter('/phrases/abc/result/take1');
    expect(screen.getByText('ScoreResultPage')).toBeInTheDocument();
  });
});
