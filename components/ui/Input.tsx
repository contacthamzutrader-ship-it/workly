import type { InputHTMLAttributes } from "react";

export default function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`min-h-12 w-full rounded-xl border border-ink-100 bg-white px-4 py-3 text-[15px] font-medium text-ink shadow-soft placeholder:font-normal placeholder:text-ink-400 transition focus:border-mint focus:bg-white focus:outline-none focus:ring-4 focus:ring-mint/15 ${className}`} {...props} />;
}
