"use client";

import React from "react";

export type EmojiEmotion =
  | "idle"
  | "smile"
  | "laugh"
  | "giggle"
  | "wink"
  | "happy"
  | "curious"
  | "dance"
  | "love"
  | "cheeky"
  | "sparkle"
  | "thinking"
  | "speaking"
  | "apologetic";

interface ParwazEmojiAvatarProps {
  emotion?: EmojiEmotion;
  size?: "xs" | "sm" | "md" | "lg" | "launcher";
  className?: string;
}

const sizeMap = {
  xs: "w-6 h-6",
  sm: "w-8 h-8",
  md: "w-11 h-11",
  lg: "w-16 h-16",
  launcher: "w-14 h-14",
};

export default function ParwazEmojiAvatar({
  emotion = "smile",
  size = "md",
  className = "",
}: ParwazEmojiAvatarProps) {
  const sizeClasses = sizeMap[size] || sizeMap.md;

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${sizeClasses} ${className}`}
      aria-label={`ParwazChat Emoji (${emotion})`}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-md transition-all duration-300 transform overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Main Kawaii Face Gradient: Warm Sun-Gold to Peach Amber */}
          <linearGradient id="kawaiiFaceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF275" />
            <stop offset="35%" stopColor="#FFD43F" />
            <stop offset="85%" stopColor="#FFB319" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>

          {/* Soft Golden Outer Glow */}
          <radialGradient id="outerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="70%" stopColor="#FFE066" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </radialGradient>

          {/* Super Cute Blushing Cheeks (Strawberry Pink) */}
          <radialGradient id="cheekBlush" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FF4D79" stopOpacity="0.65" />
            <stop offset="70%" stopColor="#FF6584" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FF6584" stopOpacity="0" />
          </radialGradient>

          {/* Deep Mouth Gradient */}
          <linearGradient id="mouthGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7F1D1D" />
            <stop offset="100%" stopColor="#991B1B" />
          </linearGradient>

          {/* Soft Pink Tongue Gradient */}
          <linearGradient id="tongueGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFAAA6" />
            <stop offset="100%" stopColor="#FF6B8B" />
          </linearGradient>

          {/* Sparkly Star Eye Gradient */}
          <linearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#EAB308" />
          </linearGradient>

          {/* Heart Eye Gradient */}
          <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF2E63" />
            <stop offset="100%" stopColor="#E11D48" />
          </linearGradient>
        </defs>

        <style>
          {`
            @keyframes softFloat {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(-4px) rotate(1.5deg); }
            }
            @keyframes cuteDance {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              25% { transform: translateY(-4px) rotate(-6deg); }
              50% { transform: translateY(-1px) rotate(0deg); }
              75% { transform: translateY(-4px) rotate(6deg); }
            }
            @keyframes giggleBounce {
              0%, 100% { transform: translateY(0px) scale(1); }
              25% { transform: translateY(-3px) scale(1.05) rotate(-2deg); }
              50% { transform: translateY(1px) scale(0.96) rotate(1deg); }
              75% { transform: translateY(-3px) scale(1.04) rotate(-1deg); }
            }
            @keyframes laughShake {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              20% { transform: translateY(-5px) rotate(-3deg); }
              40% { transform: translateY(2px) rotate(2deg); }
              60% { transform: translateY(-4px) rotate(-2deg); }
              80% { transform: translateY(1px) rotate(1deg); }
            }
            @keyframes cheekyWiggle {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              20% { transform: translateY(-2px) rotate(5deg); }
              40% { transform: translateY(-4px) rotate(-4deg); }
              60% { transform: translateY(-2px) rotate(3deg); }
              80% { transform: translateY(0px) rotate(-2deg); }
            }
            @keyframes loveThrob {
              0%, 100% { transform: scale(1) translateY(0); }
              50% { transform: scale(1.07) translateY(-3px); }
            }
            @keyframes naturalBlink {
              0%, 90%, 100% { transform: scaleY(1); }
              95% { transform: scaleY(0.08); }
            }
            @keyframes heartPulse {
              0%, 100% { transform: scale(1); opacity: 0.7; }
              50% { transform: scale(1.2); opacity: 1; }
            }
            @keyframes talkCheer {
              0%, 100% { transform: scaleY(1); }
              50% { transform: scaleY(1.35) translateY(-1px); }
            }
            @keyframes starTwinkle {
              0%, 100% { opacity: 0.3; transform: scale(0.85); }
              50% { opacity: 1; transform: scale(1.25); }
            }
            @keyframes musicFloat {
              0% { transform: translateY(0) scale(0.7); opacity: 0; }
              50% { opacity: 1; }
              100% { transform: translateY(-12px) scale(1.1); opacity: 0; }
            }

            .anim-float { animation: softFloat 3.2s ease-in-out infinite; transform-origin: 50% 85%; }
            .anim-dance { animation: cuteDance 1.2s ease-in-out infinite; transform-origin: 50% 85%; }
            .anim-giggle { animation: giggleBounce 1s ease-in-out infinite; transform-origin: 50% 85%; }
            .anim-laugh { animation: laughShake 0.9s ease-in-out infinite; transform-origin: 50% 85%; }
            .anim-cheeky { animation: cheekyWiggle 1.4s ease-in-out infinite; transform-origin: 50% 85%; }
            .anim-love { animation: loveThrob 1.3s ease-in-out infinite; transform-origin: 50% 85%; }
            .anim-blink-eye { animation: naturalBlink 3.6s infinite; transform-origin: 50% 45%; }
            .anim-cheek-pulse { animation: heartPulse 2s ease-in-out infinite; transform-origin: 50% 50%; }
            .anim-talk-mouth { animation: talkCheer 0.4s ease-in-out infinite; transform-origin: 50% 68%; }
            .anim-sparkle { animation: starTwinkle 1.5s ease-in-out infinite; }
            .anim-music { animation: musicFloat 2s ease-out infinite; }
          `}
        </style>

        {/* Head Base with Dynamic Movement */}
        <g
          className={
            emotion === "laugh"
              ? "anim-laugh"
              : emotion === "dance"
              ? "anim-dance"
              : emotion === "cheeky"
              ? "anim-cheeky"
              : emotion === "love"
              ? "anim-love"
              : emotion === "giggle"
              ? "anim-giggle"
              : "anim-float"
          }
        >
          {/* Soft outer glow */}
          <circle cx="50" cy="50" r="48" fill="url(#outerGlow)" />

          {/* Cute Round Face Body - NO GREEN DOT ON HEAD */}
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="url(#kawaiiFaceGrad)"
            stroke="#D97706"
            strokeWidth="2.2"
          />

          {/* Soft 3D Lighting Highlight (Glassy Kawaii Sheen) */}
          <ellipse
            cx="38"
            cy="22"
            rx="18"
            ry="10"
            fill="#FFFFFF"
            opacity="0.45"
            transform="rotate(-18 38 22)"
          />
          <circle cx="68" cy="23" r="4" fill="#FFFFFF" opacity="0.3" />

          {/* Rosy Strawberry Blushing Cheeks */}
          <ellipse
            cx="21"
            cy="58"
            rx="10"
            ry="7"
            fill="url(#cheekBlush)"
            className="anim-cheek-pulse"
          />
          <ellipse
            cx="79"
            cy="58"
            rx="10"
            ry="7"
            fill="url(#cheekBlush)"
            className="anim-cheek-pulse"
          />

          {/* Cute Sparkle details on cheeks */}
          <g className="anim-sparkle">
            <path d="M20 56 L20 60 M18 58 L22 58" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
            <path d="M80 56 L80 60 M78 58 L82 58" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
          </g>

          {/* ════════════════════════════════════════════════════
              CUTE ANTICS & MOODS (EVERY 10 SECONDS NEW ANTIC)
          ════════════════════════════════════════════════════ */}

          {/* 1. IDLE / SMILE */}
          {(emotion === "idle" || emotion === "smile") && (
            <>
              <g className="anim-blink-eye" style={{ transformOrigin: "35px 44px" }}>
                <ellipse cx="35" cy="44" rx="6" ry="8" fill="#1E1B4B" />
                <circle cx="33" cy="41" r="2.8" fill="#FFFFFF" />
                <circle cx="37.5" cy="47" r="1.3" fill="#FFFFFF" />
              </g>

              <g className="anim-blink-eye" style={{ transformOrigin: "65px 44px" }}>
                <ellipse cx="65" cy="44" rx="6" ry="8" fill="#1E1B4B" />
                <circle cx="63" cy="41" r="2.8" fill="#FFFFFF" />
                <circle cx="67.5" cy="47" r="1.3" fill="#FFFFFF" />
              </g>

              <path d="M27 33 Q35 28 43 33" stroke="#854D0E" strokeWidth="2.4" strokeLinecap="round" fill="none" />
              <path d="M57 33 Q65 28 73 33" stroke="#854D0E" strokeWidth="2.4" strokeLinecap="round" fill="none" />

              {/* Sweet Kawaii Smile */}
              <path d="M34 62 Q50 78 66 62" stroke="#78350F" strokeWidth="3.2" strokeLinecap="round" fill="none" />
              <path d="M31 60 Q32 63 34 62" stroke="#78350F" strokeWidth="2" strokeLinecap="round" fill="none" />
              <path d="M69 60 Q68 63 66 62" stroke="#78350F" strokeWidth="2" strokeLinecap="round" fill="none" />
            </>
          )}

          {/* 2. LAUGH (BIG JOYFUL LAUGH) */}
          {emotion === "laugh" && (
            <>
              <path d="M26 46 Q35 32 44 46" stroke="#1E1B4B" strokeWidth="4.2" strokeLinecap="round" fill="none" />
              <path d="M56 46 Q65 32 74 46" stroke="#1E1B4B" strokeWidth="4.2" strokeLinecap="round" fill="none" />

              <path d="M26 27 Q35 20 44 26" stroke="#854D0E" strokeWidth="2.8" strokeLinecap="round" fill="none" />
              <path d="M56 26 Q65 20 74 27" stroke="#854D0E" strokeWidth="2.8" strokeLinecap="round" fill="none" />

              {/* Laughing Open Mouth */}
              <g>
                <path
                  d="M30 58 Q50 88 70 58 Q50 63 30 58 Z"
                  fill="url(#mouthGrad)"
                  stroke="#78350F"
                  strokeWidth="2.2"
                  strokeLinejoin="round"
                />
                <ellipse cx="50" cy="74" rx="10" ry="6" fill="url(#tongueGrad)" />
                <path d="M35 59 Q50 65 65 59" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" />
              </g>

              {/* Joy Laughing Sparkles */}
              <g className="anim-sparkle">
                <circle cx="21" cy="42" r="2.5" fill="#60A5FA" opacity="0.8" />
                <circle cx="79" cy="42" r="2.5" fill="#60A5FA" opacity="0.8" />
              </g>
            </>
          )}

          {/* 3. DANCE (MUSICAL BOP & NOTES) */}
          {emotion === "dance" && (
            <>
              <path d="M26 44 Q35 34 44 44" stroke="#1E1B4B" strokeWidth="4" strokeLinecap="round" fill="none" />
              <path d="M56 44 Q65 34 74 44" stroke="#1E1B4B" strokeWidth="4" strokeLinecap="round" fill="none" />

              <path d="M27 28 Q35 22 43 28" stroke="#854D0E" strokeWidth="2.6" strokeLinecap="round" fill="none" />
              <path d="M57 28 Q65 22 73 28" stroke="#854D0E" strokeWidth="2.6" strokeLinecap="round" fill="none" />

              {/* Whistle / Singing Mouth */}
              <ellipse cx="50" cy="65" rx="5.5" ry="5.5" fill="url(#mouthGrad)" stroke="#78350F" strokeWidth="2" />
              <ellipse cx="50" cy="66" rx="3.5" ry="3.5" fill="url(#tongueGrad)" />

              {/* Floating Music Notes 🎵 */}
              <g className="anim-music">
                <path d="M82 25 L82 16 L88 18 L88 27 M82 20 L88 22" stroke="#7C3AED" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                <circle cx="80" cy="25" r="2.8" fill="#7C3AED" />
                <circle cx="86" cy="27" r="2.8" fill="#7C3AED" />
              </g>
            </>
          )}

          {/* 4. LOVE (HEART EYES & SWEET BLUSH) */}
          {emotion === "love" && (
            <>
              {/* Left Heart Eye */}
              <g transform="translate(35, 43)">
                <path
                  d="M0 -3 C-2 -7 -7 -7 -7 -3 C-7 2 0 6 0 7 C0 6 7 2 7 -3 C7 -7 2 -7 0 -3 Z"
                  fill="url(#heartGrad)"
                  stroke="#BE123C"
                  strokeWidth="1"
                />
              </g>

              {/* Right Heart Eye */}
              <g transform="translate(65, 43)">
                <path
                  d="M0 -3 C-2 -7 -7 -7 -7 -3 C-7 2 0 6 0 7 C0 6 7 2 7 -3 C7 -7 2 -7 0 -3 Z"
                  fill="url(#heartGrad)"
                  stroke="#BE123C"
                  strokeWidth="1"
                />
              </g>

              <path d="M28 29 Q35 24 42 29" stroke="#854D0E" strokeWidth="2.4" strokeLinecap="round" fill="none" />
              <path d="M58 29 Q65 24 72 29" stroke="#854D0E" strokeWidth="2.4" strokeLinecap="round" fill="none" />

              {/* Sweet smile with tongue */}
              <path d="M36 62 Q50 76 64 62" stroke="#78350F" strokeWidth="3.2" strokeLinecap="round" fill="none" />
              <path d="M45 68 Q50 74 55 68" fill="url(#tongueGrad)" stroke="#78350F" strokeWidth="1.2" />

              {/* Mini floating heart */}
              <g className="anim-sparkle">
                <path d="M83 18 C81 15 78 15 78 18 C78 21 83 24 83 25 C83 24 88 21 88 18 C88 15 85 15 83 18 Z" fill="#F43F5E" />
              </g>
            </>
          )}

          {/* 5. CHEEKY (TONGUE OUT :P WITH WINK) */}
          {emotion === "cheeky" && (
            <>
              {/* Left Eye: Open & smiling */}
              <ellipse cx="35" cy="43" rx="6" ry="7.5" fill="#1E1B4B" />
              <circle cx="33" cy="40" r="2.8" fill="#FFFFFF" />
              <circle cx="37.5" cy="46" r="1.3" fill="#FFFFFF" />

              {/* Right Eye: Wink 😉 */}
              <path d="M57 44 Q65 35 73 44" stroke="#1E1B4B" strokeWidth="4" strokeLinecap="round" fill="none" />

              <path d="M28 30 Q35 25 42 30" stroke="#854D0E" strokeWidth="2.4" strokeLinecap="round" fill="none" />
              <path d="M58 32 Q65 28 72 33" stroke="#854D0E" strokeWidth="2.4" strokeLinecap="round" fill="none" />

              {/* Cheeky mouth with tongue poking out :P */}
              <path d="M34 62 Q50 74 66 62" stroke="#78350F" strokeWidth="3" strokeLinecap="round" fill="none" />
              <g transform="translate(48, 65)">
                <path
                  d="M-5 0 Q-5 9 0 9 Q5 9 5 0 Z"
                  fill="url(#tongueGrad)"
                  stroke="#78350F"
                  strokeWidth="1.6"
                />
                {/* Tongue crease */}
                <line x1="0" y1="1" x2="0" y2="6" stroke="#E11D48" strokeWidth="1" strokeLinecap="round" />
              </g>
            </>
          )}

          {/* 6. SPARKLE (STARRY EYES ★) */}
          {emotion === "sparkle" && (
            <>
              {/* Left Star Eye */}
              <g transform="translate(35, 43) scale(1.1)">
                <path
                  d="M0 -7 Q0 0 7 0 Q0 0 0 7 Q0 0 -7 0 Q0 0 0 -7 Z"
                  fill="url(#starGrad)"
                  stroke="#B45309"
                  strokeWidth="0.8"
                />
                <circle cx="0" cy="0" r="2.2" fill="#FFFFFF" />
              </g>

              {/* Right Star Eye */}
              <g transform="translate(65, 43) scale(1.1)">
                <path
                  d="M0 -7 Q0 0 7 0 Q0 0 0 7 Q0 0 -7 0 Q0 0 0 -7 Z"
                  fill="url(#starGrad)"
                  stroke="#B45309"
                  strokeWidth="0.8"
                />
                <circle cx="0" cy="0" r="2.2" fill="#FFFFFF" />
              </g>

              <path d="M26 28 Q35 22 44 28" stroke="#854D0E" strokeWidth="2.6" strokeLinecap="round" fill="none" />
              <path d="M56 28 Q65 22 74 28" stroke="#854D0E" strokeWidth="2.6" strokeLinecap="round" fill="none" />

              {/* Excited open smile */}
              <path
                d="M34 60 Q50 82 66 60 Q50 65 34 60 Z"
                fill="url(#mouthGrad)"
                stroke="#78350F"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <ellipse cx="50" cy="72" rx="8" ry="4.5" fill="url(#tongueGrad)" />
            </>
          )}

          {/* 7. GIGGLE (KAWAII CAT MOUTH :3) */}
          {emotion === "giggle" && (
            <>
              <path d="M27 45 Q35 36 43 45" stroke="#1E1B4B" strokeWidth="3.8" strokeLinecap="round" fill="none" />
              <path d="M57 45 Q65 36 73 45" stroke="#1E1B4B" strokeWidth="3.8" strokeLinecap="round" fill="none" />

              <path d="M28 30 Q35 25 42 30" stroke="#854D0E" strokeWidth="2.4" strokeLinecap="round" fill="none" />
              <path d="M58 30 Q65 25 72 30" stroke="#854D0E" strokeWidth="2.4" strokeLinecap="round" fill="none" />

              {/* Kawaii Cat Mouth :3 */}
              <path d="M36 62 Q43 68 50 62 Q57 68 64 62" stroke="#78350F" strokeWidth="3" strokeLinecap="round" fill="none" />
            </>
          )}

          {/* 8. WINK 😉 */}
          {emotion === "wink" && (
            <>
              <ellipse cx="35" cy="43" rx="6" ry="7.5" fill="#1E1B4B" />
              <circle cx="33" cy="40" r="2.8" fill="#FFFFFF" />
              <circle cx="37.5" cy="46" r="1.3" fill="#FFFFFF" />

              <path d="M57 44 Q65 35 73 44" stroke="#1E1B4B" strokeWidth="4" strokeLinecap="round" fill="none" />

              <path d="M28 30 Q35 25 42 30" stroke="#854D0E" strokeWidth="2.4" strokeLinecap="round" fill="none" />
              <path d="M58 32 Q65 28 72 33" stroke="#854D0E" strokeWidth="2.4" strokeLinecap="round" fill="none" />

              <path d="M35 63 Q52 77 67 61" stroke="#78350F" strokeWidth="3.2" strokeLinecap="round" fill="none" />
            </>
          )}

          {/* 9. CURIOUS */}
          {emotion === "curious" && (
            <>
              <ellipse cx="37" cy="41" rx="6.5" ry="8" fill="#1E1B4B" />
              <circle cx="35" cy="38" r="3" fill="#FFFFFF" />
              <circle cx="39" cy="44" r="1.5" fill="#FFFFFF" />

              <ellipse cx="67" cy="41" rx="6.5" ry="8" fill="#1E1B4B" />
              <circle cx="65" cy="38" r="3" fill="#FFFFFF" />
              <circle cx="69" cy="44" r="1.5" fill="#FFFFFF" />

              <path d="M26 28 Q35 22 44 28" stroke="#854D0E" strokeWidth="2.6" strokeLinecap="round" fill="none" />
              <path d="M57 32 Q65 28 73 33" stroke="#854D0E" strokeWidth="2.4" strokeLinecap="round" fill="none" />

              <ellipse cx="52" cy="65" rx="5" ry="4.5" fill="#78350F" />
              <ellipse cx="52" cy="66" rx="3.5" ry="3" fill="url(#tongueGrad)" />
            </>
          )}

          {/* 10. HAPPY */}
          {emotion === "happy" && (
            <>
              <path d="M27 45 Q35 34 43 45" stroke="#1E1B4B" strokeWidth="4" strokeLinecap="round" fill="none" />
              <path d="M57 45 Q65 34 73 45" stroke="#1E1B4B" strokeWidth="4" strokeLinecap="round" fill="none" />

              <path d="M27 28 Q35 22 43 28" stroke="#854D0E" strokeWidth="2.6" strokeLinecap="round" fill="none" />
              <path d="M57 28 Q65 22 73 28" stroke="#854D0E" strokeWidth="2.6" strokeLinecap="round" fill="none" />

              <path
                d="M32 60 Q50 85 68 60 Q50 65 32 60 Z"
                fill="url(#mouthGrad)"
                stroke="#78350F"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <ellipse cx="50" cy="73" rx="9" ry="5.5" fill="url(#tongueGrad)" />
              <path d="M37 61 Q50 67 63 61" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
            </>
          )}

          {/* 11. THINKING */}
          {emotion === "thinking" && (
            <>
              <ellipse cx="37" cy="40" rx="5.5" ry="6.5" fill="#1E1B4B" />
              <circle cx="36" cy="38" r="2.2" fill="#FFFFFF" />

              <ellipse cx="67" cy="40" rx="5.5" ry="6.5" fill="#1E1B4B" />
              <circle cx="66" cy="38" r="2.2" fill="#FFFFFF" />

              <path d="M27 30 Q35 25 43 31" stroke="#854D0E" strokeWidth="2.6" strokeLinecap="round" fill="none" />
              <path d="M57 32 Q65 28 73 33" stroke="#854D0E" strokeWidth="2.6" strokeLinecap="round" fill="none" />

              <ellipse cx="52" cy="66" rx="5.5" ry="4.5" fill="#78350F" />
              <ellipse cx="52" cy="67" rx="3.8" ry="2.8" fill="url(#tongueGrad)" />
            </>
          )}

          {/* 12. SPEAKING */}
          {emotion === "speaking" && (
            <>
              <ellipse cx="35" cy="43" rx="6" ry="7.5" fill="#1E1B4B" />
              <circle cx="33" cy="40" r="2.5" fill="#FFFFFF" />

              <ellipse cx="65" cy="43" rx="6" ry="7.5" fill="#1E1B4B" />
              <circle cx="63" cy="40" r="2.5" fill="#FFFFFF" />

              <path d="M28 31 Q35 27 42 31" stroke="#854D0E" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M58 31 Q65 27 72 31" stroke="#854D0E" strokeWidth="2.5" strokeLinecap="round" fill="none" />

              <g className="anim-talk-mouth">
                <path
                  d="M34 62 Q50 82 66 62 Q50 66 34 62 Z"
                  fill="url(#mouthGrad)"
                  stroke="#78350F"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <ellipse cx="50" cy="71" rx="7" ry="4" fill="url(#tongueGrad)" />
                <path d="M38 63 Q50 67 62 63" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
              </g>
            </>
          )}

          {/* 13. APOLOGETIC */}
          {emotion === "apologetic" && (
            <>
              <path d="M29 46 Q35 40 41 46" stroke="#1E1B4B" strokeWidth="3.2" strokeLinecap="round" fill="none" />
              <circle cx="35" cy="47" r="1.5" fill="#1E1B4B" />

              <path d="M59 46 Q65 40 71 46" stroke="#1E1B4B" strokeWidth="3.2" strokeLinecap="round" fill="none" />
              <circle cx="65" cy="47" r="1.5" fill="#1E1B4B" />

              <path d="M27 34 Q35 37 43 33" stroke="#854D0E" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M57 33 Q65 37 73 34" stroke="#854D0E" strokeWidth="2.5" strokeLinecap="round" fill="none" />

              <path d="M37 66 Q50 74 63 66" stroke="#78350F" strokeWidth="3" strokeLinecap="round" fill="none" />
            </>
          )}
        </g>
      </svg>
    </div>
  );
}
