'use client';

import React, { useState, Suspense } from 'react';
import BackgroundVideoPlaylist from '@/components/BackgroundVideoPlaylist';
import { 
  ShieldCheck, 
  Sparkles, 
  Cpu, 
  Terminal, 
  Radio, 
  Lock, 
  Layers, 
  Palette, 
  TrendingUp, 
  Feather, 
  Smartphone, 
  Server, 
  ShieldAlert, 
  Play, 
  ArrowRight,
  UserCheck,
  CheckCircle2,
  Briefcase,
  Zap
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read incoming profile parameters if passed from freelancer platform
  const incomingName = searchParams.get('candidate_name') || searchParams.get('name') || 'Freelance Candidate';
  const incomingEmail = searchParams.get('email') || 'freelancer@platform.com';
  const incomingNiche = searchParams.get('niche') || 'frontend';
  const incomingRedirectUrl = searchParams.get('redirect_url') || 'https://your-freelancing-platform.com/dashboard';

  const [selectedNiche, setSelectedNiche] = useState<string>(incomingNiche);

  const niches = [
    {
      id: 'frontend',
      title: 'Frontend Web Dev',
      desc: 'React, Next.js, TypeScript, state management, LCP & performance',
      icon: Terminal,
      color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30 text-blue-400',
    },
    {
      id: 'backend',
      title: 'Backend & APIs',
      desc: 'Node.js, Python, SQL concurrency, rate limiters, token buckets',
      icon: Server,
      color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400',
    },
    {
      id: 'fullstack',
      title: 'Full Stack Systems',
      desc: 'End-to-end architecture, SSR caching, pre-signed cloud uploads',
      icon: Layers,
      color: 'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400',
    },
    {
      id: 'ai_datascience',
      title: 'AI & Data Science',
      desc: 'RAG pipelines, vector embeddings, cosine similarity, LLM schemas',
      icon: Cpu,
      color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-400',
    },
    {
      id: 'uiux_design',
      title: 'UI/UX & Product',
      desc: 'Design heuristics, WCAG accessibility, token systems, conversion',
      icon: Palette,
      color: 'from-rose-500/20 to-orange-500/20 border-rose-500/30 text-rose-400',
    },
    {
      id: 'digital_marketing',
      title: 'Digital Marketing & SEO',
      desc: 'High-ROI Google/Meta Ads, 301 migrations, CRO funnels, analytics',
      icon: TrendingUp,
      color: 'from-amber-500/20 to-yellow-500/20 border-amber-500/30 text-amber-400',
    },
    {
      id: 'copywriting',
      title: 'Copywriting & Content',
      desc: 'Direct response landing page copy, value props, conversion hooks',
      icon: Feather,
      color: 'from-violet-500/20 to-indigo-500/20 border-violet-500/30 text-violet-400',
    },
    {
      id: 'mobile',
      title: 'Mobile App Dev',
      desc: 'React Native, Flutter, offline mutation queues, deep links',
      icon: Smartphone,
      color: 'from-teal-500/20 to-emerald-500/20 border-teal-500/30 text-teal-400',
    },
  ];

  const handleStartTest = (nicheToUse?: string) => {
    const niche = nicheToUse || selectedNiche;
    const targetUrl = `/interview?niche=${encodeURIComponent(niche)}&candidate_name=${encodeURIComponent(incomingName)}&email=${encodeURIComponent(incomingEmail)}&redirect_url=${encodeURIComponent(incomingRedirectUrl)}`;
    router.push(targetUrl);
  };

  return (
    <div className="min-h-screen text-zinc-100 flex flex-col selection:bg-indigo-600/40 relative overflow-hidden">
      {/* Background Video Playlist looping through the 7 videos in sequence */}
      <BackgroundVideoPlaylist />

      {/* Navigation Header */}
      <nav className="border-b border-zinc-800/80 bg-zinc-950/75 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-white text-base tracking-tight flex items-center gap-2">
                AI Assessment &amp; Proctoring Platform
              </span>
              <p className="text-[11px] text-zinc-400 font-mono">Automated Freelancer Verification &amp; Anti-Cheating Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleStartTest()}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-xs font-bold text-white rounded-xl transition shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Your Test</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-14 relative z-10">
        {/* Hero Title & CTA */}
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          {searchParams.get('candidate_name') ? (
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono backdrop-blur-md shadow-lg shadow-emerald-950/40 animate-in fade-in">
              <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Welcome, <strong className="text-white">{incomingName}</strong>! Your <strong className="text-white">{selectedNiche.toUpperCase()}</strong> Skill Assessment is ready.
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-xs font-mono text-indigo-300 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>AI Proctoring • 30-Minute Calibrated Test • Verified Badges</span>
            </div>
          )}

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            AI Skill Assessment &amp;{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Anti-Cheat Interview
            </span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-300 leading-relaxed max-w-2xl mx-auto drop-shadow">
            Validate your expertise through real-world scenario challenges, live sandbox testing, and an AI voice interview with active anti-cheat proctoring.
          </p>

          {/* Primary Action Button */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => handleStartTest()}
              className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-extrabold text-lg rounded-2xl shadow-2xl shadow-indigo-600/40 hover:shadow-indigo-600/60 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer group"
            >
              <Play className="w-6 h-6 fill-current group-hover:translate-x-0.5 transition-transform" />
              <span>Start Your Test</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <p className="text-xs text-zinc-400 font-mono">
            30-Minute Proctored Session • Camera &amp; Mic Required • Auto-Redirects on Completion
          </p>
        </div>

        {/* 4 Feature Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-zinc-900/70 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-5 space-y-2.5 hover:border-indigo-500/40 transition">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Scenario MCQs</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              10 real-world client scenarios testing practical decision making, performance, and architecture.
            </p>
          </div>

          <div className="bg-zinc-900/70 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-5 space-y-2.5 hover:border-indigo-500/40 transition">
            <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Anti-Cheat Defense</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Tab-switch tracking with instant auto-restart, copy/paste blockers, and AI webcam proctoring.
            </p>
          </div>

          <div className="bg-zinc-900/70 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-5 space-y-2.5 hover:border-indigo-500/40 transition">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Terminal className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Live Code Sandbox</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              In-browser code execution with automated test assertions and domain-specific blueprints.
            </p>
          </div>

          <div className="bg-zinc-900/70 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-5 space-y-2.5 hover:border-indigo-500/40 transition">
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Radio className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Live AI Voice Interview</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Natural female AI voice conducts technical Q&amp;A with speech-to-text evaluation and keyword scoring.
            </p>
          </div>
        </div>

        {/* Integration Architecture Workflow */}
        <section className="bg-zinc-900/70 backdrop-blur-md border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" /> Assessment Workflow
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-2xl space-y-2">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold font-mono flex items-center justify-center text-[11px]">
                1
              </span>
              <h5 className="font-bold text-white">Candidate Intake</h5>
              <p className="text-zinc-400 leading-relaxed">
                Profile and domain details are ingested from your freelancer platform directly into this test engine.
              </p>
            </div>

            <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-2xl space-y-2">
              <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold font-mono flex items-center justify-center text-[11px]">
                2
              </span>
              <h5 className="font-bold text-white">Proctored Assessment</h5>
              <p className="text-zinc-400 leading-relaxed">
                Candidate completes 10 MCQs, 1 practical sandbox challenge, and live AI voice questions under strict proctoring.
              </p>
            </div>

            <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-2xl space-y-2">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold font-mono flex items-center justify-center text-[11px]">
                3
              </span>
              <h5 className="font-bold text-white">Handover &amp; Auto-Redirect</h5>
              <p className="text-zinc-400 leading-relaxed">
                Passed candidates are awarded verified talent badges and automatically redirected back to the platform.
              </p>
            </div>
          </div>
        </section>

        {/* Supported Niches Grid */}
        <section className="space-y-6 pt-2">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl font-bold text-white">Supported Freelancer Niches</h2>
            <p className="text-xs text-zinc-400">
              Click any niche below to launch the calibrated assessment for that specialization.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {niches.map((n) => {
              const Icon = n.icon;
              return (
                <div
                  key={n.id}
                  onClick={() => handleStartTest(n.id)}
                  className={`bg-zinc-900/60 backdrop-blur-sm border rounded-2xl p-4 space-y-2 cursor-pointer transition hover:border-indigo-500 hover:bg-zinc-900/90 hover:scale-[1.02] active:scale-[0.98] ${
                    selectedNiche === n.id
                      ? 'border-indigo-500/80 bg-indigo-950/30 shadow-lg shadow-indigo-600/20'
                      : 'border-zinc-800/80'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg border flex items-center justify-center bg-gradient-to-tr ${n.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-white">{n.title}</h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{n.desc}</p>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md py-6 px-6 text-center text-xs text-zinc-500 font-mono relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 AI Assessment &amp; Anti-Cheating Proctoring Platform for Freelancer Marketplaces.</p>
          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Platform Online</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}
