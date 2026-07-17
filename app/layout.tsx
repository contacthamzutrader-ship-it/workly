import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const description = "Post local or digital work, compare verified professionals, and pay safely through protected milestones.";

  return {
    metadataBase: new URL(origin),
    title: {
      default: "Workly - Pakistan's trusted work marketplace",
      template: "%s | Workly",
    },
    description,
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
      <body className="flex min-h-screen flex-col bg-canvas font-sans text-ink">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
