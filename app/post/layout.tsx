import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Post a Job",
  description: "Post a task on AventriqTalent and get matched with top-tier verified freelancers in Pakistan.",
};

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
