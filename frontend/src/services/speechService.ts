/**
 * Speech service using Web Speech API for voice guidance during yoga sessions.
 */
class SpeechService {
  private synth: SpeechSynthesis;
  private lastSpoken: string = '';
  private lastSpokeAt: number = 0;
  private isSpeaking: boolean = false;

  constructor() {
    this.synth = window.speechSynthesis;
  }

  /**
   * Speak text with debouncing to avoid repetition.
   * @param text The text to speak
   * @param minInterval Minimum time between speaking the same text (ms)
   */
  speak(text: string, minInterval: number = 3000): void {
    // Don't speak if already speaking
    if (this.isSpeaking) {
      return;
    }

    // Debounce: don't repeat the same feedback within the interval
    if (text === this.lastSpoken && Date.now() - this.lastSpokeAt < minInterval) {
      return;
    }

    // Cancel any pending speech
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to use a calm, natural voice
    const voices = this.synth.getVoices();
    const preferredVoice = voices.find(
      (v) => v.lang.startsWith('en') && v.name.toLowerCase().includes('natural')
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
    };

    utterance.onend = () => {
      this.isSpeaking = false;
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
    };

    this.synth.speak(utterance);
    this.lastSpoken = text;
    this.lastSpokeAt = Date.now();
  }

  /**
   * Announce a pose transition with name and duration.
   */
  speakPoseTransition(poseName: string, duration: number): void {
    const message = `Next pose: ${poseName}. Hold for ${duration} seconds.`;
    this.speak(message, 0); // Always speak pose transitions
  }

  /**
   * Speak a correction/feedback item.
   */
  speakFeedback(feedback: string): void {
    this.speak(feedback, 5000); // Longer debounce for feedback
  }

  /**
   * Announce session start.
   */
  speakSessionStart(totalPoses: number): void {
    this.speak(`Starting your yoga session with ${totalPoses} poses. Let's begin.`, 0);
  }

  /**
   * Announce session completion.
   */
  speakSessionComplete(): void {
    this.speak('Great job! You have completed your yoga session.', 0);
  }

  /**
   * Stop all speech.
   */
  stop(): void {
    this.synth.cancel();
    this.isSpeaking = false;
  }

  /**
   * Check if speech synthesis is supported.
   */
  isSupported(): boolean {
    return 'speechSynthesis' in window;
  }
}

export const speechService = new SpeechService();
