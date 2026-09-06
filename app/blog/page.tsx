import Link from "next/link";
import { ArrowRight, FileQuestion, Newspaper } from "lucide-react";

export default function BlogPage() {
  return (
    <div className="bg-canvas py-8 sm:py-10">
      <div className="page-shell max-w-4xl">
        <div className="overflow-hidden rounded-[32px] bg-[#00501F] p-6 text-white shadow-elevated sm:p-8">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand"><Newspaper className="h-7 w-7" /></div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-300">PARWAZ BLOG</p>
              <h1 className="mt-1 text-2xl font-black tracking-[-0.03em]">Blog</h1>
              <p className="mt-1 text-sm text-white/55">Guides, stories and updates from the Parwaz team.</p>
            </div>
          </div>
        </div>

        <div className="surface mt-6 flex flex-col items-center p-10 text-center sm:p-14">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand"><FileQuestion className="h-8 w-8" /></span>
          <h2 className="mt-5 text-xl font-black tracking-[-0.03em] text-ink">Articles are on the way</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-ink-500">The blog has not launched yet, so there are no articles to show right now. We won&apos;t invent posts - as soon as real guides and updates are published, they will appear here.</p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row">
            <Link href="/how-it-works" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-extrabold text-white shadow-forest transition hover:bg-brand-700">Read how the platform works <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-ink-200 px-5 text-sm font-bold text-ink-600 transition hover:bg-ink-50">Browse tasks</Link>
          </div>
        </div>
      </div>
    </div>
  );
}