export default function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-ink/60 md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} Workly. All rights reserved.</p>
        <span>Built with Next.js · Vercel · Firebase · Hugging Face</span>
      </div>
    </footer>
  );
}
