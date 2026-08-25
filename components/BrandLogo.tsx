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
      <span className={`grid shrink-0 place-items-center overflow-hidden rounded-[15px] ${compact ? "h-10 w-10" : "h-11 w-11"} ${inverted ? "bg-white/10" : "bg-deep shadow-sm"}`}>
        <img src="/Parwaz.jpeg" alt="Parwaz" className="h-full w-full object-cover" />
      </span>
    </Link>
  );
}
