import { MicPermissionError, RecordingError } from './errors';

/**
 * REQ-RC-REC-001: マイク権限取得
 */
export async function requestMicPermission(): Promise<MediaStream> {
  try {
    return await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'NotAllowedError') {
      throw new MicPermissionError();
    }
    throw new RecordingError(
      error instanceof Error ? error.message : 'マイクの取得に失敗しました',
    );
  }
}

/**
 * ADR-003: MediaRecorder + opus/webm
 * REQ-RC-REC-003: 録音キャプチャ
 */
export class AudioRecorderController {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private stream: MediaStream;

  constructor(stream: MediaStream) {
    this.stream = stream;
  }

  getMediaStream(): MediaStream {
    return this.stream;
  }

  start(): void {
    this.chunks = [];
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm';

    this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        this.chunks.push(e.data);
      }
    };
    this.mediaRecorder.start();
  }

  stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        reject(new RecordingError('録音が開始されていません'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, {
          type: this.mediaRecorder?.mimeType ?? 'audio/webm',
        });
        this.chunks = [];
        resolve(blob);
      };

      this.mediaRecorder.onerror = () => {
        reject(new RecordingError());
      };

      this.mediaRecorder.stop();
    });
  }

  dispose(): void {
    this.stream.getTracks().forEach((track) => track.stop());
    this.mediaRecorder = null;
    this.chunks = [];
  }
}
