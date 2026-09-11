import Link from "next/link";

const sizeClasses: Record<string, string> = {
  xs: "h-10 w-[140px] sm:h-11 sm:w-[160px] lg:h-12 lg:w-[180px]",
  sm: "h-12 w-[180px] sm:h-13 sm:w-[200px] lg:h-14 lg:w-[220px]",
  md: "h-14 w-[200px] sm:h-15 sm:w-[230px] lg:h-16 lg:w-[260px]",
  lg: "h-16 w-[240px] sm:h-17 sm:w-[270px] lg:h-18 lg:w-[300px]",
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
        className={`object-contain ${sizeClasses[size]} ${inverted ? "opacity-95" : ""}`}
      />
    </Link>
  );
}
