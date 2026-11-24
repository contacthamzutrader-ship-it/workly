import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "hero";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: Props) {
  const base = "inline-flex items-center justify-center font-bold tracking-[-0.01em] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2";

  const sizeStyles: Record<ButtonSize, string> = {
    sm: "min-h-9 px-3.5 py-1.5 text-xs rounded-lg",
    md: "min-h-10 px-4 py-2 text-sm rounded-xl",
    lg: "min-h-12 px-6 py-3 text-sm font-bold rounded-xl",
    hero: "min-h-14 px-8 py-3.5 text-base font-extrabold rounded-2xl",
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary: "bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 active:scale-[0.98]",
    secondary: "border border-ink-200 bg-white text-ink hover:bg-ink-50 hover:border-ink-300 active:scale-[0.98]",
    outline: "border border-brand bg-white text-brand hover:bg-brand-50 active:scale-[0.98]",
    ghost: "text-ink-600 hover:bg-ink-100 hover:text-ink active:scale-[0.98]",
    danger: "bg-danger text-white hover:bg-red-700 active:scale-[0.98]",
  };

  return (
    <button
      className={`${base} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    />
  );
}
