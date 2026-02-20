import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScoreDisplay } from './ScoreDisplay';

describe('ScoreDisplay', () => {
  it('スコアが大きく表示される', () => {
    render(<ScoreDisplay totalScore={87} pitchScore={91} rhythmScore={78} />);
    expect(screen.getByText('87')).toBeInTheDocument();
    expect(screen.getByText('点')).toBeInTheDocument();
  });

  it('90点以上は「優秀！」', () => {
    render(<ScoreDisplay totalScore={95} pitchScore={95} rhythmScore={95} />);
    expect(screen.getByText('優秀！')).toBeInTheDocument();
  });

  it('70点以上は「良好」', () => {
    render(<ScoreDisplay totalScore={75} pitchScore={80} rhythmScore={60} />);
    expect(screen.getByText('良好')).toBeInTheDocument();
  });

  it('50点以上は「練習中」', () => {
    render(<ScoreDisplay totalScore={55} pitchScore={60} rhythmScore={40} />);
    expect(screen.getByText('練習中')).toBeInTheDocument();
  });

  it('50点未満は「がんばろう」', () => {
    render(<ScoreDisplay totalScore={30} pitchScore={20} rhythmScore={50} />);
    expect(screen.getByText('がんばろう')).toBeInTheDocument();
  });

  it('ピッチ・リズムの内訳が表示される', () => {
    render(<ScoreDisplay totalScore={87} pitchScore={91} rhythmScore={78} />);
    expect(screen.getByText('ピッチ精度')).toBeInTheDocument();
    expect(screen.getByText('91点')).toBeInTheDocument();
    expect(screen.getByText('リズム精度')).toBeInTheDocument();
    expect(screen.getByText('78点')).toBeInTheDocument();
  });
});
