"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  BookOpen,
  Gavel,
  LifeBuoy,
  Mail,
  MessageSquare,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { OWNER_EMAIL } from "@/lib/roles";
import Button from "@/components/ui/Button";

const TOPICS = [
  {
    icon: UserRound,
    title: "Account & sign-in",
    items: [
      ["I forgot my password", "/forgot-password"],
      ["Switch between client and freelancer", "/settings"],
      ["Update my profile or photo", "/profile"],
      ["Verify my email address", "/settings"],
    ],
  },
  {
    icon: Gavel,
    title: "Tasks & offers",
    items: [
      ["Post a task", "/post"],
      ["Why is my task still in review?", "/how-it-works"],
      ["Edit or withdraw my offer", "/dashboard"],
      ["Browse open work", "/tasks"],
    ],
  },
  {
    icon: Banknote,
    title: "Payments",
    items: [
      ["How payments work", "/how-it-works#payments"],
      ["View my balance and history", "/wallet"],
      ["When do I get paid?", "/how-it-works#payments"],
      ["Fees explained", "/how-it-works#payments"],
    ],
  },
  {
    icon: ShieldCheck,
    title: "Trust & safety",
    items: [
      ["How verification works", "/how-it-works#safety"],
      ["Report a task or message", "#contact"],
      ["Raise a dispute", "/dashboard"],
      ["Why payments must stay on Parwaz", "/how-it-works#safety"],
    ],
  },
];

export default function SupportPage() {
  return (
    <div className="bg-canvas">
      <section className="bg-white">
        <div className="page-shell py-14 text-center sm:py-16">
          <span className="eyebrow mx-auto">
            <LifeBuoy className="h-3.5 w-3.5" /> Help centre
          </span>
          <h1 className="mx-auto mt-6 max-w-2xl text-4xl font-black leading-[1.05] tracking-[-0.05em] text-ink sm:text-5xl">
            How can we help?
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base font-medium leading-7 text-ink-500">
            Find the answer fast, or reach a human who can look at your specific task.
          </p>
        </div>
      </section>

      <section className="page-shell py-12 sm:py-14">
        <div className="grid gap-4 sm:grid-cols-2">
          {TOPICS.map((topic) => (
            <div key={topic.title} className="surface p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand">
                  <topic.icon className="h-5 w-5" />
                </span>
                <h2 className="text-lg font-black text-ink">{topic.title}</h2>
              </div>
              <ul className="mt-5 space-y-1">
                {topic.items.map(([label, href]) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-bold text-ink-600 transition hover:bg-ink-50 hover:text-ink"
                    >
                      {label}
                      <ArrowRight className="h-3.5 w-3.5 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-brand" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section id="contact" className="scroll-mt-24 page-shell pb-16 sm:pb-20">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="overflow-hidden rounded-3xl bg-ink p-7 text-white sm:p-9">
            <Mail className="h-6 w-6 text-brand-light" />
            <h2 className="mt-5 text-2xl font-black tracking-[-0.035em]">Talk to a human</h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-white/60">
              For anything about a specific task, payment or account, email us with the task link. Support reads the full
              on-platform record before replying, so please keep everything on Parwaz.
            </p>
            <a href={`mailto:${OWNER_EMAIL}`} className="mt-6 inline-block">
              <Button className="bg-white text-ink shadow-none hover:bg-brand-100">
                Email Parwaz support <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
            <p className="mt-4 text-xs font-semibold text-white/40">
              We aim to reply within two business days. Disputes involving held funds are prioritised.
            </p>
          </div>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-$warning-200 bg-$warning-50 p-6">
              <AlertTriangle className="h-5 w-5 text-$warning-700" />
              <h3 className="mt-4 text-base font-black text-ink">Never pay off-platform</h3>
              <p className="mt-2 text-sm leading-6 text-ink-600">
                If anyone asks you to pay by bank transfer, mobile wallet or cash outside Parwaz, stop and report it. Off-platform
                payments have no protection and no dispute route.
              </p>
            </div>

            <Link href="/how-it-works" className="surface group block p-6 transition hover:border-brand-200">
              <BookOpen className="h-5 w-5 text-brand" />
              <h3 className="mt-4 text-base font-black text-ink">Read the full guide</h3>
              <p className="mt-2 text-sm leading-6 text-ink-500">
                How posting, offers, hiring, delivery and payment work end to end.
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-black text-brand-dark">
                How Parwaz works <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>

            <Link href="/messages" className="surface group block p-6 transition hover:border-brand-200">
              <MessageSquare className="h-5 w-5 text-brand" />
              <h3 className="mt-4 text-base font-black text-ink">Check your messages</h3>
              <p className="mt-2 text-sm leading-6 text-ink-500">
                Most questions about a live task are answered fastest in the task chat itself.
              </p>
            </Link>
          </aside>
        </div>
      </section>
    </div>
  );
}
