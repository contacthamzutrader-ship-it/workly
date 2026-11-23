import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Protected Wallet",
  description: "Manage your escrow-protected earnings, held funds, and secure payouts via Raast, Bank, and Mobile Wallets.",
};

export default function WalletLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
