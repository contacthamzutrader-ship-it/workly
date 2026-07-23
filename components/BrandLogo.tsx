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
    <Link href={href} aria-label="Workly home" className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className={`grid shrink-0 place-items-center overflow-hidden rounded-[15px] ${compact ? "h-10 w-10" : "h-11 w-11"} ${inverted ? "bg-white/10" : "bg-[#06162d] shadow-sm"}`}>
        <img src="/workly-mark.png" alt="" className="h-[82%] w-[82%] object-contain" />
      </span>
      <span className={`font-black leading-none tracking-[-0.045em] ${compact ? "text-xl" : "text-[22px]"} ${inverted ? "text-white" : "text-ink"}`}>
        Workly
      </span>
    </Link>
  );
}
