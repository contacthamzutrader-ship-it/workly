import Link from "next/link";
import {
  Plus,
  LayoutGrid,
  FileText,
  Users,
  CheckCircle2,
  CreditCard,
  Search,
  ShieldCheck,
  Star,
  MessageSquare,
} from "lucide-react";
import Button from "@/components/ui/Button";

const steps = [
  { icon: FileText, text: "Post your task with details & budget" },
  { icon: Users, text: "Get bids from verified taskers" },
  { icon: CheckCircle2, text: "Choose the best, get it done" },
  { icon: CreditCard, text: "Pay securely & leave a review" },
];

const features = [
  { icon: Search, title: "Find local help", text: "Browse tasks or post your own in seconds." },
  { icon: ShieldCheck, title: "Trusted & safe", text: "Verified profiles and admin-approved tasks." },
  { icon: MessageSquare, title: "Chat in real time", text: "Coordinate directly with your tasker." },
  { icon: Star, title: "Rated community", text: "Reviews keep quality high on every job." },
];

export default function Home() {
  return (
    <div>
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
              <ShieldCheck className="h-3.5 w-3.5" /> Marketplace for tasks
            </span>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-ink md:text-5xl">
              Get anything done with <span className="text-brand">trusted taskers</span>.
            </h1>
            <p className="mt-4 text-lg text-ink/70">
              Workly connects you with skilled people nearby. Post a task, receive
              bids, and hire with confidence.
            </p>
            <div className="mt-8 flex gap-3">
              <Link href="/post">
                <Button className="flex items-center gap-1.5">
                  <Plus className="h-4 w-4" /> Post a Task
                </Button>
              </Link>
              <Link href="/tasks">
                <Button variant="ghost" className="flex items-center gap-1.5">
                  <LayoutGrid className="h-4 w-4" /> Browse Tasks
                </Button>
              </Link>
            </div>
          </div>

          <div className="rounded-2xl bg-ink p-8 text-white">
            <h3 className="text-xl font-bold">How it works</h3>
            <ol className="mt-4 space-y-3 text-sm text-white/80">
              {steps.map((s, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand/20 text-brand">
                    <s.icon className="h-3.5 w-3.5" />
                  </span>
                  {s.text}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-ink/10 bg-white p-5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10 text-brand">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 font-semibold text-ink">{f.title}</h3>
              <p className="mt-1 text-sm text-ink/60">{f.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
