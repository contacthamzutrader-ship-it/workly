'use client';

import React from 'react';

export default function BackgroundVideoPlaylist() {
  return (
    <div className="fixed inset-0 w-full h-full -z-10 overflow-hidden pointer-events-none select-none bg-[#0a0a0a]">
      {/* Radiant Glowing Ambient Highlights - Ultra Lightweight */}
      <div className="absolute top-0 left-1/4 w-[650px] h-[450px] bg-emerald-600/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[550px] h-[400px] bg-brand/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-[500px] h-[300px] bg-emerald-900/20 blur-[100px] rounded-full pointer-events-none" />
    </div>
  );
}
