import Link from "next/link";
import { Hammer } from "lucide-react";

const columns = {
  Marketplace: [
    { label: "Browse Tasks", href: "/tasks" },
    { label: "Post a Task", href: "/post" },
    { label: "Become a Tasker", href: "/signup" },
    { label: "How it Works", href: "/" },
  ],
  Support: [
    { label: "Help Center", href: "#" },
    { label: "Contact Us", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-ink-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 py-12 md:grid-cols-3">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white"><Hammer className="h-5 w-5" /></span>
              <span className="text-xl font-extrabold tracking-tight text-ink">Workly</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-500">
              Get anything done with trusted local taskers. Post a task, get bids, and hire with confidence.
            </p>
            <p className="mt-3 text-xs text-ink-400">Pakistan&apos;s #1 task marketplace</p>
          </div>
          {Object.entries(columns).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-ink">{title}</h3>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-ink-500 transition hover:text-brand">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-ink-100 py-6 text-center text-sm text-ink-400">
          &copy; {new Date().getFullYear()} Workly. All rights reserved. Built with Next.js, Firebase & Hugging Face.
        </div>
      </div>
    </footer>
  );
}
