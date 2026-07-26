import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const FIELD =
  "w-full rounded-[14px] border border-ink-200 bg-white text-[15px] font-medium text-ink shadow-[0_1px_2px_rgba(7,24,46,0.03)] " +
  "placeholder:font-normal placeholder:text-ink-400 transition " +
  "focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10 " +
  "disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-400";

export default function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`min-h-[52px] px-4 py-3 ${FIELD} ${className}`} {...props} />;
}

export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`px-4 py-3 leading-relaxed ${FIELD} ${className}`} {...props} />;
}

export function Select({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`min-h-[52px] cursor-pointer px-4 py-3 ${FIELD} ${className}`} {...props}>
      {children}
    </select>
  );
}

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label className="text-sm font-extrabold text-ink">
          {label}
          {required && <span className="ml-1 text-brand">*</span>}
        </label>
        {hint && <span className="text-xs font-medium text-ink-400">{hint}</span>}
      </div>
      {children}
      {error && <p className="mt-1.5 text-xs font-bold text-rose-600">{error}</p>}
    </div>
  );
}
