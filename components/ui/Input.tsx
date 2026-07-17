import type { InputHTMLAttributes } from "react";

export default function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`min-h-12 w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm font-medium text-ink placeholder:font-normal placeholder:text-ink-400 transition focus:border-brand focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand/10 ${className}`} {...props} />;
}
