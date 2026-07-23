import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export default function Button({ variant = "primary", className = "", ...props }: Props) {
  const base = "inline-flex min-h-12 items-center justify-center rounded-[14px] px-6 py-3 text-sm font-bold tracking-[-0.01em] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50";
  const styles = {
    primary: "bg-brand text-white shadow-glow hover:-translate-y-0.5 hover:bg-brand-dark active:translate-y-0",
    secondary: "bg-ink text-white shadow-sm hover:-translate-y-0.5 hover:bg-ink-800 active:translate-y-0",
    ghost: "border border-ink-200 bg-white text-ink hover:border-ink-300 hover:bg-ink-50 active:scale-[0.98]",
    danger: "bg-red-600 text-white hover:bg-red-700 active:scale-[0.98]",
  };
  return <button className={`${base} ${styles[variant]} ${className}`} {...props} />;
}
