import Link from "next/link";
import { ArrowUpRight, ShieldCheck, Sparkles } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

const columns = {
  Marketplace: [
    { label: "Browse jobs", href: "/tasks" },
    { label: "Post a job", href: "/post" },
    { label: "Find talent", href: "/#talent" },
    { label: "Categories", href: "/#categories" },
  ],
  "Get started": [
    { label: "AI Skill Check", href: "/interview" },
    { label: "How it works", href: "/#how-it-works" },
    { label: "AI features", href: "/#ai" },
    { label: "Why TQRA AI", href: "/#why" },
  ],
  Support: [
    { label: "Safety & trust", href: "/#trust" },
    { label: "Parwaz Protect", href: "/#trust" },
    { label: "Help centre", href: "/messages" },
  ],
};

export default function Footer() {
  return (
    <footer className="mt-12 bg-[#00501F] text-white">
      <div className="page-shell">
        <div className="grid grid-cols-2 gap-10 py-14 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <BrandLogo inverted compact />
            <p className="mt-5 max-w-xs text-sm leading-6 text-white/60">
              Pakistan&apos;s smarter freelancing marketplace — verified talent, AI-powered matching, and secure payments for every project.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/70">
              <ShieldCheck className="h-4 w-4 text-brand-300" /> Escrow-protected payments
            </div>
          </div>

          {Object.entries(columns).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-xs font-extrabold uppercase tracking-[0.16em] text-white/40">{title}</h3>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="group inline-flex items-center gap-1 text-sm font-bold text-white/70 transition hover:text-white">
                      {link.label}<ArrowUpRight className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-[0.16em] text-white/40">Powered by TQRA AI</h3>
            <p className="mt-4 text-sm leading-6 text-white/60">Smart skill verification, AI matching, and fraud protection keep every hire fair and safe.</p>
            <Link href="/interview" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-extrabold text-white shadow-forest transition hover:bg-brand-700">
              <Sparkles className="h-4 w-4" /> Try the AI Skill Check
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-white/10 py-6 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <span>&copy; {new Date().getFullYear()} Parwaz.pk. All rights reserved.</span>
          <span>Pakistan&apos;s smarter freelancing marketplace, powered by AI.</span>
        </div>
      </div>
    </footer>
  );
}
