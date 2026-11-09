import Link from "next/link";

const logoSizes: Record<string, string> = {
  xs: "h-8",
  sm: "h-9 sm:h-10",
  md: "h-11 sm:h-12",
  lg: "h-14 sm:h-16",
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
      aria-label="AventriqTalent home"
      className={`inline-flex shrink-0 items-center ${compact ? "gap-1.5" : "gap-2"} ${className}`}
    >
      <span
        className={`inline-flex overflow-hidden rounded-lg bg-white ${
          inverted ? "ring-1 ring-white/25" : ""
        }`}
      >
        <img
          src="/img/AventriqTalent.jpeg"
          alt="AventriqTalent"
          className={`w-auto ${logoSizes[size]}`}
        />
      </span>
    </Link>
  );
}
