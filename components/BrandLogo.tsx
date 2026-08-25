import Link from "next/link";

export default function BrandLogo({
  href = "/",
  inverted = false,
  compact = false,
  className = "",
}: {
  href?: string;
  inverted?: boolean;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link href={href} aria-label="Parwaz home" className={`inline-flex items-center ${className}`}>
      <img
        src="/Parwaz.jpeg"
        alt="Parwaz"
        className={`w-auto object-contain ${compact ? "h-7 sm:h-8" : "h-9 sm:h-11"} ${inverted ? "opacity-95" : ""}`}
      />
    </Link>
  );
}
