/**
 * 共通コンポーネントテスト
 * REQ-RC-UX-001: 初回CTA, REQ-RC-UX-005: 空状態表示
 * REQ-RC-DATA-005: 削除確認ダイアログ
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BackButton } from './BackButton';
import { ConfirmDialog } from './ConfirmDialog';
import { EmptyState } from './EmptyState';

describe('BackButton', () => {
  it('ラベルとアイコンが表示される', () => {
    render(
      <MemoryRouter>
        <BackButton label="フレーズ一覧" />
      </MemoryRouter>,
    );
    expect(screen.getByText('フレーズ一覧')).toBeInTheDocument();
    expect(screen.getByText('←')).toBeInTheDocument();
  });

  it('デフォルトラベルは「戻る」', () => {
    render(
      <MemoryRouter>
        <BackButton />
      </MemoryRouter>,
    );
    expect(screen.getByText('戻る')).toBeInTheDocument();
  });
});

describe('ConfirmDialog', () => {
  it('open=false で何も表示しない', () => {
    const { container } = render(
      <ConfirmDialog
        open={false}
        message="削除しますか？"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('open=true でメッセージとボタンが表示される', () => {
    render(
      <ConfirmDialog
        open={true}
        message="削除しますか？"
        confirmLabel="削除"
        cancelLabel="キャンセル"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByText('削除しますか？')).toBeInTheDocument();
    expect(screen.getByText('削除')).toBeInTheDocument();
    expect(screen.getByText('キャンセル')).toBeInTheDocument();
  });

  it('確認ボタンでonConfirmが呼ばれる', () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open={true}
        message="削除しますか？"
        confirmLabel="削除"
        onConfirm={onConfirm}
        onCancel={() => {}}
      />,
    );
    fireEvent.click(screen.getByText('削除'));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('キャンセルボタンでonCancelが呼ばれる', () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        open={true}
        message="削除しますか？"
        onConfirm={() => {}}
        onCancel={onCancel}
      />,
    );
    fireEvent.click(screen.getByText('キャンセル'));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});

describe('EmptyState', () => {
  it('メッセージとCTAが表示される', () => {
    render(
      <EmptyState
        message="練習したいフレーズを録音しましょう"
        actionLabel="最初のフレーズを録音"
        onAction={() => {}}
      />,
    );
    expect(screen.getByText('練習したいフレーズを録音しましょう')).toBeInTheDocument();
    expect(screen.getByText('最初のフレーズを録音')).toBeInTheDocument();
  });

  it('CTAクリックでonActionが呼ばれる', () => {
    const onAction = vi.fn();
    render(
      <EmptyState
        message="test"
        actionLabel="アクション"
        onAction={onAction}
      />,
    );
    fireEvent.click(screen.getByText('アクション'));
    expect(onAction).toHaveBeenCalledOnce();
  });
});
