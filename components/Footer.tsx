import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

const columns = {
  Marketplace: [
    { label: "Browse tasks", href: "/tasks" },
    { label: "Post a task", href: "/post" },
    { label: "Skill Check", href: "/interview" },
    { label: "How it works", href: "/how-it-works" },
  ],
  "Trust & Safety": [
    { label: "Help & Support Desk", href: "/help" },
    { label: "Community Guidelines", href: "/community-guidelines" },
    { label: "Parwaz Protection", href: "/insurance" },
    { label: "Contact Us", href: "/contact" },
  ],
  "Legal & Policies": [
    { label: "Terms and Conditions", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Cancellation Policy", href: "/cancellation-policy" },
    { label: "Help Centre", href: "/help" },
  ],
};

export default function Footer() {
  return (
    <footer className="mt-12 bg-forest text-white">
      <div className="page-shell">
        <div className="grid grid-cols-2 gap-10 py-14 md:grid-cols-5">
          <div className="col-span-2 md:col-span-2">
            <BrandLogo inverted compact />
            <p className="mt-5 max-w-sm text-sm leading-6 text-white/70">
              Pakistan&apos;s smarter freelancing marketplace — verified talent, AI skill checks, Escrow payment protection, and smart matching for every task.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/80">
              <ShieldCheck className="h-4 w-4 text-brand-300" /> Escrow-protected &amp; AI Contact Shielded
            </div>
          </div>

          {Object.entries(columns).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-xs font-extrabold uppercase tracking-[0.16em] text-white/40">{title}</h3>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-1 text-sm font-bold text-white/70 transition hover:text-white"
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

        <div className="flex flex-col gap-3 border-t border-white/10 py-6 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <span>&copy; {new Date().getFullYear()} Parwaz.pk (Workly). All rights reserved.</span>
          <div className="flex flex-wrap gap-4 text-white/60">
            <Link href="/terms" className="hover:text-white transition">Terms</Link>
            <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
            <Link href="/cancellation-policy" className="hover:text-white transition">Cancellations</Link>
            <Link href="/community-guidelines" className="hover:text-white transition">Guidelines</Link>
            <Link href="/help" className="hover:text-white transition">Support Desk</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
