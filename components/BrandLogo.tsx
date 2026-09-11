import Link from "next/link";

const sizeClasses: Record<string, string> = {
  xs: "h-8 sm:h-9 lg:h-10",
  sm: "h-10 sm:h-11",
  md: "h-10 sm:h-12",
  lg: "h-12 sm:h-14",
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
