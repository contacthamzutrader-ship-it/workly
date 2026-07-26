import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

const COLUMNS: Record<string, { label: string; href: string }[]> = {
  "For clients": [
    { label: "Post a task", href: "/post" },
    { label: "Browse talent", href: "/talent" },
    { label: "How hiring works", href: "/how-it-works" },
    { label: "Payments & protection", href: "/how-it-works#payments" },
  ],
  "For freelancers": [
    { label: "Find work", href: "/tasks" },
    { label: "Create a profile", href: "/signup?role=freelancer" },
    { label: "Skills interview", href: "/profile/interview" },
    { label: "Getting paid", href: "/how-it-works#payments" },
  ],
  Company: [
    { label: "How Workly works", href: "/how-it-works" },
    { label: "Trust & safety", href: "/how-it-works#safety" },
    { label: "Help centre", href: "/support" },
    { label: "Contact support", href: "/support#contact" },
  ],
};

export default function Footer() {
  return (
    <footer className="mt-16 bg-ink text-white">
      <div className="page-shell">
        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <BrandLogo inverted compact />
            <p className="mt-5 max-w-xs text-sm leading-6 text-white/55">
              Pakistan&apos;s people-powered marketplace for getting local and digital work done safely.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/65">
              <ShieldCheck className="h-4 w-4 text-brand-light" /> Moderated, traceable workflows
            </div>
          </div>

          {Object.entries(COLUMNS).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-[11px] font-black uppercase tracking-[0.16em] text-white/40">{title}</h3>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-1 text-sm font-bold text-white/65 transition hover:text-white"
                    >
                      {link.label}
                      <ArrowUpRight className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 border-t border-white/10 py-6 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <span>&copy; {new Date().getFullYear()} Workly. All rights reserved.</span>
          <span>Built for Pakistan · Prices in PKR</span>
        </div>
      </div>
    </footer>
  );
}
