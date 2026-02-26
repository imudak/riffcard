/**
 * ルーティングテスト: 5画面の遷移確認
 * REQ-RC-UX-001〜005, NFR-002
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom';
import { PhraseListPage } from './pages/PhraseListPage';
import { ReferenceRecordPage } from './pages/ReferenceRecordPage';
import { PhraseDetailPage } from './pages/PhraseDetailPage';
import { PracticeRecordPage } from './pages/PracticeRecordPage';
import { ScoreResultPage } from './pages/ScoreResultPage';

beforeEach(() => {
  indexedDB = new IDBFactory();
});

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
  it('/ → PhraseListPage (RiffCard ヘッダー表示)', async () => {
    renderWithRouter('/');
    await waitFor(() => {
      expect(screen.getByText('RiffCard')).toBeInTheDocument();
    });
  });

  it('/phrases/:id/reference → ReferenceRecordPage (お手本を録音 表示)', async () => {
    renderWithRouter('/phrases/abc/reference');
    await waitFor(() => {
      expect(screen.getByText('お手本を録音')).toBeInTheDocument();
    });
  });

  it('/phrases/:id → PhraseDetailPage (フレーズが見つかりません 表示)', async () => {
    renderWithRouter('/phrases/abc');
    await waitFor(() => {
      expect(screen.getByText('フレーズが見つかりません')).toBeInTheDocument();
    });
  });

  it('/phrases/:id/practice → PracticeRecordPage (フレーズに戻る BackButton 表示)', async () => {
    renderWithRouter('/phrases/abc/practice');
    await waitFor(() => {
      // UX-NAV-001: BackButton label 変更 (練習中 → フレーズに戻る)
      expect(screen.getByText('フレーズに戻る')).toBeInTheDocument();
    });
  });

  it('/phrases/:id/result/:takeId → ScoreResultPage (結果 表示)', async () => {
    renderWithRouter('/phrases/abc/result/take1');
    await waitFor(() => {
      expect(screen.getByText('結果が見つかりません')).toBeInTheDocument();
    });
  });
});
