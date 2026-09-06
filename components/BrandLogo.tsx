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
        src="/img/Parwaz.png"
        alt="Parwaz"
        className={`w-auto object-contain ${compact ? "h-14 sm:h-16" : "h-16 sm:h-20"} ${inverted ? "opacity-95" : ""}`}
      />
    </Link>
  );
}
