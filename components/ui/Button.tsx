import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "soft" | "danger" | "success";
type Size = "sm" | "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
};

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand text-white shadow-glow hover:bg-brand-dark hover:-translate-y-0.5 active:translate-y-0",
  secondary: "bg-ink text-white shadow-sm hover:bg-ink-800 hover:-translate-y-0.5 active:translate-y-0",
  ghost: "border border-ink-200 bg-white text-ink hover:border-ink-300 hover:bg-ink-50 active:scale-[0.99]",
  soft: "bg-brand-50 text-brand-dark hover:bg-brand-100 active:scale-[0.99]",
  danger: "bg-rose-600 text-white hover:bg-rose-700 active:scale-[0.99]",
  success: "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.99]",
};

const SIZES: Record<Size, string> = {
  sm: "min-h-9 gap-1.5 rounded-xl px-3.5 text-[13px]",
  md: "min-h-12 gap-2 rounded-[14px] px-5 text-sm",
  lg: "min-h-14 gap-2.5 rounded-2xl px-7 text-[15px]",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  className = "",
  disabled,
  children,
  ...props
}: Props) {
  return (
    <button
      disabled={disabled || loading}
      className={[
        "inline-flex select-none items-center justify-center font-bold tracking-[-0.01em] transition-all duration-200",
        "disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0",
        VARIANTS[variant],
        SIZES[size],
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
      {...props}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70"
        />
      )}
      {children}
    </button>
  );
}
