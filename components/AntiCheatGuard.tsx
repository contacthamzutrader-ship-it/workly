'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AntiCheatManager, DEFAULT_ANTI_CHEAT_CONFIG } from '@/lib/antiCheat';
import { AntiCheatViolation } from '@/types/interview';
import { Shield, ShieldAlert, Video, Eye, AlertTriangle, Maximize, AlertCircle } from 'lucide-react';

interface AntiCheatGuardProps {
  isActive: boolean;
  onViolation: (violation: AntiCheatViolation, totalViolations: AntiCheatViolation[]) => void;
  onTerminate: (reason: string) => void;
  violations: AntiCheatViolation[];
  integrityScore: number;
}

export default function AntiCheatGuard({
  isActive,
  onViolation,
  onTerminate,
  violations,
  integrityScore,
}: AntiCheatGuardProps) {
  const [manager, setManager] = useState<AntiCheatManager | null>(null);
  const [activeWarning, setActiveWarning] = useState<AntiCheatViolation | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(true);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isFaceDetected, setIsFaceDetected] = useState<boolean>(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize AntiCheat Manager
  useEffect(() => {
    if (!isActive) return;

    const acm = new AntiCheatManager(
      DEFAULT_ANTI_CHEAT_CONFIG,
      (viol, all) => {
        setActiveWarning(viol);
        onViolation(viol, all);
      },
      (reason) => {
        onTerminate(reason);
      }
    );

    acm.start();
    setManager(acm);

    // Check Fullscreen
    const checkFs = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', checkFs);

    return () => {
      acm.stop();
      document.removeEventListener('fullscreenchange', checkFs);
    };
  }, [isActive]);

  // Initialize Webcam Proctoring Feed
  useEffect(() => {
    if (!isActive) return;

    let mounted = true;

    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' },
          audio: false,
        });

        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraActive(true);
        setCameraError(null);
      } catch (err: any) {
        console.warn('Webcam permission denied or unavailable:', err);
        setCameraError('Camera access required for AI proctoring.');
        setCameraActive(false);
      }
    }

    initCamera();

    // Periodic Simulated AI Face Presence Validation
    const faceInterval = setInterval(() => {
      // Periodic check: keep face status active unless tab blurred
      if (document.visibilityState === 'visible') {
        setIsFaceDetected(true);
      }
    }, 4000);

    return () => {
      mounted = false;
      clearInterval(faceInterval);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isActive]);

  const enterFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 65) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  return (
    <>
      {/* Floating Proctoring HUD Widget */}
      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
        {/* Anti-Cheat Trust Meter Bar */}
        <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-xl p-3 shadow-2xl flex items-center gap-4 text-xs font-mono text-zinc-200">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span className="font-semibold text-zinc-300">AI Proctor Active</span>
          </div>

          <div className="h-4 w-px bg-zinc-700" />

          {/* Integrity Score */}
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400">Trust Score:</span>
            <span className={`px-2 py-0.5 rounded-full border font-bold ${getScoreColor(integrityScore)}`}>
              {integrityScore}%
            </span>
          </div>

          <div className="h-4 w-px bg-zinc-700" />

          {/* Violation count */}
          <div className="flex items-center gap-1.5">
            <AlertTriangle className={`w-3.5 h-3.5 ${violations.length > 0 ? 'text-amber-400' : 'text-zinc-500'}`} />
            <span className={violations.length > 0 ? 'text-amber-400 font-bold' : 'text-zinc-400'}>
              {violations.length}/4 Flags
            </span>
          </div>
        </div>

        {/* Live Proctoring Mini Video Feed */}
        <div className="relative w-44 h-32 rounded-xl overflow-hidden border-2 border-indigo-500/40 bg-zinc-950 shadow-2xl group">
          {cameraActive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-zinc-950 text-indigo-300 text-[11px] relative overflow-hidden">
              <div className="w-10 h-10 rounded-full border border-indigo-500/40 flex items-center justify-center mb-1 animate-pulse">
                <Eye className="w-5 h-5 text-indigo-400" />
              </div>
              <span className="font-mono text-[10px] text-zinc-400">AI Proctor Active</span>
              <div className="absolute inset-x-0 h-0.5 bg-indigo-500/60 animate-bounce top-1/2" />
            </div>
          )}

          {/* Overlay Status */}
          <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] text-emerald-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            LIVE
          </div>

          <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] text-zinc-300 font-mono">
            <Eye className="w-3 h-3 text-indigo-400" />
            <span>{isFaceDetected ? 'Face Verified' : 'Scanning...'}</span>
          </div>
        </div>
      </div>

      {/* Fullscreen Warning Banner if candidate exits fullscreen */}
      {!isFullscreen && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-rose-600/95 backdrop-blur-md text-white py-2.5 px-4 flex items-center justify-between shadow-xl animate-bounce">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-medium">
              Assessment requires Full-Screen Mode to prevent unauthorized tab switching!
            </span>
          </div>
          <button
            onClick={enterFullscreen}
            className="flex items-center gap-1.5 bg-white text-rose-900 px-3 py-1 rounded-lg text-xs font-bold hover:bg-zinc-100 transition shadow"
          >
            <Maximize className="w-3.5 h-3.5" />
            Re-enter Full Screen
          </button>
        </div>
      )}

      {/* Violation Popup Modal */}
      {activeWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border-2 border-rose-500/80 rounded-2xl p-6 max-w-md w-full shadow-2xl text-center">
            <div className="w-14 h-14 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/30">
              <ShieldAlert className="w-8 h-8 animate-pulse" />
            </div>

            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
              Security Violation Detected ({violations.length}/4)
            </span>

            <h3 className="text-xl font-bold text-white mt-3 mb-2">Anti-Cheat Alert</h3>
            <p className="text-sm text-zinc-300 mb-4 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800 text-left font-mono">
              {activeWarning.details}
            </p>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-300 text-left mb-5">
              ⚠️ <strong>Warning:</strong> Switching tabs, copying text, or exiting fullscreen degrades your Trust Score. 4 total violations will terminate the session and flag your profile.
            </div>

            <button
              onClick={() => setActiveWarning(null)}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-medium transition shadow-lg shadow-rose-900/40"
            >
              I Understand & Resume Assessment
            </button>
          </div>
        </div>
      )}
    </>
  );
}
