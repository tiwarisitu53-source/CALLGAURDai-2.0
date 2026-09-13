/**
 * Gnani AI Voice Processing Integration Service
 * 
 * Implements:
 * - Gnani Prisma STT (Speech-to-Text) for Hindi/Hinglish transcription
 * - Gnani Timbre TTS (Text-to-Speech) for natural Indian conversational voice synthesis
 * - Resilient fallback to browser Web Speech when Gnani service/credentials are unavailable
 * - Clean audio recording and playback utilities
 */

export interface GnaniStatusResponse {
  configured: boolean;
  provider: 'gnani' | 'browser-fallback';
  sttModel: string;
  ttsModel: string;
  message: string;
}

export interface GnaniSTTResponse {
  success: boolean;
  transcript?: string;
  provider?: string;
  error?: string;
  fallback?: boolean;
}

export interface GnaniTTSResponse {
  success: boolean;
  audioDataUrl?: string;
  provider?: string;
  error?: string;
  fallback?: boolean;
}

class GnaniService {
  private statusCache: GnaniStatusResponse | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording = false;

  /**
   * Check if Gnani AI server-side credentials and endpoints are available
   */
  public async getStatus(forceRefresh = false): Promise<GnaniStatusResponse> {
    if (this.statusCache && !forceRefresh) {
      return this.statusCache;
    }

    try {
      const res = await fetch('/api/gnani/status');
      if (res.ok) {
        const data: GnaniStatusResponse = await res.json();
        this.statusCache = data;
        return data;
      }
    } catch (err) {
      console.warn('Could not fetch Gnani status:', err);
    }

    const fallback: GnaniStatusResponse = {
      configured: false,
      provider: 'browser-fallback',
      sttModel: 'Web Speech API (Hindi/English)',
      ttsModel: 'SpeechSynthesis (Hindi/Phonetic)',
      message: 'Gnani service status unverified; browser fallback active.',
    };
    this.statusCache = fallback;
    return fallback;
  }

  /**
   * Transcribe recorded audio using Gnani Prisma STT via server proxy
   */
  public async transcribeAudio(
    audioBlob: Blob,
    language: 'hi' | 'en' = 'hi'
  ): Promise<GnaniSTTResponse> {
    try {
      const base64Audio = await this.blobToBase64(audioBlob);
      const languageCode = language === 'hi' ? 'hi-IN' : 'en-IN';

      const res = await fetch('/api/gnani/stt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioBase64: base64Audio,
          mimeType: audioBlob.type || 'audio/webm',
          languageCode,
        }),
      });

      const data = await res.json();
      return data;
    } catch (err: any) {
      console.warn('Gnani STT transcription error:', err);
      return {
        success: false,
        error: err?.message || 'Failed to communicate with Gnani STT service',
        fallback: true,
      };
    }
  }

  /**
   * Synthesize spoken Hindi/Hinglish audio using Gnani Timbre TTS via server proxy
   */
  public async synthesizeSpeech(
    text: string,
    language: 'hi' | 'en' = 'hi',
    voice = 'Nalini'
  ): Promise<GnaniTTSResponse> {
    try {
      const res = await fetch('/api/gnani/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          language: language === 'hi' ? 'hi-IN' : 'en-IN',
          voice,
        }),
      });

      const data = await res.json();
      return data;
    } catch (err: any) {
      console.warn('Gnani TTS synthesis error:', err);
      return {
        success: false,
        error: err?.message || 'Failed to communicate with Gnani TTS service',
        fallback: true,
      };
    }
  }

  /**
   * Play Gnani synthesized audio data URL with lifecycle callbacks
   */
  public playAudio(
    audioDataUrl: string,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: any) => void
  ): HTMLAudioElement {
    this.stopAudio();

    const audio = new Audio(audioDataUrl);
    this.currentAudio = audio;

    audio.onplay = () => {
      onStart?.();
    };

    audio.onended = () => {
      this.currentAudio = null;
      onEnd?.();
    };

    audio.onerror = (e) => {
      this.currentAudio = null;
      console.warn('Error playing Gnani audio:', e);
      onError?.(e);
      onEnd?.();
    };

    audio.play().catch((playErr) => {
      console.warn('Audio play request failed (e.g. autoplay policy):', playErr);
      onError?.(playErr);
      onEnd?.();
    });

    return audio;
  }

  /**
   * Stop any currently playing audio
   */
  public stopAudio() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch {
        // ignore
      }
      this.currentAudio = null;
    }
  }

  /**
   * Start recording caller audio through browser MediaRecorder
   */
  public async startRecording(stream: MediaStream): Promise<boolean> {
    this.stopRecording();
    this.audioChunks = [];

    try {
      // Prioritize supported MIME types
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else {
          mimeType = '';
        }
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      this.mediaRecorder = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.audioChunks.push(e.data);
        }
      };

      recorder.start(250); // Slice chunks every 250ms
      this.isRecording = true;
      return true;
    } catch (err) {
      console.warn('Failed to start MediaRecorder for Gnani:', err);
      this.isRecording = false;
      return false;
    }
  }

  /**
   * Stop recording and return the assembled Audio Blob
   */
  public stopRecording(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || !this.isRecording) {
        this.isRecording = false;
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const mime = this.mediaRecorder?.mimeType || 'audio/webm';
        const blob = this.audioChunks.length > 0 ? new Blob(this.audioChunks, { type: mime }) : null;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        resolve(blob);
      };

      try {
        if (this.mediaRecorder.state !== 'inactive') {
          this.mediaRecorder.stop();
        } else {
          resolve(null);
        }
      } catch (e) {
        console.warn('Error stopping MediaRecorder:', e);
        this.mediaRecorder = null;
        this.isRecording = false;
        resolve(null);
      }
    });
  }

  public isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Helper: Convert Blob to base64 string
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Strip data:audio/xxx;base64, prefix
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

export const gnaniService = new GnaniService();
