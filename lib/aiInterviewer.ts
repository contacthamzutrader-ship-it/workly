import { AIInterviewQuestion } from '@/types/interview';

export interface AIAnalysisResult {
  scoreOutOf100: number;
  quality: 'Excellent' | 'Good' | 'Fair' | 'Weak';
  matchedKeywords: string[];
  missingPoints: string[];
  feedback: string;
}

/**
 * Text-to-Speech Engine using Web Speech API
 */
export class AISpeechEngine {
  private synth: SpeechSynthesis | null = null;
  private isSpeaking: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public speak(text: string, onStart?: () => void, onEnd?: () => void): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth) {
        if (onStart) onStart();
        setTimeout(() => {
          if (onEnd) onEnd();
          resolve();
        }, 2000);
        return;
      }

      this.stop();

      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;
      // Select a natural, warm Female English voice
      const voices = this.synth.getVoices();
      
      // Preferred Natural Female Voice candidate names
      const femaleKeywords = ['zira', 'jenny', 'samantha', 'victoria', 'karen', 'moira', 'fiona', 'serena', 'tessa', 'female', 'natural'];
      
      const preferredFemaleVoice = voices.find((v) => {
        const nameLower = v.name.toLowerCase();
        const isEnglish = v.lang.startsWith('en');
        return isEnglish && femaleKeywords.some((kw) => nameLower.includes(kw));
      }) || voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Microsoft'))) 
         || voices.find((v) => v.lang.startsWith('en'));

      if (preferredFemaleVoice) {
        utterance.voice = preferredFemaleVoice;
      }

      utterance.pitch = 1.1; // Warm, natural feminine pitch
      utterance.rate = 0.96; // Conversational, articulate pacing

      utterance.onstart = () => {
        this.isSpeaking = true;
        if (onStart) onStart();
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        if (onEnd) onEnd();
        resolve();
      };

      utterance.onerror = () => {
        this.isSpeaking = false;
        if (onEnd) onEnd();
        resolve();
      };

      this.synth.speak(utterance);
    });
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
    }
    this.isSpeaking = false;
  }

  public getSpeakingState(): boolean {
    return this.isSpeaking;
  }
}

/**
 * Speech Recognition Wrapper for candidate voice answers
 */
export class CandidateSpeechRecognition {
  private recognition: any = null;
  private isListening: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
      }
    }
  }

  public isSupported(): boolean {
    return !!this.recognition;
  }

  public startListening(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError?: (err: string) => void
  ) {
    if (!this.recognition || this.isListening) return;

    this.isListening = true;

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const combined = finalTranscript || interimTranscript;
      onResult(combined, !!finalTranscript);
    };

    this.recognition.onerror = (event: any) => {
      if (onError) onError(event.error);
    };

    try {
      this.recognition.start();
    } catch {
      // Ignored if already started
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      this.isListening = false;
      try {
        this.recognition.stop();
      } catch {
        // Ignored
      }
    }
  }
}

/**
 * Intelligent rubric evaluation of candidate answers
 */
export function evaluateCandidateAnswer(
  question: AIInterviewQuestion,
  answerText: string
): AIAnalysisResult {
  const normalized = (answerText || '').toLowerCase();
  const wordCount = normalized.trim().split(/\s+/).filter(Boolean).length;

  if (wordCount < 10) {
    return {
      scoreOutOf100: 25,
      quality: 'Weak',
      matchedKeywords: [],
      missingPoints: question.expectedKeyPoints,
      feedback: 'Answer was too brief. Elaborate with specific technical examples and architecture decisions.',
    };
  }

  const matchedKeywords: string[] = [];
  const missingPoints: string[] = [];

  question.expectedKeyPoints.forEach((point) => {
    // Check if key words inside point exist in user answer
    const terms = point
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '')
      .split(' ')
      .filter((w) => w.length > 3);

    const matches = terms.filter((term) => normalized.includes(term));
    if (matches.length >= Math.max(1, Math.floor(terms.length * 0.35))) {
      matchedKeywords.push(point);
    } else {
      missingPoints.push(point);
    }
  });

  const keywordMatchRatio = question.expectedKeyPoints.length > 0
    ? matchedKeywords.length / question.expectedKeyPoints.length
    : 0.8;

  // Base score from keyword depth + word length completeness
  const depthMultiplier = Math.min(1.0, wordCount / 50);
  const rawScore = Math.round((keywordMatchRatio * 60 + depthMultiplier * 40));
  const finalScore = Math.min(100, Math.max(30, rawScore));

  let quality: 'Excellent' | 'Good' | 'Fair' | 'Weak' = 'Fair';
  if (finalScore >= 85) quality = 'Excellent';
  else if (finalScore >= 70) quality = 'Good';
  else if (finalScore >= 50) quality = 'Fair';
  else quality = 'Weak';

  return {
    scoreOutOf100: finalScore,
    quality,
    matchedKeywords,
    missingPoints,
    feedback:
      finalScore >= 80
        ? 'Great technical depth, demonstrates strong practical domain comprehension.'
        : `Addressed key aspects (${matchedKeywords.length}/${question.expectedKeyPoints.length} core concepts covered). Consider mentioning: ${missingPoints.slice(0, 2).join(', ')}.`,
  };
}
