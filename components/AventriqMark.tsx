export default function AventriqMark({
  className = "",
  inverted = false,
}: {
  className?: string;
  inverted?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={`relative inline-flex aspect-square shrink-0 items-center justify-center overflow-hidden rounded-[30%] ${
        inverted ? "bg-white" : "bg-forest"
      } ${className}`}
    >
      <svg viewBox="0 0 48 48" className="h-full w-full" fill="none">
        <path
          d="M7 36 16.4 12h4.1L30 36h-5.1l-1.8-4.6h-7.7L13.6 36H7Zm7.9-8.7h6.4l-3.2-8.4-3.2 8.4Z"
          fill={inverted ? "#093A1D" : "#FFFFFF"}
        />
        <path d="M31 12h13v4.2h-4.4V36h-4.2V16.2H31V12Z" fill="#00B33C" />
      </svg>
    </span>
  );
}
