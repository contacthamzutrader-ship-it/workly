'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AIInterviewQuestion } from '@/types/interview';
import { 
  AISpeechEngine, 
  CandidateSpeechRecognition, 
  evaluateCandidateAnswer, 
  AIAnalysisResult 
} from '@/lib/aiInterviewer';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Bot, 
  Sparkles, 
  CheckCircle2, 
  HelpCircle, 
  Cpu, 
  Radio 
} from 'lucide-react';

interface AIInterviewerCardProps {
  question: AIInterviewQuestion;
  questionNumber: number;
  totalQuestions: number;
  onAnswerSubmit: (transcript: string, score: number) => void;
  initialTranscript?: string;
}

export default function AIInterviewerCard({
  question,
  questionNumber,
  totalQuestions,
  onAnswerSubmit,
  initialTranscript,
}: AIInterviewerCardProps) {
  const [isAiSpeaking, setIsAiSpeaking] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>(initialTranscript || '');
  const [evaluation, setEvaluation] = useState<AIAnalysisResult | null>(null);
  const [micSupported, setMicSupported] = useState<boolean>(true);

  const speechEngineRef = useRef<AISpeechEngine | null>(null);
  const recognitionRef = useRef<CandidateSpeechRecognition | null>(null);

  useEffect(() => {
    speechEngineRef.current = new AISpeechEngine();
    recognitionRef.current = new CandidateSpeechRecognition();
    setMicSupported(recognitionRef.current.isSupported());

    // Automatically have AI introduce the question verbally once on mount
    const timer = setTimeout(() => {
      handleSpeakQuestion();
    }, 600);

    return () => {
      clearTimeout(timer);
      speechEngineRef.current?.stop();
      recognitionRef.current?.stopListening();
    };
  }, [question.id]);

  const handleSpeakQuestion = () => {
    if (!speechEngineRef.current) return;
    setIsAiSpeaking(true);
    speechEngineRef.current.speak(
      `Question ${questionNumber}. ${question.question}`,
      () => setIsAiSpeaking(true),
      () => setIsAiSpeaking(false)
    );
  };

  const handleStopSpeaking = () => {
    speechEngineRef.current?.stop();
    setIsAiSpeaking(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stopListening();
      setIsRecording(false);
      // Auto evaluate on recording stop
      if (transcript.trim()) {
        const evalResult = evaluateCandidateAnswer(question, transcript);
        setEvaluation(evalResult);
        onAnswerSubmit(transcript, evalResult.scoreOutOf100);
      }
    } else {
      handleStopSpeaking();
      setIsRecording(true);
      recognitionRef.current?.startListening(
        (text) => {
          setTranscript(text);
          const evalResult = evaluateCandidateAnswer(question, text);
          setEvaluation(evalResult);
          onAnswerSubmit(text, evalResult.scoreOutOf100);
        },
        (err) => {
          console.warn('Speech recognition error:', err);
          setIsRecording(false);
        }
      );
    }
  };

  const handleManualTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setTranscript(text);
    const evalResult = evaluateCandidateAnswer(question, text);
    setEvaluation(evalResult);
    onAnswerSubmit(text, evalResult.scoreOutOf100);
  };

  return (
    <div className="flex flex-col bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
      {/* Header Bar */}
      <div className="bg-zinc-900/90 border-b border-zinc-800 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Bot className="w-5 h-5" />
            </div>
            {isAiSpeaking && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold uppercase text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                AI Technical Interviewer
              </span>
              <span className="text-xs font-mono text-zinc-500">
                Question {questionNumber} of {totalQuestions}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white mt-0.5">Live Voice Q&A Session</h3>
          </div>
        </div>

        {/* Audio controls */}
        <div className="flex items-center gap-2">
          {isAiSpeaking ? (
            <button
              onClick={handleStopSpeaking}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium rounded-xl transition flex items-center gap-1.5 shadow"
            >
              <VolumeX className="w-3.5 h-3.5" />
              <span>Mute AI</span>
            </button>
          ) : (
            <button
              onClick={handleSpeakQuestion}
              className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-xl transition border border-zinc-700 flex items-center gap-1.5"
            >
              <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Replay Audio</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="p-6 space-y-6">
        {/* AI Question Prompt Card */}
        <div className="bg-gradient-to-r from-indigo-950/40 via-zinc-900 to-zinc-900 border border-indigo-500/30 rounded-2xl p-5 relative overflow-hidden">
          {/* Animated audio wave graphic if AI speaking */}
          {isAiSpeaking && (
            <div className="absolute top-3 right-4 flex items-center gap-1">
              <span className="w-1 h-3 bg-indigo-400 rounded-full animate-pulse" />
              <span className="w-1 h-6 bg-indigo-400 rounded-full animate-pulse delay-75" />
              <span className="w-1 h-4 bg-indigo-400 rounded-full animate-pulse delay-150" />
              <span className="w-1 h-8 bg-indigo-400 rounded-full animate-pulse delay-100" />
              <span className="w-1 h-2 bg-indigo-400 rounded-full animate-pulse" />
            </div>
          )}

          <div className="flex items-start gap-3">
            <span className="text-2xl">🎙️</span>
            <div>
              <p className="text-xs uppercase font-mono tracking-wider text-indigo-400 font-semibold mb-1">
                Technical Inquiry
              </p>
              <p className="text-base sm:text-lg font-medium text-white leading-relaxed">
                {question.question}
              </p>
            </div>
          </div>
        </div>

        {/* Candidate Audio & Speech-to-Text Input Area */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-300 flex items-center gap-2">
              <Radio className={`w-3.5 h-3.5 ${isRecording ? 'text-rose-500 animate-pulse' : 'text-zinc-500'}`} />
              Candidate Voice Response
            </span>
            <span className="text-zinc-500">
              {micSupported ? 'Microphone enabled (Voice recognition or typing)' : 'Type answer below'}
            </span>
          </div>

          <div className="relative">
            <textarea
              value={transcript}
              onChange={handleManualTextChange}
              rows={5}
              className="w-full p-4 bg-zinc-900/70 border border-zinc-800 rounded-2xl text-zinc-100 text-sm leading-relaxed resize-none focus:outline-none focus:border-indigo-500 transition selection:bg-indigo-600/40"
              placeholder={
                isRecording
                  ? 'Listening to your speech in real time... Speak clearly into your mic.'
                  : 'Click "Start Speaking" or type your detailed answer here...'
              }
            />

            {/* Mic Floating Action Button */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              <button
                type="button"
                onClick={toggleRecording}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xl ${
                  isRecording
                    ? 'bg-rose-600 text-white animate-pulse shadow-rose-900/50'
                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-900/40'
                }`}
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-4 h-4" />
                    <span>Stop Recording</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    <span>Start Speaking (Mic)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Real-time AI Evaluation Rubric Feedback */}
        {evaluation && transcript.trim().length > 0 && (
          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  AI Real-Time Evaluation
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">Response Depth:</span>
                <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                  evaluation.scoreOutOf100 >= 80
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                    : evaluation.scoreOutOf100 >= 60
                    ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                    : 'text-zinc-400 bg-zinc-800 border-zinc-700'
                }`}>
                  {evaluation.quality} ({evaluation.scoreOutOf100}/100)
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed font-sans">{evaluation.feedback}</p>

            {evaluation.matchedKeywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {evaluation.matchedKeywords.map((kw, i) => (
                  <span
                    key={i}
                    className="text-[11px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1 font-mono"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
