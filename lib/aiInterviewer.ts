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
 * Multi-factor technical rubric evaluation of candidate answers.
 * Evaluates concept relevance, architectural depth, lexical diversity, and real-world reasoning.
 */
export function evaluateCandidateAnswer(
  question: AIInterviewQuestion,
  answerText: string
): AIAnalysisResult {
  const raw = (answerText || '').trim();
  const normalized = raw.toLowerCase();
  const words = normalized.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Immediate guard: too brief
  if (wordCount < 12) {
    return {
      scoreOutOf100: 25,
      quality: 'Weak',
      matchedKeywords: [],
      missingPoints: question.expectedKeyPoints,
      feedback: 'Answer was too brief. Please provide a detailed technical explanation covering architecture, tradeoffs, and concrete implementation steps.',
    };
  }

  // Lexical Diversity check (prevents repeating the same word to boost word count)
  const uniqueWords = new Set(words);
  const lexicalDiversity = uniqueWords.size / wordCount;
  if (lexicalDiversity < 0.45 && wordCount > 25) {
    return {
      scoreOutOf100: 35,
      quality: 'Weak',
      matchedKeywords: [],
      missingPoints: question.expectedKeyPoints,
      feedback: 'High repetition detected. Please elaborate with specific technical terminology, code concepts, and structured reasoning.',
    };
  }

  const matchedKeywords: string[] = [];
  const missingPoints: string[] = [];

  // Evaluate technical concept coverage
  question.expectedKeyPoints.forEach((point) => {
    const terms = point
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2);

    // Multi-term semantic match check
    let matchedCount = 0;
    terms.forEach((term) => {
      if (normalized.includes(term)) matchedCount++;
    });

    const isMatched = terms.length <= 2 
      ? matchedCount >= 1 
      : matchedCount >= Math.ceil(terms.length * 0.4);

    if (isMatched) {
      matchedKeywords.push(point);
    } else {
      missingPoints.push(point);
    }
  });

  const totalPoints = question.expectedKeyPoints.length || 1;
  const conceptCoverageRatio = matchedKeywords.length / totalPoints;

  // Reasoning & Architectural depth indicators
  const depthIndicators = [
    'because', 'tradeoff', 'performance', 'security', 'scalable', 'scale',
    'architecture', 'optimize', 'cache', 'pattern', 'async', 'latency',
    'testing', 'component', 'state', 'handler', 'lifecycle', 'maintainability'
  ];
  const depthMatches = depthIndicators.filter((d) => normalized.includes(d)).length;
  const reasoningFactor = Math.min(1.0, depthMatches / 4);

  // Length completeness curve (diminishing returns after 75 words)
  const lengthFactor = Math.min(1.0, wordCount / 65);

  // Weighted composite score:
  // - 55% Core Concept & Technical Accuracy
  // - 25% Architectural & Engineering Reasoning
  // - 20% Completeness & Articulation Depth
  const rawScore = Math.round(
    conceptCoverageRatio * 55 +
    reasoningFactor * 25 +
    lengthFactor * 20
  );

  const finalScore = Math.min(98, Math.max(28, rawScore));

  let quality: 'Excellent' | 'Good' | 'Fair' | 'Weak' = 'Fair';
  if (finalScore >= 82) quality = 'Excellent';
  else if (finalScore >= 68) quality = 'Good';
  else if (finalScore >= 48) quality = 'Fair';
  else quality = 'Weak';

  // Constructive, human-level feedback
  let feedback = '';
  if (finalScore >= 82) {
    feedback = `Exceptional technical depth. Demonstrates strong domain mastery and articulate understanding of key concepts (${matchedKeywords.length}/${totalPoints} covered).`;
  } else if (finalScore >= 68) {
    const suggest = missingPoints.slice(0, 2).join('; ');
    feedback = `Solid answer with sound practical understanding. To reach top-tier rating, dive deeper into: ${suggest || 'scalability and architectural tradeoffs'}.`;
  } else if (finalScore >= 48) {
    const suggest = missingPoints.slice(0, 2).join('; ');
    feedback = `Addressed foundational elements, but lacked detailed engineering specifics. Focus on explaining: ${suggest || 'core architectural principles'}.`;
  } else {
    feedback = `Answer requires more technical substantiation. Make sure to explicitly cover ${question.expectedKeyPoints.slice(0, 2).join(' and ')}.`;
  }

  return {
    scoreOutOf100: finalScore,
    quality,
    matchedKeywords,
    missingPoints,
    feedback,
  };
}
