/**
 * REQ-RC-UX-007: お手本音声波形表示
 * DJ-P3-003: 波形表示はWebAudioAPI + Canvas（pitchy不使用）
 */
import { useEffect, useRef } from 'react';

interface WaveformDisplayProps {
  audioBlob: Blob | null;
  height?: number;
}

const SAMPLE_POINTS = 200;

export function WaveformDisplay({ audioBlob, height = 60 }: WaveformDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!audioBlob || !canvasRef.current) return;

    const canvas = canvasRef.current;
    let cancelled = false;

    async function drawWaveform() {
      try {
        const arrayBuffer = await audioBlob!.arrayBuffer();
        if (cancelled) return;

        const offlineCtx = new OfflineAudioContext(1, 44100, 44100);
        const audioBuffer = await offlineCtx.decodeAudioData(arrayBuffer);
        if (cancelled) return;

        const rawData = audioBuffer.getChannelData(0);
        const width = canvas.width;
        const blockSize = Math.floor(rawData.length / SAMPLE_POINTS);
        const samples: number[] = [];

        for (let i = 0; i < SAMPLE_POINTS; i++) {
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(rawData[i * blockSize + j] ?? 0);
          }
          samples.push(sum / blockSize);
        }

        const maxVal = Math.max(...samples, 0.001);
        const ctx2d = canvas.getContext('2d');
        if (!ctx2d || cancelled) return;

        ctx2d.clearRect(0, 0, width, canvas.height);
        ctx2d.strokeStyle = '#e94560';
        ctx2d.lineWidth = 1.5;
        ctx2d.beginPath();

        const centerY = canvas.height / 2;
        const barWidth = width / SAMPLE_POINTS;

        samples.forEach((val, i) => {
          const normalized = val / maxVal;
          const barHeight = normalized * centerY;
          const x = i * barWidth;
          ctx2d.moveTo(x + barWidth / 2, centerY - barHeight);
          ctx2d.lineTo(x + barWidth / 2, centerY + barHeight);
        });

        ctx2d.stroke();
      } catch {
        // 描画失敗時は何も表示しない
      }
    }

    drawWaveform();
    return () => {
      cancelled = true;
    };
  }, [audioBlob]);

  if (!audioBlob) return null;

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="お手本音声波形"
      width={300}
      height={height}
      className="w-full rounded-lg bg-gray-50"
    />
  );
}
