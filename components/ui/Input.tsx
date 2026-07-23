import type { InputHTMLAttributes } from "react";

export default function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`min-h-[52px] w-full rounded-[14px] border border-ink-200 bg-white px-4 py-3 text-[15px] font-medium text-ink shadow-[0_1px_2px_rgba(7,24,46,0.03)] placeholder:font-normal placeholder:text-ink-400 transition focus:border-brand focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand/10 ${className}`} {...props} />;
}
