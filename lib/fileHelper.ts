/**
 * Media and File Attachment Helpers
 * Handles conversion to data URLs, format detection, and friendly size formatting.
 */

export interface AttachmentItem {
  id: string;
  name: string;
  url: string;
  type: "image" | "video" | "pdf" | "document" | "audio" | "file";
  mimeType: string;
  size: number;
}

export function detectFileType(file: File): AttachmentItem["type"] {
  const mime = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  if (mime.startsWith("image/") || /\.(png|jpe?g|webp|gif|svg)$/i.test(name)) return "image";
  if (mime.startsWith("video/") || /\.(mp4|webm|mov|mkv)$/i.test(name)) return "video";
  if (mime.includes("pdf") || name.endsWith(".pdf")) return "pdf";
  if (mime.startsWith("audio/") || /\.(mp3|wav|ogg|m4a)$/i.test(name)) return "audio";
  if (
    mime.includes("word") ||
    mime.includes("officedocument") ||
    mime.includes("text") ||
    /\.(docx?|xlsx?|pptx?|txt|md|csv)$/i.test(name)
  ) {
    return "document";
  }
  return "file";
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
