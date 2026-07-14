import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export default function Button({ variant = "primary", className = "", ...props }: Props) {
  const base =
    "inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand/50 disabled:cursor-not-allowed disabled:opacity-50";
  const styles = {
    primary: "bg-brand text-white hover:bg-brand-dark",
    secondary: "bg-ink text-white hover:bg-black",
    ghost: "border border-ink/15 bg-transparent text-ink hover:bg-ink/5",
  };
  return <button className={`${base} ${styles[variant]} ${className}`} {...props} />;
}
