/**
 * Speech Recognition (STT) and Speech Synthesis (TTS) service
 * Built on Web Speech API with dual-voice support (AI Assistant & Simulated Caller)
 * and multi-language support (English & Hindi/Hinglish).
 * 
 * Includes:
 * - Intelligent Devanagari-to-Hinglish phonetic transliteration for systems lacking native Hindi TTS packs
 * - Chromium garbage-collection protection & keep-alive resume ticker
 * - Generous, non-clipping watchdog timers that never cut off sentences mid-speech
 * - Multi-sentence sequencing to prevent browser speech timeout on long responses
 */

import { LanguageOption } from '../types';
import { gnaniService } from './gnaniService';

interface IWindowWithSpeech extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export type SpeechRole = 'ai' | 'caller';

// Common Devanagari terms dictionary for high-accuracy phonetic pronunciation
const HINDI_PHONETIC_DICTIONARY: Record<string, string> = {
  'नमस्ते': 'Namaste',
  'कॉल-गार्ड': 'CallGuard',
  'कॉल गार्ड': 'CallGuard',
  'कॉल': 'call',
  'स्क्रीनिंग': 'screening',
  'असिस्टेंट': 'assistant',
  'सुरक्षा': 'suraksha',
  'कारणों': 'kaaranon',
  'कारण': 'kaaran',
  'फ्रॉड': 'fraud',
  'रिस्क': 'risk',
  'ब्लॉक': 'block',
  'की जा रही है': 'ki jaa rahi hai',
  'आपकी': 'aapki',
  'पहचान': 'pehchan',
  'और': 'aur',
  'उद्देश्य': 'uddeshya',
  'सत्यापित': 'satyapit',
  'हो गया है': 'ho gaya hai',
  'कनेक्ट': 'connect',
  'प्रतीक्षा': 'prateeksha',
  'करें': 'karein',
  'बैंक': 'bank',
  'अकाउंट': 'account',
  'खाते': 'khaate',
  'खाता': 'khaata',
  'संबंध': 'sambandh',
  'में': 'mein',
  'वेरिफिकेशन': 'verification',
  'कोड': 'code',
  'पासवर्ड': 'password',
  'ओटीपी': 'OTP',
  'संक्षेप': 'sankshep',
  'बता': 'bata',
  'सकते': 'sakte',
  'हैं': 'hain',
  'है': 'hai',
  'कि': 'ki',
  'आपने': 'aapne',
  'किस': 'kis',
  'किया': 'kiya',
  'कृपया': 'kripya',
  'स्पष्ट': 'spasht',
  'जानकारी': 'jaankari',
  'धन्यवाद': 'dhanyawaad',
  'बात': 'baat',
  'कर रहे हैं': 'kar rahe hain',
  'बोल रहा हूँ': 'bol raha hoon',
  'बोल रही हूँ': 'bol rahi hoon',
  'समस्या': 'samasya',
  'तुरंत': 'turant',
  'बताइए': 'bataiye',
  'बताएं': 'batayein',
  'क्या': 'kya',
  'आप': 'aap',
  'कौन': 'kaun',
  'नहीं': 'nahin',
  'हाँ': 'haan',
  'ठीक है': 'theek hai',
  'प्रोजेक्ट': 'project',
  'प्रेजेंटेशन': 'presentation',
  'टीम': 'team',
  'कल': 'kal',
  'आज': 'aaj',
  'दोपहर': 'dopahar',
  'मीटिंग': 'meeting',
  'बिजली': 'bijli',
  'बिल': 'bill',
  'कनेक्शन': 'connection',
  'लॉटरी': 'lottery',
  'इनाम': 'inaam',
  'रुपये': 'rupaye',
  'डाउनलोड': 'download',
  'ऐप': 'app',
  'सपोर्ट': 'support',
  'पार्सल': 'parcel',
  'कूरियर': 'courier',
  'शुल्क': 'shulk',
  'फीस': 'fees',
  'कस्टमर': 'customer',
  'केयर': 'care',
  'संदिग्ध': 'sandigdh',
  'अनधिकृत': 'anadhikrit',
  'ट्रांजेक्शन': 'transaction',
  'डिटेक्ट': 'detect',
  'फ्रीज': 'freeze',
  'बचाने': 'bachane',
  'फोन': 'phone',
  'पर': 'par',
  'आया': 'aaya',
  'अंकों': 'ankon',
  'का': 'ka',
  'के': 'ke',
  'की': 'ki',
  'को': 'ko',
  'से': 'se',
  'जुड़े': 'jude',
};

// Algorithmic transliteration for arbitrary Devanagari text
export function devanagariToHinglish(devanagariText: string): string {
  if (!devanagariText) return '';

  let result = devanagariText;

  // Substitute known whole terms first
  for (const [hindiTerm, phonetic] of Object.entries(HINDI_PHONETIC_DICTIONARY)) {
    const escaped = hindiTerm.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    result = result.replace(new RegExp(escaped, 'g'), phonetic);
  }

  // Devanagari vowels, matras, consonants transliteration mapping
  const charMap: Record<string, string> = {
    // Vowels
    'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo', 'ऋ': 'ri',
    'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au', 'अं': 'an', 'अः': 'ah',
    // Matras (vowel signs)
    'ा': 'aa', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo', 'ृ': 'ri',
    'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ं': 'n', 'ँ': 'n', 'ः': 'h',
    // Consonants
    'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
    'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'ny',
    'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
    'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
    'प': 'p', 'फ': 'f', 'ब': 'b', 'भ': 'bh', 'म': 'm',
    'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v',
    'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h',
    'क्ष': 'ksh', 'त्र': 'tr', 'ज्ञ': 'gya',
    'ड़': 'd', 'ढ़': 'dh', 'ज़': 'z', 'फ़': 'f', 'ख़': 'kh', 'ग़': 'gh',
    '्': '', // Virama
    '।': '.', // Purna viram to period
  };

  // Convert any remaining Devanagari characters
  let converted = '';
  for (let i = 0; i < result.length; i++) {
    const ch = result[i];
    if (charMap[ch] !== undefined) {
      converted += charMap[ch];
    } else {
      converted += ch;
    }
  }

  // Clean up extra spaces or punctuation artifacts
  return converted
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,?!])/g, '$1')
    .trim();
}

// Global anchor to prevent V8 garbage-collecting active utterances mid-speech
const activeUtterancesSet = new Set<SpeechSynthesisUtterance>();

export class SpeechService {
  private recognition: any = null;
  private isListening: boolean = false;
  private isSpeaking: boolean = false;
  private onResultCallback?: (text: string, isFinal: boolean) => void;
  private onErrorCallback?: (errorMsg: string) => void;
  private onEndCallback?: () => void;
  private aiVoice: SpeechSynthesisVoice | null = null;
  private callerVoice: SpeechSynthesisVoice | null = null;
  private aiHindiVoice: SpeechSynthesisVoice | null = null;
  private callerHindiVoice: SpeechSynthesisVoice | null = null;
  private indianEnglishVoice: SpeechSynthesisVoice | null = null;
  private watchdogTimer: any = null;
  private keepAliveInterval: any = null;
  private currentRecognitionLang: string = 'en-US';
  private currentVoiceProvider: 'gnani' | 'browser-fallback' = 'browser-fallback';
  private activeMediaStream: MediaStream | null = null;
  private isGnaniRecording: boolean = false;
  private recordingTimeout: any = null;

  constructor() {
    this.initVoices();
    this.initRecognition();
  }

  public getVoiceProvider(): 'gnani' | 'browser-fallback' {
    return this.currentVoiceProvider;
  }

  public isSpeechRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const win = window as unknown as IWindowWithSpeech;
    return !!(win.SpeechRecognition || win.webkitSpeechRecognition);
  }

  public isSpeechSynthesisSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'speechSynthesis' in window;
  }

  public hasNativeHindiVoice(): boolean {
    return !!(this.aiHindiVoice || this.callerHindiVoice);
  }

  public primeAudio() {
    if (typeof window === 'undefined') return;
    if ('speechSynthesis' in window) {
      this.initVoices();
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch {
        // ignore
      }
    }
  }

  public initVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const selectVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return;

      const isHindiVoice = (v: SpeechSynthesisVoice) => {
        const lang = (v.lang || '').toLowerCase().replace('_', '-');
        const name = (v.name || '').toLowerCase();
        return (
          lang.startsWith('hi') ||
          lang === 'hi-in' ||
          name.includes('hindi') ||
          name.includes('हिन्दी') ||
          name.includes('swara') ||
          name.includes('madhur') ||
          name.includes('kalpana') ||
          name.includes('hemant') ||
          name.includes('lekha')
        );
      };

      const isIndianEnglishVoice = (v: SpeechSynthesisVoice) => {
        const lang = (v.lang || '').toLowerCase().replace('_', '-');
        const name = (v.name || '').toLowerCase();
        return (
          lang === 'en-in' ||
          lang.startsWith('en-in') ||
          name.includes('india') ||
          name.includes('neerja') ||
          name.includes('prabhat') ||
          name.includes('heera') ||
          name.includes('ravi') ||
          name.includes('veena')
        );
      };

      const hindiVoices = voices.filter(isHindiVoice);
      const indianEnVoices = voices.filter(isIndianEnglishVoice);
      const englishVoices = voices.filter((v) => v.lang.startsWith('en'));

      this.indianEnglishVoice = indianEnVoices[0] || null;

      // 1. Genuine Hindi AI Assistant Voice
      this.aiHindiVoice =
        hindiVoices.find(
          (v) =>
            v.name.includes('Google हिन्दी') ||
            v.name.includes('Kalpana') ||
            v.name.includes('Swara') ||
            v.name.includes('Lekha') ||
            v.name.includes('Female')
        ) ||
        hindiVoices[0] ||
        null;

      // 2. Genuine Hindi Caller Voice
      this.callerHindiVoice =
        hindiVoices.find(
          (v) =>
            v !== this.aiHindiVoice &&
            (v.name.includes('Hemant') ||
              v.name.includes('Madhur') ||
              v.name.includes('Male'))
        ) ||
        hindiVoices.find((v) => v !== this.aiHindiVoice) ||
        this.aiHindiVoice;

      // 3. English AI Voice
      this.aiVoice =
        englishVoices.find(
          (v) =>
            v.name.includes('Google US English') ||
            v.name.includes('Samantha') ||
            v.name.includes('Jenny') ||
            v.name.includes('Aria') ||
            v.name.includes('Natural')
        ) ||
        englishVoices[0] ||
        voices[0];

      // 4. English Caller Voice
      this.callerVoice =
        englishVoices.find(
          (v) =>
            v !== this.aiVoice &&
            (v.name.includes('David') ||
              v.name.includes('Daniel') ||
              v.name.includes('Alex') ||
              v.name.includes('Guy') ||
              v.name.includes('UK English') ||
              v.name.includes('India'))
        ) ||
        englishVoices.find((v) => v !== this.aiVoice) ||
        this.aiVoice;
    };

    selectVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = selectVoices;
    }
  }

  private initRecognition() {
    if (typeof window === 'undefined') return;
    const win = window as unknown as IWindowWithSpeech;
    const SpeechRecognitionConstructor = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (SpeechRecognitionConstructor) {
      try {
        this.recognition = new SpeechRecognitionConstructor();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = this.currentRecognitionLang;
        this.recognition.maxAlternatives = 1;

        this.recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const result = event.results[i];
            if (result.isFinal) {
              finalTranscript += result[0].transcript;
            } else {
              interimTranscript += result[0].transcript;
            }
          }

          if (finalTranscript && this.onResultCallback) {
            this.onResultCallback(finalTranscript.trim(), true);
          } else if (interimTranscript && this.onResultCallback) {
            this.onResultCallback(interimTranscript.trim(), false);
          }
        };

        this.recognition.onerror = (event: any) => {
          this.isListening = false;
          let message = 'Speech recognition error';
          if (event.error === 'not-allowed') {
            message = 'Microphone permission was denied. Please allow microphone access or use the quick buttons below.';
          } else if (event.error === 'no-speech') {
            message = 'No speech detected. Speak or click a quick response below.';
          } else if (event.error === 'network') {
            // Web Speech API network error in sandboxed iframe: fall back to MediaRecorder + Gnani STT
            if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
              this.startListeningWithGnani(
                this.onResultCallback || (() => {}),
                this.onErrorCallback || (() => {}),
                this.onEndCallback || (() => {}),
                this.currentRecognitionLang.startsWith('hi') ? 'hi' : 'en'
              );
              return;
            }
            message = 'Microphone speech service restricted in this preview. Use quick cues or type below.';
          } else {
            message = `Speech recognition error: ${event.error || 'unknown'}`;
          }

          if (this.onErrorCallback) {
            this.onErrorCallback(message);
          }
        };

        this.recognition.onend = () => {
          if (!this.isGnaniRecording) {
            this.isListening = false;
            if (this.onEndCallback) {
              this.onEndCallback();
            }
          }
        };
      } catch (err) {
        console.warn('SpeechRecognition initialization error:', err);
      }
    }
  }

  public async requestMicrophonePermission(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Listen via MediaRecorder and transcribe through Gnani Prisma STT proxy
   */
  public async startListeningWithGnani(
    onResult: (text: string, isFinal: boolean) => void,
    onError: (errorMsg: string) => void,
    onEnd: () => void,
    lang: LanguageOption = 'en'
  ): Promise<boolean> {
    try {
      this.stopSpeaking();
      this.onResultCallback = onResult;
      this.onErrorCallback = onError;
      this.onEndCallback = onEnd;

      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        onError('Microphone recording is not supported in this environment.');
        return false;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.activeMediaStream = stream;
      const started = await gnaniService.startRecording(stream);
      if (!started) {
        stream.getTracks().forEach((t) => t.stop());
        this.activeMediaStream = null;
        onError('Failed to start microphone recording.');
        return false;
      }

      this.isGnaniRecording = true;
      this.isListening = true;

      // Auto-stop after 5 seconds of speech to transcribe
      if (this.recordingTimeout) clearTimeout(this.recordingTimeout);
      this.recordingTimeout = setTimeout(() => {
        if (this.isGnaniRecording) {
          this.stopListening();
        }
      }, 5000);

      return true;
    } catch (err: any) {
      this.isListening = false;
      this.isGnaniRecording = false;
      if (this.activeMediaStream) {
        this.activeMediaStream.getTracks().forEach((t) => t.stop());
        this.activeMediaStream = null;
      }
      onError(err?.message || 'Microphone access denied or unavailable.');
      return false;
    }
  }

  public startListening(
    onResult: (text: string, isFinal: boolean) => void,
    onError: (errorMsg: string) => void,
    onEnd: () => void,
    lang: LanguageOption = 'en'
  ): boolean {
    this.stopSpeaking();
    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.onEndCallback = onEnd;

    const targetLang = lang === 'hi' ? 'hi-IN' : 'en-US';
    this.currentRecognitionLang = targetLang;

    if (!this.recognition) {
      this.initRecognition();
    }

    if (this.recognition) {
      this.recognition.lang = targetLang;
    }

    if (!this.recognition) {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        this.startListeningWithGnani(onResult, onError, onEnd, lang);
        return true;
      }
      onError('Microphone speech recognition is not supported in this browser environment. You can use the quick response cues or text input.');
      return false;
    }

    try {
      if (this.isListening) {
        try {
          this.recognition.stop();
        } catch {
          // ignore
        }
      }
      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (err: any) {
      this.isListening = false;
      console.warn('Could not start speech recognition, attempting Gnani recorder:', err);
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        this.startListeningWithGnani(onResult, onError, onEnd, lang);
        return true;
      }
      onError(err?.message || 'Failed to start microphone listening.');
      return false;
    }
  }

  public stopListening() {
    if (this.isGnaniRecording) {
      if (this.recordingTimeout) {
        clearTimeout(this.recordingTimeout);
        this.recordingTimeout = null;
      }
      this.isGnaniRecording = false;
      this.isListening = false;
      const stream = this.activeMediaStream;
      this.activeMediaStream = null;

      gnaniService
        .stopRecording()
        .then(async (blob) => {
          if (stream) {
            stream.getTracks().forEach((t) => t.stop());
          }
          if (blob && blob.size > 800) {
            const res = await gnaniService.transcribeAudio(
              blob,
              this.currentRecognitionLang.startsWith('hi') ? 'hi' : 'en'
            );
            if (res.success && res.transcript && res.transcript.trim()) {
              this.onResultCallback?.(res.transcript.trim(), true);
            } else {
              this.onEndCallback?.();
            }
          } else {
            this.onEndCallback?.();
          }
        })
        .catch(() => {
          if (stream) {
            stream.getTracks().forEach((t) => t.stop());
          }
          this.onEndCallback?.();
        });
      return;
    }

    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
    }
    this.isListening = false;
  }

  private clearTimers() {
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
    }
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }

  /**
   * Speak text with role differentiation ('ai' vs 'caller') and language selection ('en' vs 'hi').
   * For Hindi: attempts Gnani Timbre TTS first (high-fidelity natural Indian voice).
   * If Gnani is unavailable or fails, gracefully falls back to browser speech synthesis.
   * For English: uses the existing high-accuracy browser speech synthesis engine directly.
   */
  public speak(
    text: string,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: string) => void,
    role: SpeechRole = 'ai',
    lang: LanguageOption = 'en'
  ) {
    if (!text || !text.trim()) {
      onEnd?.();
      return;
    }

    const trimmedText = text.trim();
    this.stopSpeaking();

    // If Hindi mode is active, attempt high-fidelity Gnani Timbre TTS first
    if (lang === 'hi') {
      const voiceName = role === 'caller' ? 'Akash' : 'Nalini';
      gnaniService
        .synthesizeSpeech(trimmedText, 'hi', voiceName)
        .then((res) => {
          if (res.success && res.audioDataUrl) {
            this.isSpeaking = true;
            this.currentVoiceProvider = 'gnani';
            gnaniService.playAudio(
              res.audioDataUrl,
              () => {
                this.isSpeaking = true;
                onStart?.();
              },
              () => {
                this.isSpeaking = false;
                onEnd?.();
              },
              (playErr) => {
                console.warn('Gnani audio playback fallback to browser:', playErr);
                this.currentVoiceProvider = 'browser-fallback';
                this.speakBrowser(trimmedText, onStart, onEnd, onError, role, lang);
              }
            );
          } else {
            // Gnani not configured or returned error: use browser fallback
            this.currentVoiceProvider = 'browser-fallback';
            this.speakBrowser(trimmedText, onStart, onEnd, onError, role, lang);
          }
        })
        .catch((err) => {
          console.warn('Gnani TTS request failed, using browser fallback:', err);
          this.currentVoiceProvider = 'browser-fallback';
          this.speakBrowser(trimmedText, onStart, onEnd, onError, role, lang);
        });
      return;
    }

    // English mode: uses browser speech directly
    this.currentVoiceProvider = 'browser-fallback';
    this.speakBrowser(trimmedText, onStart, onEnd, onError, role, lang);
  }

  private speakBrowser(
    trimmedText: string,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: string) => void,
    role: SpeechRole = 'ai',
    lang: LanguageOption = 'en'
  ) {
    if (!this.isSpeechSynthesisSupported()) {
      onStart?.();
      const estDuration = Math.min(Math.max(trimmedText.length * 70, 1500), 5000);
      setTimeout(() => {
        onEnd?.();
      }, estDuration);
      return;
    }

    // Ensure voices are loaded
    if (!this.aiVoice && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoices();
    }

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const hasNativeHindi = this.hasNativeHindiVoice();
      const hasDevanagari = /[\u0900-\u097F]/.test(trimmedText);

      // Determine the exact spoken text for the voice synthesizer
      let spokenText = trimmedText;
      let voiceToUse: SpeechSynthesisVoice | null = null;
      let speechLang = 'en-US';

      if (lang === 'hi' || hasDevanagari) {
        if (hasNativeHindi) {
          // Native Hindi voice is available in the OS/browser
          voiceToUse = role === 'caller' ? (this.callerHindiVoice || this.aiHindiVoice) : (this.aiHindiVoice || this.callerHindiVoice);
          spokenText = trimmedText;
          speechLang = 'hi-IN';
        } else {
          // Fallback: No native Hindi voice installed on the user's OS.
          // Transliterate Devanagari to clean, natural Romanized Hinglish phonetics
          // so standard or Indian English voice speaks the sentence completely without choking!
          spokenText = devanagariToHinglish(trimmedText);
          voiceToUse = this.indianEnglishVoice || this.aiVoice;
          speechLang = this.indianEnglishVoice ? 'en-IN' : 'en-US';
        }
      } else {
        voiceToUse = role === 'caller' ? this.callerVoice : this.aiVoice;
        speechLang = 'en-US';
      }

      const utterance = new SpeechSynthesisUtterance(spokenText);
      utterance.lang = speechLang;

      if (voiceToUse) {
        utterance.voice = voiceToUse;
      }

      // Natural cadence and pitch
      if (lang === 'hi' || hasDevanagari) {
        if (hasNativeHindi) {
          utterance.rate = role === 'caller' ? 0.95 : 0.98;
          utterance.pitch = role === 'caller' ? 0.95 : 1.02;
        } else {
          // Phonetic English/Indian voice
          utterance.rate = 0.92;
          utterance.pitch = role === 'caller' ? 0.92 : 1.0;
        }
      } else {
        utterance.rate = role === 'caller' ? 0.98 : 1.02;
        utterance.pitch = role === 'caller' ? 0.92 : 1.04;
      }

      utterance.volume = 1.0;

      // Keep utterance reference alive in module-level Set to prevent Chromium V8 garbage collection
      activeUtterancesSet.add(utterance);

      let hasFinished = false;
      const handleFinished = () => {
        if (!hasFinished) {
          hasFinished = true;
          activeUtterancesSet.delete(utterance);
          this.clearTimers();
          this.isSpeaking = false;
          onEnd?.();
        }
      };

      utterance.onstart = () => {
        this.isSpeaking = true;
        onStart?.();
      };

      utterance.onend = () => {
        handleFinished();
      };

      utterance.onerror = (e) => {
        this.isSpeaking = false;
        if (e.error !== 'canceled' && e.error !== 'interrupted') {
          console.warn('Speech synthesis utterance error:', e);
          onError?.(e.error || 'Text-to-speech error');
        }
        handleFinished();
      };

      // Generous Watchdog Timer:
      // Minimum 15 seconds, up to 35 seconds.
      // Crucially: if browser speech synthesis is still actively speaking, DO NOT interrupt!
      const estimatedMs = Math.max(12000, Math.min(spokenText.length * 150 + 6000, 35000));
      this.watchdogTimer = setTimeout(() => {
        if (!hasFinished) {
          if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
            // Still speaking; grant an extra 6 seconds rather than cutting off
            this.watchdogTimer = setTimeout(handleFinished, 6000);
          } else {
            handleFinished();
          }
        }
      }, estimatedMs);

      // Keep-alive ticker for Chromium paused bug
      this.keepAliveInterval = setInterval(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          if (window.speechSynthesis.speaking && window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
        }
      }, 1000);

      window.speechSynthesis.speak(utterance);
    } catch (err: any) {
      console.warn('SpeechSynthesis speak failed:', err);
      this.isSpeaking = false;
      this.clearTimers();
      onEnd?.();
    }
  }

  public speakAI(
    text: string,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: string) => void,
    lang: LanguageOption = 'en'
  ) {
    this.speak(text, onStart, onEnd, onError, 'ai', lang);
  }

  public speakCaller(
    text: string,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: string) => void,
    lang: LanguageOption = 'en'
  ) {
    this.speak(text, onStart, onEnd, onError, 'caller', lang);
  }

  public stopSpeaking() {
    gnaniService.stopAudio();
    this.clearTimers();
    activeUtterancesSet.clear();

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    this.isSpeaking = false;
  }
}

export const speechService = new SpeechService();
