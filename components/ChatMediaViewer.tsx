"use client";

import { useState } from "react";
import {
  FileText,
  Download,
  Eye,
  Film,
  Music,
  ExternalLink,
  X,
  File,
} from "lucide-react";
import { formatFileSize } from "@/lib/fileHelper";
import type { ChatAttachment } from "@/lib/chat";

interface ChatMediaViewerProps {
  attachments: ChatAttachment[];
  isMine?: boolean;
}

export default function ChatMediaViewer({ attachments, isMine }: ChatMediaViewerProps) {
  const [activePreviewUrl, setActivePreviewUrl] = useState<string | null>(null);

  if (!attachments || attachments.length === 0) return null;

  return (
    <>
      <div className="mt-2 space-y-2">
        {attachments.map((att, idx) => {
          // 1. Image
          if (att.type === "image") {
            return (
              <div key={idx} className="group relative overflow-hidden rounded-xl border border-black/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={att.url}
                  alt={att.name}
                  className="max-h-64 w-full cursor-pointer object-cover transition duration-200 group-hover:scale-[1.02]"
                  onClick={() => setActivePreviewUrl(att.url)}
                />
                <div className="absolute bottom-0 inset-x-0 flex items-center justify-between bg-black/60 px-3 py-1.5 text-white backdrop-blur-xs">
                  <span className="truncate text-[11px] font-medium">{att.name}</span>
                  <div className="flex items-center gap-2">
                    {att.size && <span className="text-[10px] text-white/70">{formatFileSize(att.size)}</span>}
                    <button
                      type="button"
                      onClick={() => setActivePreviewUrl(att.url)}
                      className="rounded p-0.5 hover:bg-white/20"
                      title="View full image"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <a
                      href={att.url}
                      download={att.name}
                      className="rounded p-0.5 hover:bg-white/20"
                      title="Download image"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          }

          // 2. Video
          if (att.type === "video") {
            return (
              <div key={idx} className="overflow-hidden rounded-xl border border-black/10 bg-black/5">
                <div className="flex items-center gap-1.5 bg-black/70 px-3 py-1 text-xs text-white">
                  <Film className="h-3.5 w-3.5" />
                  <span className="truncate text-[11px] font-bold">{att.name}</span>
                  {att.size && <span className="ml-auto text-[10px] text-white/60">{formatFileSize(att.size)}</span>}
                </div>
                <video
                  controls
                  preload="metadata"
                  className="max-h-72 w-full bg-black rounded-b-xl"
                  src={att.url}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            );
          }

          // 3. Audio
          if (att.type === "audio") {
            return (
              <div
                key={idx}
                className={`rounded-xl border p-2.5 ${
                  isMine ? "border-white/20 bg-white/10" : "border-ink-100 bg-canvas"
                }`}
              >
                <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold">
                  <Music className="h-3.5 w-3.5" />
                  <span className="truncate text-[11px]">{att.name}</span>
                </div>
                <audio controls className="h-8 w-full" src={att.url} />
              </div>
            );
          }

          // 4. PDF & Documents & Other Files
          return (
            <div
              key={idx}
              className={`flex items-center justify-between gap-3 rounded-xl border p-2.5 transition ${
                isMine
                  ? "border-white/20 bg-white/10 text-white"
                  : "border-ink-100 bg-white text-ink shadow-soft hover:border-brand/30"
              }`}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                    isMine ? "bg-white/20 text-white" : "bg-brand-50 text-brand"
                  }`}
                >
                  {att.type === "pdf" ? <FileText className="h-5 w-5" /> : <File className="h-5 w-5" />}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold leading-tight">{att.name}</p>
                  <span className={`text-[10px] ${isMine ? "text-white/70" : "text-ink-400"}`}>
                    {att.type.toUpperCase()} • {formatFileSize(att.size)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <a
                  href={att.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`rounded-lg p-1.5 transition ${
                    isMine ? "hover:bg-white/20 text-white" : "hover:bg-ink-100 text-ink-600"
                  }`}
                  title="Open file"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <a
                  href={att.url}
                  download={att.name}
                  className={`rounded-lg p-1.5 transition ${
                    isMine ? "hover:bg-white/20 text-white" : "hover:bg-ink-100 text-ink-600"
                  }`}
                  title="Download file"
                >
                  <Download className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full-Screen Image Lightbox Modal */}
      {activePreviewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setActivePreviewUrl(null)}
        >
          <button
            type="button"
            onClick={() => setActivePreviewUrl(null)}
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
            aria-label="Close image preview"
          >
            <X className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activePreviewUrl}
            alt="Expanded preview"
            className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
