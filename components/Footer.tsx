import Link from "next/link";
import { ArrowUpRight, Lock, ShieldCheck, Sparkles, Zap } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

const columns = {
  Marketplace: [
    { label: "Browse jobs", href: "/browse" },
    { label: "Post a project", href: "/post" },
    { label: "Find talent", href: "/#talent" },
    { label: "Skill Categories", href: "/#categories" },
  ],
  "Platform & Trust": [
    { label: "Safepay Escrow Vaults", href: "/#trust" },
    { label: "AI Technical Vetting", href: "/interview" },
    { label: "How It Works", href: "/how-it-works" },
    { label: "Dispute Arbitration", href: "/#trust" },
  ],
  Enterprise: [
    { label: "Workly SafeGuard", href: "/insurance" },
    { label: "Community Guidelines", href: "/community-guidelines" },
    { label: "Cancellation Policy", href: "/cancellation-policy" },
    { label: "Help & Support Centre", href: "/help" },
  ],
};

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-800 bg-slate-950 text-white">
      <div className="page-shell">
        {/* Main Grid */}
        <div className="grid grid-cols-2 gap-10 py-16 md:grid-cols-5">
          {/* Brand Info */}
          <div className="col-span-2">
            <BrandLogo inverted compact />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-slate-400">
              Pakistan&apos;s premier freelancing and task marketplace — verified engineering and creative talent, AI-powered matching, and institutional Safepay escrow milestone protection.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" /> Safepay Escrow Secured
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-300">
                <Lock className="h-3.5 w-3.5 text-emerald-400" /> SBP Compliant Gateway
              </span>
            </div>
          </div>

          {/* Links Columns */}
          {Object.entries(columns).map(([title, links]) => (
            <div key={title} className="col-span-1">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                {title}
              </h3>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-1 text-sm font-semibold text-slate-300 transition hover:text-white"
                    >
                      {link.label}
                      <ArrowUpRight className="h-3 w-3 opacity-0 transition group-hover:opacity-100 text-emerald-400" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Financial & Trust Seals Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-900 py-6 text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-6">
            <span className="flex items-center gap-1.5 font-semibold text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              Workly Core v2.4 Live
            </span>
            <span>Raast ID &amp; Bank IBAN Transfers</span>
            <span>JazzCash &amp; Easypaisa Supported</span>
            <span>Double-Blind Review Integrity</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link href="/terms" className="hover:text-white transition">
              Terms of Service
            </Link>
            <span>&middot;</span>
            <Link href="/community-guidelines" className="hover:text-white transition">
              Privacy Policy
            </Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-slate-900/60 py-6 text-center text-xs text-slate-500 sm:flex sm:items-center sm:justify-between sm:text-left">
          <span>&copy; {new Date().getFullYear()} Workly.pk. All rights reserved.</span>
          <span className="mt-2 block sm:mt-0">
            Industrial Task &amp; Freelancing Infrastructure for Pakistan.
          </span>
        </div>
      </div>
    </footer>
  );
}
