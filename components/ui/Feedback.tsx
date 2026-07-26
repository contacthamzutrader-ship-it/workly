import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";

type Tone = "info" | "success" | "warning" | "error";

const TONES: Record<Tone, { wrap: string; icon: typeof Info }> = {
  info: { wrap: "border-brand-200 bg-brand-50 text-brand-700", icon: Info },
  success: { wrap: "border-emerald-200 bg-emerald-50 text-emerald-800", icon: CheckCircle2 },
  warning: { wrap: "border-amber-200 bg-amber-50 text-amber-800", icon: AlertTriangle },
  error: { wrap: "border-rose-200 bg-rose-50 text-rose-800", icon: XCircle },
};

export function Alert({
  tone = "info",
  title,
  children,
  className = "",
}: {
  tone?: Tone;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const { wrap, icon: Icon } = TONES[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`flex gap-3 rounded-2xl border p-4 ${wrap} ${className}`}>
      <Icon className="mt-0.5 h-4.5 w-4.5 shrink-0" style={{ width: 18, height: 18 }} />
      <div className="min-w-0 text-sm font-semibold leading-6">
        {title && <p className="font-black">{title}</p>}
        {children}
      </div>
    </div>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block h-8 w-8 animate-spin rounded-full border-[3px] border-brand border-t-transparent ${className}`}
    />
  );
}

export function PageLoader({ label = "Loading your workspace" }: { label?: string }) {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="text-center">
        <Spinner />
        <p className="mt-4 text-sm font-bold text-ink-400">{label}</p>
      </div>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = "",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`px-6 py-16 text-center ${className}`}>
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-ink-50 text-ink-300">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="mt-5 text-lg font-black tracking-[-0.02em] text-ink">{title}</h3>
      {description && <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-500">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-ink-100/80 ${className}`} />;
}
