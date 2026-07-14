import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" };

export default function Button({ variant = "primary", className = "", ...props }: Props) {
  const base = "inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-brand/50 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
  const styles = {
    primary: "bg-brand text-white shadow-sm hover:bg-brand-dark hover:shadow-md active:scale-[0.98]",
    secondary: "bg-ink text-white shadow-sm hover:bg-black hover:shadow-md active:scale-[0.98]",
    ghost: "border border-ink-200 bg-white text-ink hover:bg-ink-50 active:scale-[0.98]",
  };
  return <button className={`${base} ${styles[variant]} ${className}`} {...props} />;
}
