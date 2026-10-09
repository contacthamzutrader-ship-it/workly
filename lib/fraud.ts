// Enhanced Fraud Detection & Escrow-Bypass Scanner
const BANNED_PATTERNS: { label: string; re: RegExp }[] = [
  { label: "PayPal", re: /\bpay\s*pal\b/i },
  { label: "direct transfer", re: /direct\s*(transfer|payment|deal|pesy|paise)/i },
  { label: "off-platform agreement", re: /\b(bahir deal|bahir baat|bahar rabta|direct baat|direct contact)\b/i },
  { label: "bank transfer", re: /bank\s*(transfer|account|me bhejo|me send|hisaab)/i },
  { label: "direct mobile wallet", re: /(easypaisa|jazzcash|nayapay|sadapay)\s*(par bhejo|pe send|direct|number)/i },
  { label: "Western Union", re: /western\s*union/i },
  { label: "WhatsApp / WA", re: /\b(whats\s*app|wa\.me|w\/a|wapp|watsap|wtsap|whatapp)\b/i },
  { label: "Telegram", re: /\b(tele\s*gram|t\.me)\b/i },
  { label: "email address", re: /[a-z0-9._%+-]+\s*(@|\[at\]|\(at\))\s*[a-z0-9.-]+\s*(\.|\(dot\)|\[dot\])\s*[a-z]{2,}/i },
  { label: "phone number", re: /(?:(?:\+|00)92|0)?\s*3\s*\d(?:\s*[\d-.]){7,9}\d/ },
  { label: "generic phone number", re: /(?:\+?\d[\d\s().-]{7,}\d)/ },
  { label: "contact exchange request", re: /\b(number do|number send|rabta number|call karo|phone number bhejo)\b/i },
];

export interface ScanResult {
  flagged: boolean;
  reasons: string[];
}

export function scanMessage(text: string): ScanResult {
  const normalized = text.toLowerCase().replace(/[\u200B-\u200D\uFEFF]/g, "");
  const reasons: string[] = [];

  for (const p of BANNED_PATTERNS) {
    if (p.re.test(text) || p.re.test(normalized)) {
      if (!reasons.includes(p.label)) reasons.push(p.label);
    }
  }

  // Check for obfuscated phone numbers with spaces/dashes (e.g. 0 3 0 0 1 2 3 4 5 6 7)
  const digitsOnly = text.replace(/[^\d]/g, "");
  if (digitsOnly.length >= 10 && digitsOnly.length <= 13 && /^(03|923|00923)/.test(digitsOnly)) {
    if (!reasons.includes("Pakistani mobile number")) {
      reasons.push("Pakistani mobile number");
    }
  }

  return { flagged: reasons.length > 0, reasons };
}
