'use client';

import React, { useState, useEffect } from 'react';
import { NicheCategory, ExperienceLevel } from '@/types/interview';
import { 
  Briefcase, 
  Send, 
  Sparkles, 
  Code, 
  CheckCircle, 
  Terminal, 
  ExternalLink, 
  RefreshCw, 
  Layers, 
  DollarSign, 
  ShieldCheck, 
  UserPlus 
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PresetCandidate {
  name: string;
  email: string;
  niche: NicheCategory;
  nicheTitle: string;
  skills: string[];
  experienceLevel: ExperienceLevel;
  experienceYears: number;
  hourlyRate: number;
  jobTitle: string;
}

const PRESET_PROFILES: PresetCandidate[] = [
  {
    name: 'Sarah Jenkins',
    email: 'sarah.dev@example.com',
    niche: 'frontend',
    nicheTitle: 'Frontend Web Specialist (React / Next.js)',
    skills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'],
    experienceLevel: 'senior',
    experienceYears: 4,
    hourlyRate: 55,
    jobTitle: 'Senior React / Next.js Web Engineer',
  },
  {
    name: 'David Chen',
    email: 'david.chen@example.com',
    niche: 'backend',
    nicheTitle: 'Backend & Distributed Systems Engineer',
    skills: ['Node.js', 'PostgreSQL', 'Redis', 'Docker', 'REST APIs'],
    experienceLevel: 'senior',
    experienceYears: 5,
    hourlyRate: 65,
    jobTitle: 'Scalable Microservices Backend Developer',
  },
  {
    name: 'Elena Rostova',
    email: 'elena.ux@example.com',
    niche: 'uiux_design',
    nicheTitle: 'UI/UX & Product Design Specialist',
    skills: ['Figma', 'Design Systems', 'User Research', 'Wireframing'],
    experienceLevel: 'mid',
    experienceYears: 3,
    hourlyRate: 45,
    jobTitle: 'Lead Product & Mobile App Designer',
  },
  {
    name: 'Marcus Vance',
    email: 'marcus.ads@example.com',
    niche: 'digital_marketing',
    nicheTitle: 'Paid Media & Growth Strategist',
    skills: ['Google Ads', 'Meta Ads', 'SEO Auditing', 'CRO', 'GA4'],
    experienceLevel: 'mid',
    experienceYears: 3,
    hourlyRate: 40,
    jobTitle: 'PPC & Performance Marketing Specialist',
  },
  {
    name: 'Sophia Patel',
    email: 'sophia.ai@example.com',
    niche: 'ai_datascience',
    nicheTitle: 'AI Solutions & LLM Engineer',
    skills: ['Python', 'OpenAI APIs', 'LangChain', 'Vector Databases', 'RAG'],
    experienceLevel: 'senior',
    experienceYears: 4,
    hourlyRate: 75,
    jobTitle: 'Generative AI & LLM Systems Architect',
  },
];

export default function FreelancerPlatformDemo() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'simulator' | 'api_docs' | 'webhooks'>('simulator');
  const [loading, setLoading] = useState<boolean>(false);

  // Form State
  const [name, setName] = useState<string>(PRESET_PROFILES[0].name);
  const [email, setEmail] = useState<string>(PRESET_PROFILES[0].email);
  const [niche, setNiche] = useState<NicheCategory>(PRESET_PROFILES[0].niche);
  const [nicheTitle, setNicheTitle] = useState<string>(PRESET_PROFILES[0].nicheTitle);
  const [skills, setSkills] = useState<string>(PRESET_PROFILES[0].skills.join(', '));
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(PRESET_PROFILES[0].experienceLevel);
  const [experienceYears, setExperienceYears] = useState<number>(PRESET_PROFILES[0].experienceYears);
  const [hourlyRate, setHourlyRate] = useState<number>(PRESET_PROFILES[0].hourlyRate);
  const [jobTitle, setJobTitle] = useState<string>(PRESET_PROFILES[0].jobTitle);
  const [webhookUrl, setWebhookUrl] = useState<string>('/api/sessions/webhook');

  // Webhook inspector
  const [recentWebhooks, setRecentWebhooks] = useState<any[]>([]);
  const [loadingWebhooks, setLoadingWebhooks] = useState<boolean>(false);

  const applyPreset = (preset: PresetCandidate) => {
    setName(preset.name);
    setEmail(preset.email);
    setNiche(preset.niche);
    setNicheTitle(preset.nicheTitle);
    setSkills(preset.skills.join(', '));
    setExperienceLevel(preset.experienceLevel);
    setExperienceYears(preset.experienceYears);
    setHourlyRate(preset.hourlyRate);
    setJobTitle(preset.jobTitle);
  };

  const handleSubmitToInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/sessions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          niche,
          nicheTitle,
          skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
          experienceLevel,
          experienceYears,
          hourlyRate,
          jobTitle,
          sourcePlatform: 'Freelance Marketplace (Simulated)',
          callbackWebhookUrl: webhookUrl,
        }),
      });

      const data = await response.json();

      if (data.success && data.interviewUrl) {
        router.push(data.interviewUrl);
      } else {
        alert(data.error || 'Failed to initialize session');
      }
    } catch (err: any) {
      alert('Error launching interview: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchWebhooks = async () => {
    setLoadingWebhooks(true);
    try {
      const res = await fetch('/api/sessions/webhook');
      const data = await res.json();
      setRecentWebhooks(data.recentWebhooks || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingWebhooks(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'webhooks') {
      fetchWebhooks();
    }
  }, [activeTab]);

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
      {/* Tab Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-5 mb-8">
        <div>
          <span className="text-xs font-mono font-semibold uppercase text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            External Platform Connector
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-2">
            Freelancer Platform Submission Simulator
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Simulate a candidate submitting their profile or job application on Upwork, Fiverr, or your custom platform.
          </p>
        </div>

        <div className="bg-zinc-950 p-1 rounded-2xl border border-zinc-800 flex items-center gap-1 text-xs">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-4 py-2 rounded-xl font-medium transition ${activeTab === 'simulator' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
          >
            Form Simulator
          </button>
          <button
            onClick={() => setActiveTab('api_docs')}
            className={`px-4 py-2 rounded-xl font-medium transition ${activeTab === 'api_docs' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
          >
            API & Webhooks
          </button>
          <button
            onClick={() => setActiveTab('webhooks')}
            className={`px-4 py-2 rounded-xl font-medium transition ${activeTab === 'webhooks' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
          >
            Live Logs
          </button>
        </div>
      </div>

      {activeTab === 'simulator' && (
        <div className="space-y-6">
          {/* Quick Presets Carousel */}
          <div>
            <label className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider block mb-2.5">
              ⚡ Quick 1-Click Candidate Profiles
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {PRESET_PROFILES.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    name === p.name
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                  }`}
                >
                  <p className="text-xs font-bold truncate text-white">{p.name}</p>
                  <p className="text-[11px] text-indigo-400 truncate mt-0.5">{p.nicheTitle.split('(')[0]}</p>
                  <p className="text-[10px] text-zinc-500 font-mono mt-1">${p.hourlyRate}/hr • {p.experienceYears}y exp</p>
                </button>
              ))}
            </div>
          </div>

          {/* Submission Form */}
          <form onSubmit={handleSubmitToInterview} className="space-y-5 bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1.5">Candidate Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1.5">Domain Niche</label>
                <select
                  value={niche}
                  onChange={(e) => {
                    const newNiche = e.target.value as NicheCategory;
                    setNiche(newNiche);
                  }}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="frontend">Frontend Web Dev (React / Next.js)</option>
                  <option value="backend">Backend Engineering (Node / Python / SQL)</option>
                  <option value="fullstack">Fullstack Web (Next.js / MERN)</option>
                  <option value="mobile">Mobile Apps (React Native / Flutter)</option>
                  <option value="ai_datascience">AI Engineering & Data Science</option>
                  <option value="uiux_design">UI/UX & Product Design</option>
                  <option value="digital_marketing">Digital Marketing & Paid Ads</option>
                  <option value="copywriting">Copywriting & Content Strategy</option>
                  <option value="devops">DevOps & Cloud Infrastructure</option>
                  <option value="qa_cybersecurity">QA & Cybersecurity Testing</option>
                  <option value="custom">Custom / Specialized Skillset</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1.5">Experience Level</label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="junior">Junior (0-2 years)</option>
                  <option value="mid">Mid-Level (2-4 years)</option>
                  <option value="senior">Senior (5+ years)</option>
                  <option value="expert">Expert / Architect</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1.5">Target Hourly Rate ($/hr)</label>
                <input
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1.5">Skills Tag List (comma-separated)</label>
              <input
                type="text"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                placeholder="React, TypeScript, GraphQL..."
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1.5">Webhook Callback URL (for automatic result dispatch)</label>
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-300 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Launch Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/30 transition flex items-center justify-center gap-2 text-sm sm:text-base group disabled:opacity-50"
              >
                <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                <span>{loading ? 'Generating Assessment & Launching...' : 'Submit Profile & Launch AI Assessment'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'api_docs' && (
        <div className="space-y-5 text-xs text-zinc-300 font-mono">
          <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 space-y-3">
            <h4 className="font-bold text-white font-sans text-sm flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" /> External Platform API Integration
            </h4>
            <p className="text-zinc-400 font-sans">
              To connect your live freelancer platform, trigger a <code>POST /api/sessions/create</code> request when a user submits their profile, and redirect them to the returned <code>interviewUrl</code>.
            </p>

            <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 overflow-x-auto">
              <pre className="text-emerald-300 text-[11px]">
{`// 1. Trigger from your Freelancer Platform (Node.js / Python / PHP)
const res = await fetch("https://your-domain.com/api/sessions/create", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Ali Khan",
    email: "ali@example.com",
    niche: "frontend",
    skills: ["React", "Next.js", "TypeScript"],
    experienceLevel: "senior",
    callbackWebhookUrl: "https://your-platform.com/webhooks/interview-result"
  })
});

const data = await res.json();
// 2. Redirect user to test room:
window.location.href = data.interviewUrl;`}
              </pre>
            </div>
          </div>

          <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 space-y-3">
            <h4 className="font-bold text-white font-sans text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" /> Webhook Payload Schema
            </h4>
            <p className="text-zinc-400 font-sans">
              When the candidate finishes, the AI grades the assessment, runs proctoring analysis, and sends this webhook:
            </p>

            <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 overflow-x-auto">
              <pre className="text-indigo-300 text-[11px]">
{`{
  "event": "interview.completed",
  "sessionId": "SES_1723908_XYZ",
  "candidate": {
    "name": "Sarah Jenkins",
    "email": "sarah.dev@example.com",
    "niche": "Frontend Web Specialist"
  },
  "evaluation": {
    "overallScorePercentage": 92,
    "grade": "A+",
    "isPassed": true,
    "integrityScorePercentage": 98,
    "integrityVerdict": "Verified Clean",
    "freelancerBadge": "Top 5% Talent",
    "sectionScores": {
      "mcq": { "percentage": 90 },
      "practical": { "percentage": 95 },
      "aiInterview": { "percentage": 90 }
    }
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'webhooks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-white text-sm">Real-time Webhook Receiver Log</h4>
            <button
              onClick={fetchWebhooks}
              disabled={loadingWebhooks}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-xl transition border border-zinc-700 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingWebhooks ? 'animate-spin' : ''}`} />
              <span>Refresh Logs</span>
            </button>
          </div>

          {recentWebhooks.length === 0 ? (
            <div className="bg-zinc-950 p-8 rounded-2xl border border-zinc-800 text-center text-zinc-500 text-xs space-y-2">
              <Terminal className="w-8 h-8 mx-auto text-zinc-600" />
              <p>No webhooks recorded yet.</p>
              <p className="text-zinc-600">Launch a test, complete all 3 rounds, and submit to see live webhook dispatch here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentWebhooks.map((wh, idx) => (
                <div key={idx} className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-xs font-mono">
                  <div className="flex items-center justify-between text-zinc-400 mb-2 border-b border-zinc-800/80 pb-2">
                    <span className="text-emerald-400 font-bold">200 OK • {wh.payload?.event}</span>
                    <span>{wh.receivedAt}</span>
                  </div>
                  <pre className="text-zinc-300 overflow-x-auto text-[11px]">
                    {JSON.stringify(wh.payload, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
