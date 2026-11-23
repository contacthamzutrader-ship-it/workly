import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore Jobs",
  description: "Browse approved freelance opportunities with clear budgets and escrow payment protection.",
};

export default function TasksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
