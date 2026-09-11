import Link from "next/link";

const sizeClasses: Record<string, string> = {
  xs: "h-8 min-w-[100px] sm:h-9 sm:min-w-[110px] lg:h-10 lg:min-w-[120px]",
  sm: "h-10 min-w-[120px] sm:h-11 sm:min-w-[140px]",
  md: "h-10 min-w-[140px] sm:h-12 sm:min-w-[160px]",
  lg: "h-12 min-w-[160px] sm:h-14 sm:min-w-[180px]",
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
    <Link href={href} aria-label="Parwaz home" className={`inline-flex items-center ${className}`}>
      <img
        src="/img/Parwaz.png"
        alt="Parwaz"
        className={`w-auto object-contain ${sizeClasses[size]} ${inverted ? "opacity-95" : ""}`}
      />
    </Link>
  );
}
