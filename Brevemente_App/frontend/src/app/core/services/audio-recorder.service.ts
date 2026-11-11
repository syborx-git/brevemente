import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AudioRecordingResult {
  blob: Blob;
  mimeType: string;
  durationSeconds: number;
}

@Injectable({
  providedIn: 'root'
})
export class AudioRecorderService implements OnDestroy {
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private audioChunks: Blob[] = [];

  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;

  private isRecordingSubject = new BehaviorSubject<boolean>(false);
  public isRecording$ = this.isRecordingSubject.asObservable();

  private isPausedSubject = new BehaviorSubject<boolean>(false);
  public isPaused$ = this.isPausedSubject.asObservable();

  private recordingTimeSubject = new BehaviorSubject<number>(0);
  public recordingTime$ = this.recordingTimeSubject.asObservable();

  private audioLevelSubject = new BehaviorSubject<number>(0);
  public audioLevel$ = this.audioLevelSubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  private timerInterval: any = null;
  private currentSeconds = 0;
  private activeMimeType = 'audio/webm';

  public get isRecording(): boolean {
    return this.isRecordingSubject.value;
  }

  public get isPaused(): boolean {
    return this.isPausedSubject.value;
  }

  public get recordingTime(): number {
    return this.recordingTimeSubject.value;
  }

  public get audioLevel(): number {
    return this.audioLevelSubject.value;
  }

  /**
   * Determina el formato de audio óptimo soportado por el navegador
   */
  public getSupportedMimeType(): string {
    const candidateTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/wav'
    ];

    if (typeof MediaRecorder === 'undefined') {
      return '';
    }

    for (const type of candidateTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return '';
  }

  /**
   * Solicita acceso al micrófono e inicia la grabación de audio
   */
  public async startRecording(): Promise<void> {
    this.errorSubject.next(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const err = 'La API de captura de medios (getUserMedia) no está soportada en este navegador.';
      this.errorSubject.next(err);
      throw new Error(err);
    }

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      this.activeMimeType = this.getSupportedMimeType();
      const options: MediaRecorderOptions = {};
      if (this.activeMimeType) {
        options.mimeType = this.activeMimeType;
      }

      this.mediaRecorder = new MediaRecorder(this.mediaStream, options);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onerror = (event: any) => {
        const errorMsg = 'Error en MediaRecorder: ' + (event.error?.message || 'Error desconocido');
        this.errorSubject.next(errorMsg);
      };

      // Iniciar captura por bloques de 1 segundo (timeslice)
      this.mediaRecorder.start(1000);

      this.isRecordingSubject.next(true);
      this.isPausedSubject.next(false);
      this.currentSeconds = 0;
      this.recordingTimeSubject.next(0);

      // Iniciar cronómetro
      this.timerInterval = setInterval(() => {
        if (!this.isPausedSubject.value) {
          this.currentSeconds++;
          this.recordingTimeSubject.next(this.currentSeconds);
        }
      }, 1000);

      // Iniciar analizador de nivel de audio Web Audio API
      this.setupAudioVisualizer(this.mediaStream);

    } catch (err: any) {
      let friendlyMessage = 'No se pudo iniciar la grabación.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        friendlyMessage = 'Permiso denegado: Por favor autoriza el uso del micrófono en tu navegador.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        friendlyMessage = 'No se encontró ningún micrófono conectado en tu dispositivo.';
      } else {
        friendlyMessage = err.message || friendlyMessage;
      }
      this.errorSubject.next(friendlyMessage);
      this.cleanup();
      throw new Error(friendlyMessage);
    }
  }

  /**
   * Pausa la grabación
   */
  public pauseRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
      this.isPausedSubject.next(true);
    }
  }

  /**
   * Reanuda la grabación
   */
  public resumeRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
      this.isPausedSubject.next(false);
    }
  }

  /**
   * Detiene la grabación y retorna el Blob final de audio
   */
  public stopRecording(): Promise<AudioRecordingResult> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        this.cleanup();
        reject(new Error('No hay grabación activa para detener.'));
        return;
      }

      const mimeType = this.activeMimeType || 'audio/webm';
      const duration = this.currentSeconds;

      this.mediaRecorder.onstop = () => {
        try {
          const finalBlob = new Blob(this.audioChunks, { type: mimeType });
          this.cleanup();
          resolve({
            blob: finalBlob,
            mimeType: mimeType,
            durationSeconds: duration
          });
        } catch (err) {
          this.cleanup();
          reject(err);
        }
      };

      if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      } else {
        const finalBlob = new Blob(this.audioChunks, { type: mimeType });
        this.cleanup();
        resolve({
          blob: finalBlob,
          mimeType: mimeType,
          durationSeconds: duration
        });
      }
    });
  }

  /**
   * Cancela y descarta la grabación en curso sin emitir blob
   */
  public cancelRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch {
        // Ignorar
      }
    }
    this.cleanup();
  }

  private setupAudioVisualizer(stream: MediaStream): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.8;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!this.analyser || !this.isRecordingSubject.value) return;

        this.analyser.getByteFrequencyData(dataArray);

        // Promediar la energía en frecuencias
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;

        // Normalizar a porcentaje 0 - 100
        const normalized = Math.min(100, Math.round((average / 128) * 100));
        this.audioLevelSubject.next(normalized);

        this.animFrameId = requestAnimationFrame(checkVolume);
      };

      this.animFrameId = requestAnimationFrame(checkVolume);
    } catch {
      // Si AudioContext falla (por ejemplo por políticas de autoplay), simplemente no transmitimos niveles
      this.audioLevelSubject.next(0);
    }
  }

  private cleanup(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch {
        // Ignorar
      }
      this.audioContext = null;
      this.analyser = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecordingSubject.next(false);
    this.isPausedSubject.next(false);
    this.audioLevelSubject.next(0);
  }

  ngOnDestroy(): void {
    this.cleanup();
  }
}

