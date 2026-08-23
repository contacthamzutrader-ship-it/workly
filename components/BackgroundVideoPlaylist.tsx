'use client';

import React, { useState, useEffect, useRef } from 'react';

const BACKGROUND_VIDEOS = [
  '/videos/128460-741503563_medium.mp4',
  '/videos/136284-764387740_medium.mp4',
  '/videos/199876-911694738_medium.mp4',
  '/videos/27725-365890983_medium.mp4',
  '/videos/6389-191704465_medium.mp4',
  '/videos/6395-191712337_medium.mp4',
  '/videos/891-141277507_medium.mp4',
];

export default function BackgroundVideoPlaylist() {
  const [currentVideoIndex, setCurrentVideoIndex] = useState<number>(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleVideoEnded = () => {
    setCurrentVideoIndex((prev) => (prev + 1) % BACKGROUND_VIDEOS.length);
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {
        // Autoplay policy handled silently
      });
    }
  }, [currentVideoIndex]);

  return (
    <div className="fixed inset-0 w-full h-full -z-10 overflow-hidden pointer-events-none select-none">
      {/* Background Video Element - High Brightness & Zero Blur */}
      <video
        ref={videoRef}
        key={BACKGROUND_VIDEOS[currentVideoIndex]}
        autoPlay
        muted
        playsInline
        onEnded={handleVideoEnded}
        className="w-full h-full object-cover transform scale-100 filter brightness-110 contrast-105 transition-opacity duration-700"
      >
        <source src={BACKGROUND_VIDEOS[currentVideoIndex]} type="video/mp4" />
      </video>

      {/* Lightweight Transparent Overlay - Clear Visibility & High Light */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/20 to-black/45" />
      
      {/* Radiant Glowing Ambient Highlights */}
      <div className="absolute top-0 left-1/4 w-[650px] h-[450px] bg-indigo-500/25 blur-[100px] rounded-full pointer-events-none animate-glow" />
      <div className="absolute top-1/2 right-10 w-[550px] h-[400px] bg-purple-500/20 blur-[120px] rounded-full pointer-events-none animate-glow" />
      <div className="absolute bottom-0 left-1/3 w-[500px] h-[300px] bg-blue-500/15 blur-[90px] rounded-full pointer-events-none animate-glow" />
    </div>
  );
}
