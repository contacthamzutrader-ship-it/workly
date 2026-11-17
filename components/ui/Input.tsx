import type { InputHTMLAttributes } from "react";

export default function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`min-h-11 w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-medium text-ink shadow-xs placeholder:font-normal placeholder:text-ink-400 transition-colors focus:border-brand focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand/10 ${className}`}
      {...props}
    />
  );
}
