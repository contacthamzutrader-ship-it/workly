import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export default function Button({ variant = "primary", className = "", ...props }: Props) {
  const base = "inline-flex min-h-12 items-center justify-center rounded-xl px-6 py-3 text-sm font-bold tracking-[-0.01em] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50";
  const styles = {
    primary: "bg-mint text-white shadow-glow hover:-translate-y-0.5 hover:bg-mint-dark active:translate-y-0",
    secondary: "border border-deep/25 bg-white text-deep hover:border-deep/50 hover:bg-mint-50 active:scale-[0.98]",
    ghost: "border border-ink-200 bg-white text-ink hover:border-mint-200 hover:bg-mint-50 active:scale-[0.98]",
    danger: "bg-danger text-white hover:bg-red-700 active:scale-[0.98]",
  };
  return <button className={`${base} ${styles[variant]} ${className}`} {...props} />;
}
