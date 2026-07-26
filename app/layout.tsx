import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import AppShell from "@/components/AppShell";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const description = "Post local or digital work, compare evidence-backed professionals, and manage delivery in one trusted workspace.";

  return {
    metadataBase: new URL(origin),
    title: {
      default: "Workly - Pakistan's trusted work marketplace",
      template: "%s | Workly",
    },
    description,
    icons: {
      icon: "/workly-mark.png",
      shortcut: "/workly-mark.png",
      apple: "/workly-mark.png",
    },
    openGraph: {
      type: "website",
      siteName: "Workly",
      title: "The right person for every task.",
      description,
      images: [{ url: `${origin}/og.png`, width: 1731, height: 909, alt: "Workly - Pakistan's trusted work marketplace" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "The right person for every task.",
      description,
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-canvas font-sans text-ink">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
