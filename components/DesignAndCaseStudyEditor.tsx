'use client';

import React, { useState, useEffect } from 'react';
import { PracticalTask } from '@/types/interview';
import { 
  FileText, 
  CheckSquare, 
  Sparkles, 
  Clock, 
  Layers, 
  Award, 
  HelpCircle 
} from 'lucide-react';

interface DesignAndCaseStudyEditorProps {
  task: PracticalTask;
  onContentChange: (content: string, wordCount: number) => void;
  initialContent?: string;
}

export default function DesignAndCaseStudyEditor({
  task,
  onContentChange,
  initialContent,
}: DesignAndCaseStudyEditorProps) {
  const [content, setContent] = useState<string>(initialContent || task.starterContent);
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');

  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const chars = content.length;

  useEffect(() => {
    onContentChange(content, words);
  }, [content, words]);

  return (
    <div className="flex flex-col h-full bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
      {/* Header Bar */}
      <div className="bg-zinc-900/90 border-b border-zinc-800 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              {task.title}
              <span className="text-[10px] font-mono uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                Practical Case Study
              </span>
            </h3>
            <p className="text-xs text-zinc-400">Freelance Client Brief & Scenario Deliverable</p>
          </div>
        </div>

        {/* Word Count & Mode Switcher */}
        <div className="flex items-center gap-3">
          <div className="text-xs font-mono bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-xl border border-zinc-700/60 flex items-center gap-2">
            <span>Words: <strong>{words}</strong></span>
            <span className="text-zinc-600">|</span>
            <span>Chars: {chars}</span>
          </div>

          <div className="bg-zinc-800 p-1 rounded-xl border border-zinc-700/60 flex items-center gap-1 text-xs">
            <button
              onClick={() => setActiveTab('write')}
              className={`px-3 py-1 rounded-lg font-medium transition ${activeTab === 'write' ? 'bg-indigo-600 text-white shadow' : 'text-zinc-400'}`}
            >
              Editor
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1 rounded-lg font-medium transition ${activeTab === 'preview' ? 'bg-indigo-600 text-white shadow' : 'text-zinc-400'}`}
            >
              Formatted Preview
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-[420px]">
        {/* Left: Client Brief, Instructions & Rubric (5 cols) */}
        <div className="lg:col-span-5 border-r border-zinc-800 p-5 overflow-y-auto bg-zinc-900/40 text-xs text-zinc-300 space-y-4">
          <div className="p-3.5 rounded-2xl bg-indigo-950/20 border border-indigo-900/40 text-indigo-200">
            <h4 className="font-bold text-white mb-1 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-400" /> Client Scenario
            </h4>
            <p className="text-xs text-zinc-300 font-sans leading-relaxed">{task.scenario}</p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-2 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-emerald-400" /> Instructions & Requirements
            </h4>
            <ul className="space-y-1.5 text-zinc-300">
              {task.instructions.map((ins, idx) => (
                <li key={idx} className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800/80 text-xs">
                  {ins}
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-2 border-t border-zinc-800">
            <h4 className="font-semibold text-white mb-2 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" /> Grading Rubric
            </h4>
            <div className="space-y-1.5">
              {task.rubric.map((r, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px]">
                  <span className="text-zinc-300">{r.criteria}</span>
                  <span className="font-mono text-amber-400 font-bold">{r.weight}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Rich Markdown Workspace (7 cols) */}
        <div className="lg:col-span-7 flex flex-col bg-zinc-950 p-4">
          {activeTab === 'write' ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full flex-1 p-4 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl text-zinc-200 font-mono text-xs leading-relaxed resize-none focus:outline-none focus:border-indigo-500/60 transition selection:bg-indigo-600/40"
              placeholder="Write your professional response, strategy, or analysis here..."
            />
          ) : (
            <div className="w-full flex-1 p-5 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl text-zinc-200 overflow-y-auto font-sans text-xs space-y-3 whitespace-pre-wrap leading-relaxed">
              {content ? (
                <div>{content}</div>
              ) : (
                <div className="text-zinc-500 italic">No content written yet. Switch to Editor tab to start writing.</div>
              )}
            </div>
          )}

          <div className="mt-2 text-[11px] text-zinc-500 flex items-center justify-between">
            <span>Markdown formatting supported (# Headers, - Bullets, **Bold**)</span>
            <span className="text-emerald-400 font-mono">Auto-saved to session state</span>
          </div>
        </div>
      </div>
    </div>
  );
}
