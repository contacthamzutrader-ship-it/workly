import { useState } from "react";

const SIZES = {
  sm: "h-9 w-9 rounded-xl text-xs",
  md: "h-11 w-11 rounded-[14px] text-sm",
  lg: "h-16 w-16 rounded-2xl text-lg",
  xl: "h-24 w-24 rounded-3xl text-2xl",
} as const;

export default function Avatar({
  name,
  src,
  size = "md",
  className = "",
}: {
  name?: string;
  src?: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const [error, setError] = useState(false);
  const initials = (name || "W")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  if (src && !error) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={name ? `${name} profile photo` : "Profile photo"}
        onError={() => setError(true)}
        className={`${SIZES[size]} shrink-0 object-cover ${className}`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center bg-ink font-black text-white ${SIZES[size]} ${className}`}
    >
      {initials || "W"}
    </span>
  );
}
