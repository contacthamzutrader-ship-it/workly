// Fraud Detection (docs: Fraud Detection Process — Escrow Bypass Scanner)
// Flags messages that try to move payment off-platform (PayPal, direct/bank
// transfer, WhatsApp) or leak contact info (email, phone).
const BANNED_PATTERNS: { label: string; re: RegExp }[] = [
  { label: "PayPal", re: /paypal/i },
  { label: "direct transfer", re: /direct\s*(transfer|payment)/i },
  { label: "bank transfer", re: /bank\s*transfer/i },
  { label: "Western Union", re: /western\s*union/i },
  { label: "WhatsApp", re: /\bwhatsapp\b/i },
  { label: "email address", re: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i },
  { label: "phone number", re: /(?:\+?\d[\d\s().-]{7,}\d)/ },
];

export interface ScanResult {
  flagged: boolean;
  reasons: string[];
}

export function scanMessage(text: string): ScanResult {
  const reasons = BANNED_PATTERNS.filter((p) => p.re.test(text)).map((p) => p.label);
  return { flagged: reasons.length > 0, reasons };
}
