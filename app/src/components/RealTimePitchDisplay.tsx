/**
 * REQ-RC-UX-006: リアルタイムピッチ表示
 * 録音中のマイク入力からピッチを検出し音名で表示する
 */
import { useState, useEffect, useRef } from 'react';
import { PitchDetector } from 'pitchy';
import { midiToNoteName, freq2midi } from '@lib/audio';

interface RealTimePitchDisplayProps {
  stream: MediaStream | null;
}

export function RealTimePitchDisplay({ stream }: RealTimePitchDisplayProps) {
  const [noteName, setNoteName] = useState<string>('- -');
  const rafRef = useRef<number | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    if (!stream) {
      setNoteName('- -');
      return;
    }

    const audioCtx = new AudioContext();
    contextRef.current = audioCtx;
    const analyser = audioCtx.createAnalyser();
    analyserRef.current = analyser;
    analyser.fftSize = 2048;

    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);

    const buffer = new Float32Array(analyser.fftSize);
    const detector = PitchDetector.forFloat32Array(analyser.fftSize);

    const detect = () => {
      analyser.getFloatTimeDomainData(buffer);
      const [frequency, clarity] = detector.findPitch(buffer, audioCtx.sampleRate);
      if (clarity > 0.8 && frequency > 80 && frequency < 1000) {
        const midi = freq2midi(frequency);
        if (midi > 0) {
          setNoteName(midiToNoteName(midi));
        }
      }
      rafRef.current = requestAnimationFrame(detect);
    };
    rafRef.current = requestAnimationFrame(detect);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      source.disconnect();
      audioCtx.close();
    };
  }, [stream]);

  return (
    <div className="flex items-center justify-center rounded-lg bg-gray-100 px-4 py-2">
      <span className="font-mono text-lg font-bold text-rose-500">{noteName}</span>
    </div>
  );
}
