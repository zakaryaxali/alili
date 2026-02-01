import { useCallback, useRef, useEffect } from 'react';

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  onEnd?: () => void;
}

export const useSpeech = () => {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  // Load voices - they may not be available immediately
  useEffect(() => {
    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };

    // Try immediately
    loadVoices();

    // Also listen for voiceschanged event (needed for Chrome)
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  const speak = useCallback((text: string, options?: SpeakOptions) => {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options?.rate ?? 0.9;
    utterance.pitch = options?.pitch ?? 1;
    utterance.volume = 1;

    // Set up onEnd callback if provided
    if (options?.onEnd) {
      utterance.onend = options.onEnd;
    }

    // Try to use a natural-sounding voice (use cached voices or fetch fresh)
    const voices = voicesRef.current.length > 0 ? voicesRef.current : window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => v.lang.startsWith('en') && (v.name.includes('Samantha') || v.name.includes('Google'))
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  return { speak, stop };
};
