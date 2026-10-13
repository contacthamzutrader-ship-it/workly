"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Bot,
  ChevronDown,
  ExternalLink,
  MessageSquare,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { DEFAULT_SUGGESTIONS } from "@/lib/parwazChatKnowledge";

interface CopilotMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  quickAction?: { label: string; href: string };
  suggestedQuestions?: string[];
}

const STORAGE_KEY = "workly_copilot_session_v2";

const INITIAL_MESSAGE: CopilotMessage = {
  id: "msg_welcome",
  sender: "assistant",
  text: "Hello! I am **Workly AI Copilot**, your enterprise marketplace intelligence assistant.\n\nI can assist you with:\n- **Posting projects** and estimating fair budgets in PKR\n- **Safepay Escrow protection** & milestone payments\n- **Submitting deliverables** and double-blind reviews\n- **Withdrawing earnings** via Raast, Bank IBAN, or JazzCash\n\nHow can I help you today?",
  timestamp: "Just now",
  suggestedQuestions: [
    "How does Safepay Escrow protect my funds?",
    "How do I post a project and receive offers?",
    "What are the withdrawal methods in Pakistan?",
    "How do double-blind client reviews work?",
  ],
};

export default function WorklyCopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
    } catch {
      // fallback
    }
    setMessages([INITIAL_MESSAGE]);
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      } catch {
        // quota exceeded fallback
      }
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  const handleSend = async (customText?: string) => {
    const userText = (customText || input).trim();
    if (!userText || isLoading) return;

    const userMessage: CopilotMessage = {
      id: `usr_${Date.now()}`,
      sender: "user",
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/parwaz-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      });

      if (!res.ok) throw new Error("Network response was not ok");
      const data = await res.json();

      const botMessage: CopilotMessage = {
        id: `bot_${Date.now()}`,
        sender: "assistant",
        text: data.reply || "I am processing platform updates. Please check back shortly.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        quickAction: data.quickAction,
        suggestedQuestions: data.suggestedQuestions,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch {
      const errorMessage: CopilotMessage = {
        id: `err_${Date.now()}`,
        sender: "assistant",
        text: "I'm temporarily experiencing connectivity limits. For urgent help, please visit the [Help Centre](/help) or post your task directly.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        quickAction: { label: "Go to Help Centre", href: "/help" },
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([INITIAL_MESSAGE]);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const renderFormattedText = (raw: string) => {
    const parts = raw.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/g);
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={idx} className="font-extrabold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
      if (linkMatch) {
        return (
          <Link
            key={idx}
            href={linkMatch[2]}
            className="font-bold text-emerald-700 underline underline-offset-2 hover:text-emerald-900"
          >
            {linkMatch[1]}
          </Link>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 print:hidden">
      {/* Floating Launcher Pill */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-3 rounded-full border border-emerald-500/30 bg-slate-950 px-4 py-3 text-white shadow-2xl transition-all duration-300 hover:scale-105 hover:border-emerald-400 hover:shadow-emerald-950/40"
          aria-label="Open Workly AI Copilot"
        >
          <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-md">
            <Sparkles className="h-4 w-4 text-white animate-pulse" />
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-950 bg-emerald-400" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5 text-xs font-black tracking-wide text-white">
              <span>Workly AI</span>
              <span className="rounded bg-emerald-500/20 px-1 py-0.2 text-[9px] font-extrabold text-emerald-400">
                PRO
              </span>
            </div>
            <div className="text-[10px] font-semibold text-slate-400">
              Escrow &amp; Matching Copilot
            </div>
          </div>
        </button>
      )}

      {/* Modern Industrial Copilot Drawer */}
      {isOpen && (
        <div className="flex w-[92vw] max-w-[420px] flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl transition-all animate-fade-up sm:w-[420px]">
          {/* Header */}
          <div className="relative flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-4 py-3.5 text-white">
            <div className="flex items-center gap-3">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 shadow-sm">
                <Bot className="h-4 w-4 text-white" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-slate-950 bg-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-white">Workly AI Copilot</h3>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
                    <ShieldCheck className="h-2.5 w-2.5" /> Escrow Safe
                  </span>
                </div>
                <p className="text-[10px] font-medium text-slate-400">
                  Instant scoping, rates &amp; milestone guidance
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button
                onClick={handleReset}
                title="Restart conversation"
                className="rounded-lg p-1.5 hover:bg-white/10 hover:text-white transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close Copilot"
                className="rounded-lg p-1.5 hover:bg-white/10 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Telemetry Status Bar */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-1.5 text-[10px] font-semibold text-slate-600">
            <span className="flex items-center gap-1 text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
              Active Telemetry · Safepay Online
            </span>
            <span>Avg Response: &lt; 1s</span>
          </div>

          {/* Messages Container */}
          <div className="flex h-[380px] flex-col gap-3.5 overflow-y-auto p-4 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col gap-1.5 ${
                  m.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                    m.sender === "user"
                      ? "rounded-tr-none bg-emerald-600 text-white"
                      : "rounded-tl-none border border-slate-200/80 bg-slate-50 text-slate-800"
                  }`}
                >
                  <div className="whitespace-pre-line">{renderFormattedText(m.text)}</div>

                  {m.quickAction && (
                    <div className="mt-2.5 border-t border-slate-200/60 pt-2">
                      <Link
                        href={m.quickAction.href}
                        onClick={() => setIsOpen(false)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-extrabold text-white transition hover:bg-emerald-700"
                      >
                        {m.quickAction.label} <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  )}
                </div>

                {m.suggestedQuestions && m.suggestedQuestions.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1.5 max-w-[95%]">
                    {m.suggestedQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(q)}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}

                <span className="text-[9px] font-medium text-slate-400">{m.timestamp}</span>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2 text-slate-500">
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-bounce" />
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]" />
                </span>
                <span className="text-[10px] font-semibold text-slate-500">
                  Workly AI is evaluating answer...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Bar */}
          <div className="border-t border-slate-100 bg-white p-2.5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-1 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/20 transition"
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
                placeholder="Ask about Safepay, pricing, or posting jobs..."
                className="flex-1 resize-none bg-transparent px-2.5 py-1.5 text-xs font-semibold text-slate-800 placeholder:font-normal placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600"
                aria-label="Send message"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
            <div className="mt-1 flex items-center justify-between px-1 text-[9px] font-semibold text-slate-400">
              <span>Supports English &amp; Roman Urdu</span>
              <span>Encrypted Session</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
