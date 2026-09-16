"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from "lucide-react";

export interface VideoSlide {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  videoUrl: string;
  actionText?: string;
  actionHref?: string;
}

// Default Video Slides (Easily replaceable with new videos anytime)
export const DEFAULT_VIDEO_SLIDES: VideoSlide[] = [
  {
    id: "slide_1",
    title: "Discover Your Next Big Project",
    subtitle: "Browse high-paying freelance tasks and connect with verified clients across Pakistan.",
    badge: "Marketplace Spotlight",
    videoUrl: "/videos/6389-191704465_medium.mp4",
    actionText: "Browse Tasks",
    actionHref: "/browse",
  },
  {
    id: "slide_2",
    title: "Earn Your Verified Skill Badge",
    subtitle: "Complete our AI-powered 10-question evaluation and stand out to premium clients.",
    badge: "AI Skill Vetting",
    videoUrl: "/videos/6395-191712337_medium.mp4",
    actionText: "Take Skill Interview",
    actionHref: "/interview",
  },
  {
    id: "slide_3",
    title: "Secure Milestone Payments",
    subtitle: "Funds are held in platform custody and released seamlessly to your local wallet.",
    badge: "Protected Earnings",
    videoUrl: "/videos/199876-911694738_medium.mp4",
    actionText: "View Wallet",
    actionHref: "/wallet",
  },
];

interface DashboardVideoSliderProps {
  slides?: VideoSlide[];
}

export default function DashboardVideoSlider({
  slides = DEFAULT_VIDEO_SLIDES,
}: DashboardVideoSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const totalSlides = slides.length;

  // Auto-slide to the left every 10 seconds ("her 10 sec ka baad video ko left side per bej dai")
  useEffect(() => {
    if (totalSlides <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((current) => (current + 1) % totalSlides);
    }, 10000); // 10,000ms = 10 seconds

    return () => clearInterval(timer);
  }, [totalSlides]);

  // Handle video playback on slide change
  useEffect(() => {
    videoRefs.current.forEach((vid, idx) => {
      if (!vid) return;
      if (idx === currentIndex) {
        vid.currentTime = 0;
        vid.play().catch(() => {});
      } else {
        vid.pause();
      }
    });
  }, [currentIndex]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const goToSlide = (idx: number) => {
    setCurrentIndex(idx);
  };

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-ink-100/80 bg-ink-950 shadow-elevated select-none group">
      {/* SLIDES CONTAINER TRACK (Moves horizontally to the left) */}
      <div
        className="flex h-[300px] sm:h-[380px] md:h-[440px] lg:h-[480px] w-full transition-transform duration-700 ease-out"
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
        }}
      >
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            className="relative h-full w-full shrink-0 overflow-hidden bg-ink-900"
          >
            {/* Background Video */}
            <video
              ref={(el) => {
                videoRefs.current[idx] = el;
              }}
              src={slide.videoUrl}
              muted
              loop
              playsInline
              preload="metadata"
              className="h-full w-full object-cover"
            />

            {/* Gradient Overlays for Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/45 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-ink-950/85 via-ink-950/35 to-transparent" />

            {/* Slide Content Overlay */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10 md:p-12 text-white max-w-3xl">
              {slide.badge && (
                <div className="mb-3 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/30 border border-brand-400/50 backdrop-blur-md px-3.5 py-1 text-xs font-bold text-emerald-300 shadow-sm">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                    {slide.badge}
                  </span>
                </div>
              )}

              <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-md">
                {slide.title}
              </h2>

              <p className="mt-2.5 text-sm sm:text-base md:text-lg text-ink-100/90 leading-relaxed drop-shadow line-clamp-2 max-w-2xl">
                {slide.subtitle}
              </p>

              {slide.actionHref && slide.actionText && (
                <div className="mt-5">
                  <Link
                    href={slide.actionHref}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand to-forest px-5 py-3 text-sm font-bold text-white shadow-glow transition-all hover:scale-105 active:scale-95"
                  >
                    <span>{slide.actionText}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* LEFT & RIGHT NAVIGATION ARROWS */}
      {totalSlides > 1 && (
        <>
          <button
            onClick={goToPrev}
            title="Previous video"
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-ink-900/40 hover:bg-ink-900/80 border border-white/10 backdrop-blur-md p-2.5 text-white/80 hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-200 active:scale-90 z-20"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            onClick={goToNext}
            title="Next video"
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-ink-900/40 hover:bg-ink-900/80 border border-white/10 backdrop-blur-md p-2.5 text-white/80 hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-200 active:scale-90 z-20"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* BOTTOM DOTS NAVIGATION PILLS */}
      {totalSlides > 1 && (
        <div className="absolute bottom-5 right-8 flex items-center gap-2.5 z-20">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? "w-9 bg-emerald-400 shadow-glow"
                  : "w-2.5 bg-white/40 hover:bg-white/70"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
