import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { openDB, PhraseRepository } from '@lib/db';
import { PhraseListPage } from './PhraseListPage';

beforeEach(() => {
  indexedDB = new IDBFactory();
});

function renderPage() {
  return render(
    <MemoryRouter>
      <PhraseListPage />
    </MemoryRouter>,
  );
}

describe('PhraseListPage', () => {
  it('空状態でEmptyStateが表示される', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('練習したいフレーズを録音しましょう')).toBeInTheDocument();
    });
    expect(screen.getByText('最初のフレーズを録音')).toBeInTheDocument();
  });

  it('フレーズがある場合はカードが表示される', async () => {
    const db = await openDB();
    const repo = new PhraseRepository(db);
    await repo.create();

    renderPage();
    await waitFor(() => {
      expect(screen.getByText('フレーズ1')).toBeInTheDocument();
    });
  });

  it('ヘッダーにRiffCardが表示される', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('RiffCard')).toBeInTheDocument();
    });
  });

  it('FABボタンが表示される', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByLabelText('新しいフレーズを作成')).toBeInTheDocument();
    });
  });

  it('削除ボタンで確認ダイアログが表示される', async () => {
    const db = await openDB();
    const repo = new PhraseRepository(db);
    await repo.create();

    renderPage();
    await waitFor(() => {
      expect(screen.getByText('フレーズ1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('フレーズ1を削除'));
    expect(screen.getByText(/「フレーズ1」を削除しますか/)).toBeInTheDocument();
  });
});
