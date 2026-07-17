import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export default function Button({ variant = "primary", className = "", ...props }: Props) {
  const base = "inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-extrabold transition-all disabled:cursor-not-allowed disabled:opacity-50";
  const styles = {
    primary: "bg-brand text-white shadow-glow hover:-translate-y-0.5 hover:bg-brand-dark active:translate-y-0",
    secondary: "bg-ink text-white shadow-sm hover:-translate-y-0.5 hover:bg-ink-800 active:translate-y-0",
    ghost: "border border-ink-200 bg-white text-ink hover:border-ink-300 hover:bg-ink-50 active:scale-[0.98]",
    danger: "bg-red-600 text-white hover:bg-red-700 active:scale-[0.98]",
  };
  return <button className={`${base} ${styles[variant]} ${className}`} {...props} />;
}
