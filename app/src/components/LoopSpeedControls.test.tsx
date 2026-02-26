/**
 * TEST-P3-001: LoopSpeedControls ループON/OFFトグル
 * TEST-P3-002: LoopSpeedControls 速度セレクター変更
 * REQ-RC-PLAY-005, REQ-RC-PLAY-006
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LoopSpeedControls } from './LoopSpeedControls';

describe('LoopSpeedControls', () => {
  it('ループボタンクリックで onLoopChange(true) が呼ばれる (TEST-P3-001)', () => {
    const onLoopChange = vi.fn();
    render(
      <LoopSpeedControls
        loop={false}
        onLoopChange={onLoopChange}
        playbackRate={1.0}
        onPlaybackRateChange={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'ループ再生' }));
    expect(onLoopChange).toHaveBeenCalledWith(true);
  });

  it('ループON時にボタンクリックで onLoopChange(false) が呼ばれる', () => {
    const onLoopChange = vi.fn();
    render(
      <LoopSpeedControls
        loop={true}
        onLoopChange={onLoopChange}
        playbackRate={1.0}
        onPlaybackRateChange={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'ループ再生' }));
    expect(onLoopChange).toHaveBeenCalledWith(false);
  });

  it('速度セレクター変更で onPlaybackRateChange(0.5) が呼ばれる (TEST-P3-002)', () => {
    const onPlaybackRateChange = vi.fn();
    render(
      <LoopSpeedControls
        loop={false}
        onLoopChange={vi.fn()}
        playbackRate={1.0}
        onPlaybackRateChange={onPlaybackRateChange}
      />,
    );
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '0.5' } });
    expect(onPlaybackRateChange).toHaveBeenCalledWith(0.5);
  });

  it('ループON時に aria-pressed=true', () => {
    render(
      <LoopSpeedControls
        loop={true}
        onLoopChange={vi.fn()}
        playbackRate={1.0}
        onPlaybackRateChange={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'ループ再生' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('速度セレクターに 0.5x / 0.75x / 1.0x の選択肢がある', () => {
    render(
      <LoopSpeedControls
        loop={false}
        onLoopChange={vi.fn()}
        playbackRate={1.0}
        onPlaybackRateChange={vi.fn()}
      />,
    );
    expect(screen.getByRole('option', { name: '0.5x' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '0.75x' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '1.0x' })).toBeInTheDocument();
  });
});
