import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Toast } from './Toast';

describe('Toast', () => {
  it('メッセージが表示される', () => {
    render(<Toast message="保存に失敗しました" onDismiss={() => {}} />);
    expect(screen.getByText('保存に失敗しました')).toBeInTheDocument();
  });

  it('閉じるボタンでonDismissが呼ばれる', () => {
    const onDismiss = vi.fn();
    render(<Toast message="テスト" onDismiss={onDismiss} />);
    fireEvent.click(screen.getByLabelText('閉じる'));
    expect(onDismiss).toHaveBeenCalled();
  });

  it('アクションボタンが表示される', () => {
    const onAction = vi.fn();
    render(
      <Toast
        message="新しいバージョンがあります"
        action={{ label: '更新する', onClick: onAction }}
        onDismiss={() => {}}
      />,
    );
    expect(screen.getByText('更新する')).toBeInTheDocument();
  });

  it('アクションボタンクリックでonClickが呼ばれる', () => {
    const onAction = vi.fn();
    render(
      <Toast
        message="テスト"
        action={{ label: '実行', onClick: onAction }}
        onDismiss={() => {}}
      />,
    );
    fireEvent.click(screen.getByText('実行'));
    expect(onAction).toHaveBeenCalled();
  });

  it('アクションがない場合、duration後にonDismissが呼ばれる', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(<Toast message="テスト" onDismiss={onDismiss} duration={1000} />);
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onDismiss).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
