import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Tasks",
  description: "Explore verified freelance tasks, smart skill matching, and safe escrow projects across Pakistan.",
};

export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
