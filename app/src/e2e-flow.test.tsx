/**
 * E2Eフロー統合テスト
 * REQ-RC-UX-001: 初回CTA, REQ-RC-UX-005: 空状態表示
 * REQ-RC-DATA-003: Phrase即作成, REQ-RC-DATA-005: カスケード削除
 * REQ-RC-UX-003: ワンタップ練習, REQ-RC-UX-004: もう一度ボタン
 * REQ-RC-PLAY-001: お手本再生, REQ-RC-PLAY-002: テイク再生
 * REQ-RC-PITCH-005: スコア表示, DJ-003: タイトル編集
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { openDB, PhraseRepository, TakeRepository } from '@lib/db';
import type { Scores } from '@lib/db';
import { PhraseListPage } from './pages/PhraseListPage';
import { PhraseDetailPage } from './pages/PhraseDetailPage';
import { ScoreResultPage } from './pages/ScoreResultPage';

beforeEach(() => {
  indexedDB = new IDBFactory();
});

function renderApp(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/" element={<PhraseListPage />} />
        <Route path="/phrases/:id" element={<PhraseDetailPage />} />
        <Route path="/phrases/:id/result/:takeId" element={<ScoreResultPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('E2E フロー統合テスト', () => {
  describe('フロー1: 空状態 → CTA → Phrase作成', () => {
    it('空状態で「最初のフレーズを録音」CTAが表示される', async () => {
      renderApp('/');
      await waitFor(() => {
        expect(screen.getByText('練習したいフレーズを録音しましょう')).toBeInTheDocument();
      });
      expect(screen.getByText('最初のフレーズを録音')).toBeInTheDocument();
    });

    it('FABでPhrase作成後、DBにフレーズが保存される', async () => {
      const db = await openDB();
      const repo = new PhraseRepository(db);
      const phrase = await repo.create();

      expect(phrase.title).toBe('フレーズ1');
      expect(phrase.id).toBeTruthy();
      expect(phrase.referenceAudioBlob).toBeNull();
    });
  });

  describe('フロー2: フレーズ詳細 → テイク一覧', () => {
    it('フレーズ詳細画面でお手本未録音メッセージが表示される', async () => {
      const db = await openDB();
      const repo = new PhraseRepository(db);
      const phrase = await repo.create();

      renderApp(`/phrases/${phrase.id}`);
      await waitFor(() => {
        expect(screen.getByText('フレーズ1')).toBeInTheDocument();
      });
      expect(screen.getByText('お手本が未録音です')).toBeInTheDocument();
    });

    it('お手本録音済みフレーズで再生・再録音ボタンが表示される', async () => {
      const db = await openDB();
      const repo = new PhraseRepository(db);
      const phrase = await repo.create();
      await repo.updateReference(phrase.id, new Blob(['audio'], { type: 'audio/webm' }));

      renderApp(`/phrases/${phrase.id}`);
      await waitFor(() => {
        expect(screen.getByText('再生')).toBeInTheDocument();
      });
      expect(screen.getByText('再録音')).toBeInTheDocument();
      expect(screen.getByText('練習する')).toBeInTheDocument();
    });

    it('練習履歴がない場合にメッセージが表示される', async () => {
      const db = await openDB();
      const repo = new PhraseRepository(db);
      const phrase = await repo.create();

      renderApp(`/phrases/${phrase.id}`);
      await waitFor(() => {
        expect(screen.getByText('まだ練習記録がありません')).toBeInTheDocument();
      });
    });

    it('練習履歴がある場合にテイクが表示される', async () => {
      const db = await openDB();
      const phraseRepo = new PhraseRepository(db);
      const takeRepo = new TakeRepository(db);
      const phrase = await phraseRepo.create();
      const scores: Scores = { pitchScore: 85, rhythmScore: 70, totalScore: 81 };
      await takeRepo.create(phrase.id, new Blob(['audio'], { type: 'audio/webm' }), scores);

      renderApp(`/phrases/${phrase.id}`);
      await waitFor(() => {
        expect(screen.getByText('81点')).toBeInTheDocument();
      });
    });
  });

  describe('フロー3: スコア結果画面', () => {
    it('スコアが正しく表示される', async () => {
      const db = await openDB();
      const phraseRepo = new PhraseRepository(db);
      const takeRepo = new TakeRepository(db);
      const phrase = await phraseRepo.create();
      const scores: Scores = { pitchScore: 91, rhythmScore: 78, totalScore: 87 };
      const take = await takeRepo.create(phrase.id, new Blob(['audio'], { type: 'audio/webm' }), scores);

      renderApp(`/phrases/${phrase.id}/result/${take.id}`);
      await waitFor(() => {
        expect(screen.getByText('87')).toBeInTheDocument();
      });
      expect(screen.getByText('良好')).toBeInTheDocument();
      expect(screen.getByText('91点')).toBeInTheDocument();
      expect(screen.getByText('78点')).toBeInTheDocument();
    });

    it('「もう一度」ボタンが表示される', async () => {
      const db = await openDB();
      const phraseRepo = new PhraseRepository(db);
      const takeRepo = new TakeRepository(db);
      const phrase = await phraseRepo.create();
      const scores: Scores = { pitchScore: 50, rhythmScore: 50, totalScore: 50 };
      const take = await takeRepo.create(phrase.id, new Blob(['audio'], { type: 'audio/webm' }), scores);

      renderApp(`/phrases/${phrase.id}/result/${take.id}`);
      await waitFor(() => {
        expect(screen.getByText('もう一度')).toBeInTheDocument();
      });
      expect(screen.getByText('フレーズに戻る')).toBeInTheDocument();
    });
  });

  describe('フロー4: 削除 → カスケード削除', () => {
    it('フレーズ削除で確認ダイアログ → 削除成功', async () => {
      const db = await openDB();
      const phraseRepo = new PhraseRepository(db);
      const takeRepo = new TakeRepository(db);
      const phrase = await phraseRepo.create();
      const scores: Scores = { pitchScore: 80, rhythmScore: 70, totalScore: 77 };
      await takeRepo.create(phrase.id, new Blob(['audio'], { type: 'audio/webm' }), scores);

      renderApp('/');
      await waitFor(() => {
        expect(screen.getByText('フレーズ1')).toBeInTheDocument();
      });

      // 削除ボタンクリック
      fireEvent.click(screen.getByLabelText('フレーズ1を削除'));
      expect(screen.getByText(/「フレーズ1」を削除しますか/)).toBeInTheDocument();

      // 削除確認
      fireEvent.click(screen.getByText('削除'));
      await waitFor(() => {
        expect(screen.getByText('練習したいフレーズを録音しましょう')).toBeInTheDocument();
      });

      // DBからも削除されていることを確認
      const remaining = await phraseRepo.getAll();
      expect(remaining).toHaveLength(0);
      const remainingTakes = await takeRepo.getByPhraseId(phrase.id);
      expect(remainingTakes).toHaveLength(0);
    });
  });

  describe('フロー5: タイトル編集', () => {
    it('タイトルをインライン編集できる', async () => {
      const db = await openDB();
      const repo = new PhraseRepository(db);
      const phrase = await repo.create();

      renderApp(`/phrases/${phrase.id}`);
      await waitFor(() => {
        expect(screen.getByText('フレーズ1')).toBeInTheDocument();
      });

      // 編集ボタンクリック
      fireEvent.click(screen.getByLabelText('タイトルを編集'));
      const input = screen.getByDisplayValue('フレーズ1');
      fireEvent.change(input, { target: { value: 'サビ高音部分' } });
      fireEvent.click(screen.getByText('保存'));

      await waitFor(() => {
        expect(screen.getByText('サビ高音部分')).toBeInTheDocument();
      });

      // DBにも反映されていることを確認
      const updated = await repo.getById(phrase.id);
      expect(updated?.title).toBe('サビ高音部分');
    });
  });

  describe('複数フレーズ管理', () => {
    it('複数フレーズを作成して一覧に表示できる', async () => {
      const db = await openDB();
      const repo = new PhraseRepository(db);
      await repo.create();
      await repo.create();
      await repo.create();

      renderApp('/');
      await waitFor(() => {
        expect(screen.getByText('フレーズ1')).toBeInTheDocument();
      });
      expect(screen.getByText('フレーズ2')).toBeInTheDocument();
      expect(screen.getByText('フレーズ3')).toBeInTheDocument();
    });
  });
});
