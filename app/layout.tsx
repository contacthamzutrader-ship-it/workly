import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import AppShell from "@/components/AppShell";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const description = "Pakistan's smarter freelancing marketplace, powered by AI. Connect with verified talent, discover the right opportunities, and build your freelance career with intelligent AI-powered matching.";

  return {
    metadataBase: new URL(origin),
    title: {
      default: "Parwaz.pk - Pakistan's smarter freelancing marketplace",
      template: "%s | Parwaz.pk",
    },
    description,
      icons: {
        icon: "/img/Parwaz.jpeg",
        shortcut: "/img/Parwaz.jpeg",
        apple: "/img/Parwaz.jpeg",
      },
    openGraph: {
      type: "website",
      siteName: "Parwaz.pk",
      title: "Pakistan's Smarter Freelancing Marketplace, Powered by AI.",
      description,
      images: [{ url: `${origin}/og.png`, width: 1731, height: 909, alt: "Parwaz.pk - Pakistan's smarter freelancing marketplace, powered by AI" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Pakistan's Smarter Freelancing Marketplace, Powered by AI.",
      description,
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700;800;900&family=Open+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-canvas font-sans text-ink">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
