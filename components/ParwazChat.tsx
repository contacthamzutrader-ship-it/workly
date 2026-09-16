"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { MessageSquare, X, RotateCcw, Send, Sparkles, ChevronDown, ExternalLink } from "lucide-react";
import ParwazEmojiAvatar, { EmojiEmotion } from "@/components/ParwazEmojiAvatar";
import { DEFAULT_SUGGESTIONS } from "@/lib/parwazChatKnowledge";

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  emotion?: EmojiEmotion;
  quickAction?: { label: string; href: string };
  suggestedQuestions?: string[];
  isOutOfScope?: boolean;
}

const SESSION_STORAGE_KEY = "parwaz_client_session_chat";

const INITIAL_MESSAGE: ChatMessage = {
  id: "msg_welcome",
  sender: "assistant",
  text: "Hello! 😊 I'm **ParwazChat**, your official Parwaz.pk assistant!\n\nI can help you with anything regarding our platform: posting tasks, taking the AI skill interview, getting verified badges, checking trust scores, and managing milestone payments.\n\nHow can I help you today?",
  timestamp: "Just now",
  emotion: "laugh",
  suggestedQuestions: DEFAULT_SUGGESTIONS,
};

// 10-Second Mood Antics Cycle ("her 10 second baad wo mood change karay aur cute herkatain bhi karay")
const MOOD_ANTICS: { emotion: EmojiEmotion; particle: string }[] = [
  { emotion: "laugh", particle: "😆" },
  { emotion: "dance", particle: "🎵" },
  { emotion: "cheeky", particle: "😋" },
  { emotion: "love", particle: "💖" },
  { emotion: "sparkle", particle: "⭐" },
  { emotion: "giggle", particle: "🌸" },
  { emotion: "curious", particle: "💡" },
  { emotion: "smile", particle: "✨" },
  { emotion: "wink", particle: "💫" },
];

export default function ParwazChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<EmojiEmotion>("smile");
  const [floatingParticle, setFloatingParticle] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Initialize fresh, isolated chat session for each client
  useEffect(() => {
    // Purge any old global localStorage so past chats from other clients never show up
    try {
      localStorage.removeItem("parwaz_chat_history");
      localStorage.removeItem("parwaz_chat_history_v1");
      localStorage.removeItem("parwaz_chat_history_v2");
    } catch {
      // Ignore storage errors
    }

    // Load only this specific client's current session
    try {
      const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
    } catch {
      // Ignore storage errors
    }

    // New client gets a pristine, fresh conversation!
    setMessages([
      {
        ...INITIAL_MESSAGE,
        id: `msg_welcome_${Date.now()}`,
      },
    ]);
  }, []);

  // Save only to current browser session (isolated per client tab)
  useEffect(() => {
    if (messages.length > 0) {
      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(messages));
      } catch {
        // Ignore storage errors
      }
    }
  }, [messages]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isLoading]);

  // EXACTLY EVERY 10 SECONDS: Switch Mood & Do Cute Antics Silently!
  useEffect(() => {
    if (isLoading) return;

    let anticIndex = 0;

    const interval = setInterval(() => {
      if (!isLoading) {
        anticIndex = (anticIndex + 1) % MOOD_ANTICS.length;
        const currentAntic = MOOD_ANTICS[anticIndex];

        setCurrentEmotion(currentAntic.emotion);
        setFloatingParticle(currentAntic.particle);

        // Particle floats and fades after 2.6 seconds
        setTimeout(() => {
          setFloatingParticle(null);
        }, 2600);
      }
    }, 10000); // 10,000ms = Exactly 10 Seconds

    return () => clearInterval(interval);
  }, [isLoading]);

  const handleToggle = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        setCurrentEmotion("laugh");
        setTimeout(() => inputRef.current?.focus(), 250);
      } else {
        setCurrentEmotion("smile");
      }
      return next;
    });
  };

  const handleResetChat = () => {
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // Ignore
    }
    setMessages([
      {
        ...INITIAL_MESSAGE,
        id: `msg_welcome_${Date.now()}`,
        timestamp: "Just now",
        emotion: "laugh",
      },
    ]);
    setCurrentEmotion("laugh");
  };

  const handleSend = async (customText?: string) => {
    const textToSend = (customText || input).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);
    setCurrentEmotion("thinking");

    try {
      const res = await fetch("/api/parwaz-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.sender,
            content: m.text,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await res.json();
      const botEmotion: EmojiEmotion = data.emotion || (data.isOutOfScope ? "apologetic" : "speaking");
      setCurrentEmotion(botEmotion);

      const assistantMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: "assistant",
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        emotion: botEmotion,
        quickAction: data.quickAction,
        suggestedQuestions: data.suggestedQuestions,
        isOutOfScope: data.isOutOfScope,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("ParwazChat query error:", err);
      const fallbackMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: "assistant",
        text: "I am ParwazChat, your dedicated Parwaz.pk assistant. You can ask me how to post a task, take the AI skill interview, or withdraw earnings to your wallet!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        emotion: "smile",
        suggestedQuestions: DEFAULT_SUGGESTIONS,
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      setCurrentEmotion("smile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Helper to parse simple markdown formatting (bold, links, lists)
  const renderFormattedText = (content: string) => {
    const lines = content.split("\n");
    return (
      <div className="space-y-1.5 text-sm leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1" />;

          if (line.startsWith("### ")) {
            return (
              <h4 key={idx} className="font-bold text-ink-900 text-sm mt-1 mb-0.5 text-brand-700">
                {line.replace("### ", "")}
              </h4>
            );
          }

          const isBullet = line.startsWith("• ") || line.startsWith("- ");
          const cleanLine = isBullet ? line.substring(2) : line;
          const parts = parseMarkdownTokens(cleanLine);

          if (isBullet) {
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1">
                <span className="text-brand-600 font-bold text-xs mt-0.5">•</span>
                <span className="flex-1">{parts}</span>
              </div>
            );
          }

          return <p key={idx}>{parts}</p>;
        })}
      </div>
    );
  };

  const parseMarkdownTokens = (text: string) => {
    const regex = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
    const tokens = text.split(regex);

    return tokens.map((token, i) => {
      if (token.startsWith("**") && token.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-ink-900">
            {token.slice(2, -2)}
          </strong>
        );
      }
      if (token.startsWith("[") && token.includes("](") && token.endsWith(")")) {
        const match = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (match) {
          const [, label, href] = match;
          const isExternal = href.startsWith("http");
          return (
            <Link
              key={i}
              href={href}
              target={isExternal ? "_blank" : undefined}
              className="inline-flex items-center gap-0.5 font-semibold text-brand-600 hover:text-brand-800 underline underline-offset-2 decoration-brand-300 transition-colors"
            >
              {label}
              {isExternal && <ExternalLink className="w-3 h-3 ml-0.5 inline" />}
            </Link>
          );
        }
      }
      return token;
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-auto">
      {/* FLOATING ANTIC PARTICLE EFFECT */}
      {floatingParticle && (
        <div className="absolute -top-10 right-8 pointer-events-none animate-bounce select-none text-2xl drop-shadow-md z-60 transition-opacity">
          {floatingParticle}
        </div>
      )}

      {/* CHAT WINDOW */}
      {isOpen && (
        <div
          className="mb-4 w-[380px] sm:w-[420px] max-w-[calc(100vw-32px)] h-[580px] max-h-[calc(100vh-100px)] rounded-3xl border border-emerald-100 bg-white/95 backdrop-blur-md shadow-2xl flex flex-col overflow-hidden animate-slide-up transition-all duration-300"
          style={{
            boxShadow: "0 20px 45px -10px rgba(0, 80, 31, 0.22), 0 0 0 1px rgba(34, 139, 34, 0.12)",
          }}
        >
          {/* HEADER */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-deep-700 via-deep-600 to-forest-600 text-white select-none">
            <div className="flex items-center gap-2.5">
              <ParwazEmojiAvatar emotion={currentEmotion} size="sm" />
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-white tracking-wide">ParwazChat</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/15 text-emerald-200 border border-white/10">
                    Online
                  </span>
                </div>
                <p className="text-[11px] text-emerald-100/90 font-medium">
                  Official Parwaz.pk Guide
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                title="Start new conversation"
                className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/15 transition-colors"
                aria-label="Start new conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={handleToggle}
                title="Minimize chat"
                className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/15 transition-colors"
                aria-label="Close ParwazChat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* SCOPE NOTICE BANNER */}
          <div className="px-3.5 py-1.5 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2 text-[11px] text-emerald-800 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">
              Ask about tasks, hiring, skill tests, badges & payments!
            </span>
          </div>

          {/* MESSAGES FEED */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
            {messages.map((msg) => {
              const isAssistant = msg.sender === "assistant";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${isAssistant ? "items-start" : "justify-end items-end"}`}
                >
                  {isAssistant && (
                    <div className="shrink-0 mt-0.5">
                      <ParwazEmojiAvatar emotion={msg.emotion || currentEmotion} size="xs" />
                    </div>
                  )}

                  <div className={`max-w-[84%] flex flex-col ${isAssistant ? "items-start" : "items-end"}`}>
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl shadow-sm text-sm ${
                        isAssistant
                          ? "bg-white border border-emerald-100/80 text-ink-800 rounded-tl-sm"
                          : "bg-gradient-to-r from-deep-600 to-forest-600 text-white rounded-tr-sm"
                      }`}
                    >
                      {renderFormattedText(msg.text)}

                      {/* Quick Action Button if provided */}
                      {msg.quickAction && (
                        <div className="mt-2.5 pt-2 border-t border-emerald-100">
                          <Link
                            href={msg.quickAction.href}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-transform active:scale-95"
                          >
                            <span>{msg.quickAction.label}</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      )}
                    </div>

                    <span className="text-[10px] text-ink-400 mt-1 px-1">{msg.timestamp}</span>

                    {/* Suggested Question Chips */}
                    {isAssistant && msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5 max-w-full">
                        {msg.suggestedQuestions.map((q, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSend(q)}
                            disabled={isLoading}
                            className="text-left text-xs bg-white hover:bg-emerald-50 text-emerald-800 hover:text-emerald-950 border border-emerald-200 hover:border-emerald-300 px-2.5 py-1 rounded-full transition-all shadow-2xs hover:shadow-xs active:scale-95 font-medium"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* THINKING INDICATOR */}
            {isLoading && (
              <div className="flex items-start gap-2.5">
                <ParwazEmojiAvatar emotion="thinking" size="xs" />
                <div className="px-3.5 py-2.5 bg-white border border-emerald-100 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2 text-xs text-ink-500 font-medium">
                  <span>ParwazChat is thinking</span>
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* INPUT BAR */}
          <div className="p-3 bg-white border-t border-slate-100">
            <div className="relative flex items-center bg-slate-50 border border-slate-200 focus-within:border-emerald-500 focus-within:bg-white rounded-2xl shadow-inner transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  if (e.target.value.length === 1) {
                    setCurrentEmotion("curious");
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about Parwaz.pk..."
                rows={1}
                disabled={isLoading}
                className="w-full resize-none bg-transparent py-2.5 pl-3.5 pr-10 text-xs sm:text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none max-h-24"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className={`absolute right-1.5 p-2 rounded-xl transition-all ${
                  input.trim() && !isLoading
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm active:scale-95"
                    : "text-slate-400 hover:text-slate-500 cursor-not-allowed"
                }`}
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[10px] text-center text-ink-400 mt-1.5 font-medium">
              🔒 ParwazChat assists exclusively with Parwaz.pk platform features & guides.
            </p>
          </div>
        </div>
      )}

      {/* FLOATING LAUNCHER BUTTON */}
      <button
        onClick={handleToggle}
        onMouseEnter={() => {
          setCurrentEmotion("cheeky");
        }}
        className="group relative flex items-center justify-center rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none"
        aria-label={isOpen ? "Close ParwazChat" : "Open ParwazChat"}
      >
        {/* Glow halo */}
        <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-emerald-500 to-forest-600 opacity-60 blur-sm group-hover:opacity-100 transition-opacity animate-pulse-soft" />

        {/* Inner container */}
        <div className="relative flex items-center gap-2 p-1.5 bg-gradient-to-r from-deep-700 to-forest-600 rounded-full border-2 border-white/90 shadow-elevated">
          {/* Animated Avatar - cycles every 10s */}
          <ParwazEmojiAvatar emotion={isOpen ? "happy" : currentEmotion} size="md" />

          {/* Desktop Text Pill */}
          {!isOpen && (
            <div className="hidden sm:flex flex-col text-left pr-3 select-none">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-300 leading-none">
                ParwazChat
              </span>
              <span className="text-[12px] font-bold text-white leading-tight">
                Ask Me Anything!
              </span>
            </div>
          )}

          {/* Close indicator when open */}
          {isOpen && (
            <div className="pr-2">
              <span className="p-1 rounded-full bg-white/20 text-white flex items-center justify-center">
                <ChevronDown className="w-4 h-4" />
              </span>
            </div>
          )}
        </div>
      </button>
    </div>
  );
}
