import type { Metadata } from "next";
import { headers } from "next/headers";
import { Playfair_Display, Open_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import AppShell from "@/components/AppShell";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-heading",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-sans",
});

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
  const description = "Pakistan's smarter freelancing marketplace, powered by AI. Connect with verified talent, discover the right opportunities, and build your freelance career with intelligent AI-powered matching.";

  return {
    metadataBase,
    title: {
      default: "Workly - The Smarter Freelancing & Task Marketplace",
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
      title: "Workly - The Smarter Freelancing & Task Marketplace",
      description,
      images: [{ url: `${origin}/og.png`, width: 1731, height: 909, alt: "Workly - Smarter freelancing & task marketplace" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Workly - The Smarter Freelancing & Task Marketplace",
      description,
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${openSans.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-canvas font-sans text-ink">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
