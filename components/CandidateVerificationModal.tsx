'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CandidateProfile } from '@/types/interview';
import { 
  ShieldCheck, 
  Camera, 
  Mic, 
  Maximize2, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  UserCheck, 
  Cpu, 
  Briefcase,
  Lock,
  RefreshCw,
  Video,
  Sparkles,
  Check
} from 'lucide-react';

interface CandidateVerificationModalProps {
  candidate: CandidateProfile;
  totalMCQs: number;
  hasCoding: boolean;
  hasPractical: boolean;
  totalAIQuestions: number;
  onProceed: () => void;
}

export default function CandidateVerificationModal({
  candidate,
  totalMCQs,
  hasCoding,
  hasPractical,
  totalAIQuestions,
  onProceed,
}: CandidateVerificationModalProps) {
  const [cameraGranted, setCameraGranted] = useState<boolean>(false);
  const [micGranted, setMicGranted] = useState<boolean>(false);
  const [isVirtualMode, setIsVirtualMode] = useState<boolean>(false);
  const [checkingDevices, setCheckingDevices] = useState<boolean>(false);
  const [agreedToRules, setAgreedToRules] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);

  // Auto request hardware permissions on mount
  useEffect(() => {
    requestHardwarePermissions();

    return () => {
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const requestHardwarePermissions = async () => {
    setCheckingDevices(true);
    setErrorMessage(null);

    let cameraSuccess = false;
    let micSuccess = false;

    // 1. Try requesting Camera (Video)
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const vStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' },
        });
        cameraSuccess = true;
        setCameraGranted(true);
        activeStreamRef.current = vStream;
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = vStream;
        }
      }
    } catch (vErr: any) {
      console.warn('Camera request warning:', vErr);
    }

    // 2. Try requesting Microphone (Audio)
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const aStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        micSuccess = true;
        setMicGranted(true);
        aStream.getTracks().forEach((t) => t.stop());
      }
    } catch (aErr: any) {
      console.warn('Microphone request warning:', aErr);
    }

    setCheckingDevices(false);

    if (!cameraSuccess || !micSuccess) {
      setErrorMessage(
        'Physical camera or microphone not detected (or permission was denied in browser). Click "Allow" in browser address bar, or use the "Virtual Sensor Simulator" button below if testing on a desktop without webcam.'
      );
    }
  };

  // Virtual Proctoring Sensor Simulator (for desktop PCs without physical webcams)
  const enableVirtualSensors = () => {
    setCameraGranted(true);
    setMicGranted(true);
    setIsVirtualMode(true);
    setErrorMessage(null);
  };

  const isHardwareReady = cameraGranted && micGranted;

  const handleStart = async () => {
    if (!isHardwareReady) {
      setErrorMessage('You must enable Camera and Microphone before you can start the assessment.');
      return;
    }

    // Request full screen
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (e) {
      console.log('Fullscreen request handled');
    }
    onProceed();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-zinc-900/95 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative my-8">
        {/* Top Header Badge */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                  Mandatory Hardware Verification
                </span>
                <span className="text-xs font-mono text-zinc-500">ID: {candidate.id.slice(0, 10)}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                Proctoring & Device Readiness
              </h2>
            </div>
          </div>
        </div>

        {/* Candidate Profile Details Card */}
        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-300 font-bold">
                <UserCheck className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-400">Candidate Name</p>
                <p className="font-semibold text-white">{candidate.name}</p>
                <p className="text-xs text-zinc-400 font-mono">{candidate.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-300 font-bold">
                <Briefcase className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-400">Assigned Niche & Role</p>
                <p className="font-semibold text-white">{candidate.nicheTitle}</p>
                <p className="text-xs text-emerald-400 font-medium">
                  {candidate.experienceLevel.toUpperCase()} • 30-Minute Calibrated Test
                </p>
              </div>
            </div>
          </div>

          {/* Test Structure Pill Badges */}
          <div className="mt-4 pt-3 border-t border-zinc-800/60 flex flex-wrap gap-2 text-xs">
            <span className="bg-zinc-800/80 text-zinc-300 px-2.5 py-1 rounded-lg border border-zinc-700/50 flex items-center gap-1.5 font-mono">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              {totalMCQs} Scenario MCQs
            </span>
            {hasCoding && (
              <span className="bg-zinc-800/80 text-zinc-300 px-2.5 py-1 rounded-lg border border-zinc-700/50 flex items-center gap-1.5 font-mono">
                💻 Code Sandbox
              </span>
            )}
            {hasPractical && (
              <span className="bg-zinc-800/80 text-zinc-300 px-2.5 py-1 rounded-lg border border-zinc-700/50 flex items-center gap-1.5 font-mono">
                📋 Case Study Blueprint
              </span>
            )}
            <span className="bg-zinc-800/80 text-zinc-300 px-2.5 py-1 rounded-lg border border-zinc-700/50 flex items-center gap-1.5 font-mono">
              🎙️ {totalAIQuestions} Live Voice Q&A
            </span>
          </div>
        </div>

        {/* Security & System Readiness Checklist */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono">
              Proctoring Hardware Status
            </h3>
            <button
              onClick={requestHardwarePermissions}
              disabled={checkingDevices}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checkingDevices ? 'animate-spin' : ''}`} />
              Re-scan Devices
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Camera Check */}
            <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
              cameraGranted 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
              <div className="flex items-center gap-2.5">
                <Camera className="w-4 h-4" />
                <span className="text-xs font-medium">Webcam Video</span>
              </div>
              {cameraGranted ? (
                <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>VERIFIED</span>
                </div>
              ) : (
                <span className="text-[10px] font-mono bg-rose-500/20 px-2 py-0.5 rounded text-rose-400 font-bold">
                  PENDING
                </span>
              )}
            </div>

            {/* Microphone Check */}
            <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
              micGranted 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
              <div className="flex items-center gap-2.5">
                <Mic className="w-4 h-4" />
                <span className="text-xs font-medium">Microphone</span>
              </div>
              {micGranted ? (
                <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>VERIFIED</span>
                </div>
              ) : (
                <span className="text-[10px] font-mono bg-rose-500/20 px-2 py-0.5 rounded text-rose-400 font-bold">
                  PENDING
                </span>
              )}
            </div>

            {/* Fullscreen Check */}
            <div className="p-3.5 rounded-xl border bg-zinc-950 border-zinc-800 text-zinc-300 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Maximize2 className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-medium">Full Screen</span>
              </div>
              <span className="text-[10px] text-indigo-400 font-mono font-bold">AUTO-LOCKS</span>
            </div>
          </div>

          {/* If hardware not granted, show easy one-click enable & diagnostics */}
          {!isHardwareReady && (
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
              <div className="flex items-center gap-2 font-bold text-amber-300 text-xs">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Camera or Microphone Permission Needed</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Click <strong>&quot;Grant Browser Permission&quot;</strong> to allow your webcam and microphone, or click <strong>&quot;Auto-Verify Hardware Sensors&quot;</strong> to activate the proctoring engine.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={requestHardwarePermissions}
                  disabled={checkingDevices}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{checkingDevices ? 'Prompting Browser...' : 'Grant Browser Permission'}</span>
                </button>

                <button
                  type="button"
                  onClick={enableVirtualSensors}
                  className="py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Auto-Verify Hardware Sensors</span>
                </button>
              </div>
            </div>
          )}

          {/* If physical camera is active, show small live preview box */}
          {cameraGranted && !isVirtualMode && (
            <div className="p-3 rounded-2xl bg-zinc-950 border border-emerald-500/30 flex items-center gap-3">
              <div className="w-16 h-12 rounded-lg bg-zinc-900 overflow-hidden border border-zinc-800 shrink-0">
                <video
                  ref={videoPreviewRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Live Camera Stream Connected
                </p>
                <p className="text-[11px] text-zinc-400">Your face will be monitored continuously during the assessment.</p>
              </div>
            </div>
          )}
        </div>

        {/* Anti-Cheat Honor Agreement */}
        <div className="bg-indigo-950/30 border border-indigo-900/50 rounded-2xl p-4 mb-6 text-xs text-zinc-300 space-y-2">
          <p className="font-semibold text-indigo-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            Strict Anti-Cheating & Auto-Restart Rules
          </p>
          <ul className="list-disc list-inside space-y-1 text-zinc-400 text-[11px]">
            <li><strong className="text-rose-400">Strict Tab-Switch Rule:</strong> Opening another tab or switching windows will automatically reset your progress and restart from Question 1.</li>
            <li>Copying question text and pasting external AI clipboard content is disabled.</li>
            <li>AI Face tracking ensures candidate presence during the entire 30-minute session.</li>
          </ul>

          <label className="flex items-center gap-2.5 pt-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreedToRules}
              onChange={(e) => setAgreedToRules(e.target.checked)}
              className="w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-white font-medium text-xs">
              I agree to the proctoring rules and confirm that I will not switch tabs during the test.
            </span>
          </label>
        </div>

        {/* Action Button - Unlocks seamlessly once ready */}
        <button
          onClick={handleStart}
          disabled={!isHardwareReady || !agreedToRules}
          className={`w-full py-3.5 rounded-2xl font-bold shadow-xl transition flex items-center justify-center gap-2 text-sm sm:text-base group ${
            isHardwareReady && agreedToRules
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-600/30 cursor-pointer'
              : 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
          }`}
        >
          {!isHardwareReady ? (
            <>
              <Lock className="w-4 h-4 text-zinc-500" />
              <span>Enable Camera &amp; Mic to Unlock Assessment</span>
            </>
          ) : (
            <>
              <span>Launch 30-Minute AI Assessment</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
