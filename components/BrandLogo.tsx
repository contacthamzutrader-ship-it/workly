import Link from "next/link";

const sizeClasses: Record<string, string> = {
  xs: "h-7 sm:h-8",
  sm: "h-8 sm:h-9 lg:h-10",
  md: "h-9 sm:h-11 lg:h-12",
  lg: "h-11 sm:h-13 lg:h-14",
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
    <Link href={href} aria-label="Parwaz home" className={`inline-flex shrink-0 items-center ${className}`}>
      <img
        src="/img/Parwaz.png"
        alt="Parwaz"
        className={`w-auto ${sizeClasses[size]} ${inverted ? "opacity-95" : ""}`}
      />
    </Link>
  );
}
