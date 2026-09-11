import Link from "next/link";

const sizeClasses: Record<string, string> = {
  xs: "h-12 w-[160px] sm:h-14 sm:w-[200px]",
  sm: "h-14 w-[200px] sm:h-16 sm:w-[260px]",
  md: "h-16 w-[260px] sm:h-[72px] sm:w-[320px]",
  lg: "h-[72px] w-[320px] sm:h-20 sm:w-[400px]",
};

export default function BrandLogo({
  href = "/",
  inverted = false,
  compact = false,
  size = "sm",
  className = "",
}: {
  href?: string;
  inverted?: boolean;
  compact?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label="Parwaz home"
      className={`inline-flex shrink-0 items-center ${sizeClasses[size]} ${className}`}
    >
      <img
        src="/img/Parwaz.png"
        alt="Parwaz"
        className={`h-full w-full object-contain ${inverted ? "opacity-95" : ""}`}
      />
    </Link>
  );
}
