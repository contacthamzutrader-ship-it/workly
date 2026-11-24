import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import AppShell from "@/components/AppShell";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = headers();
  const rawHost = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "localhost:3000";
  const host = String(rawHost).split(",")[0].trim().replace(/[^a-z0-9.:\-[\] ]/gi, "").replace(/\s+/g, "").slice(0, 255) || "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  let metadataBase: URL;
  try {
    metadataBase = new URL(origin);
  } catch {
    metadataBase = new URL("http://localhost:3000");
  }
  const description =
    "Pakistan's smarter freelancing marketplace, powered by AI. Connect with verified talent, discover the right opportunities, and build your freelance career with skill-based matching.";

  return {
    metadataBase,
    title: {
      default: "AventriqTalent - Pakistan's Smarter Freelancing Marketplace",
      template: "%s | AventriqTalent",
    },
    description,
    openGraph: {
      type: "website",
      siteName: "AventriqTalent",
      title: "Pakistan's Smarter Freelancing Marketplace, Powered by AI.",
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: "Pakistan's Smarter Freelancing Marketplace, Powered by AI.",
      description,
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-canvas font-sans text-ink">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
