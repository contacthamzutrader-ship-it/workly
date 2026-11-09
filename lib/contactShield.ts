/**
 * AventriqTalent AI Contact Shield & Anti-Circumvention Guardrail Engine
 * 
 * Strict detection for off-platform contact sharing (Phone numbers, WhatsApp,
 * emails, social handles, external payment requests, and hidden contacts in files).
 */

export interface ShieldViolation {
  category: "phone" | "whatsapp" | "email" | "social" | "link" | "external_payment" | "direct_contact";
  label: string;
  matchedText?: string;
  explanation: string;
}

export interface ShieldScanResult {
  isBlocked: boolean;
  violations: ShieldViolation[];
  scannedAt: number;
}

// Phone number regexes (supports Pakistan 03xx, +92, international, obfuscated with spaces/dashes/dots)
const PHONE_PATTERNS = [
  // Pakistan mobile: 03xx-xxxxxxx or +92-3xx-xxxxxxx or 0092-3xx-xxxxxxx
  /(?:\+?92|0092|0)[\s.-]?3\d{2}[\s.-]?\d{3}[\s.-]?\d{4}/i,
  // Spaced out digits e.g. 0 3 0 0 1 2 3 4 5 6 7
  /\b0\s*3\s*\d\s*\d\s*\d\s*\d\s*\d\s*\d\s*\d\s*\d\s*\d\b/,
  // General phone number pattern (7 to 14 consecutive digits with separators)
  /(?:(?:\+|00)\d{1,3}[\s.-]?)?(?:\(?\d{3,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}\b/,
  // Obfuscated phone numbers written in words: "zero three zero zero", "o3oo"
  /\b(zero|one|two|three|four|five|six|seven|eight|nine|\bo\b)\s+(zero|one|two|three|four|five|six|seven|eight|nine|\bo\b)\s+(zero|one|two|three|four|five|six|seven|eight|nine|\bo\b)/i,
];

// WhatsApp patterns
const WHATSAPP_PATTERNS = [
  /\b(wa\.me|api\.whatsapp\.com|chat\.whatsapp\.com)\b/i,
  /\b(whatsapp|whats\s*app|watsapp|watsp|watsap|wats\s*up)\b/i,
  /\b(wa\s*pe\s*rabta|wa\s*msg|wa\s*number)\b/i,
];

// Email patterns (standard + obfuscated e.g. "name at gmail dot com")
const EMAIL_PATTERNS = [
  /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i,
  /\b[a-z0-9._%+-]+\s*(?:@|\[at\]|\(at\)|at)\s*[a-z0-9.-]+\s*(?:\.|\[dot\]|\(dot\)|dot)\s*(?:com|pk|org|net|io|edu)\b/i,
];

// Social media patterns
const SOCIAL_PATTERNS = [
  /\b(t\.me|telegram)\b/i,
  /\b(instagram\.com|insta(?:\.|\s*id|gram)?|@[\w.]{3,25})\b/i,
  /\b(facebook\.com|fb\.com|linkedin\.com|twitter\.com|x\.com)\b/i,
  /\b(snapchat|skype|discord\.gg|discordapp)\b/i,
];

// External link patterns
const LINK_PATTERNS = [
  /https?:\/\/[^\s]+/i,
  /\bwww\.[a-z0-9-]+\.[a-z]{2,}[^\s]*/i,
];

// External payment & direct dealing patterns (Urdu & English)
const DIRECT_CONTACT_PATTERNS = [
  /\b(direct\s*(?:deal|payment|transfer|pay|rabta|call|baat))\b/i,
  /\b(bahir\s*(?:baat|deal|milte|payment|rabta))\b/i,
  /\b(outside\s*(?:platform|aventriq|aventriq))\b/i,
  /\b(call\s*me\s*on|contact\s*me\s*at|mera\s*number|rabta\s*karein)\b/i,
  /\b(easypaisa\s*direct|jazzcash\s*direct|bank\s*transfer\s*direct)\b/i,
  /\b(western\s*union|paypal)\b/i,
];

/**
 * Scan text (proposal, message, etc.) for off-platform contact attempts.
 */
export function scanTextForContacts(text: string): ShieldScanResult {
  const violations: ShieldViolation[] = [];
  const clean = text || "";

  // 1. WhatsApp
  for (const re of WHATSAPP_PATTERNS) {
    const match = clean.match(re);
    if (match) {
      violations.push({
        category: "whatsapp",
        label: "WhatsApp / Messaging handle detected",
        matchedText: match[0],
        explanation: "Sharing WhatsApp or off-platform messaging links is strictly prohibited.",
      });
      break;
    }
  }

  // 2. Phone numbers
  for (const re of PHONE_PATTERNS) {
    const match = clean.match(re);
    if (match) {
      // Ignore normal small prices like 1000 or 2000
      const digitsOnly = match[0].replace(/\D/g, "");
      if (digitsOnly.length >= 7) {
        violations.push({
          category: "phone",
          label: "Phone number detected",
          matchedText: match[0],
          explanation: "Sharing personal contact numbers violates platform security and safety terms.",
        });
        break;
      }
    }
  }

  // 3. Email
  for (const re of EMAIL_PATTERNS) {
    const match = clean.match(re);
    if (match) {
      violations.push({
        category: "email",
        label: "Email address detected",
        matchedText: match[0],
        explanation: "Direct email communication outside the platform is not permitted.",
      });
      break;
    }
  }

  // 4. Social media
  for (const re of SOCIAL_PATTERNS) {
    const match = clean.match(re);
    if (match) {
      // Don't flag single common word unless it looks like a handle or domain
      violations.push({
        category: "social",
        label: "Social media profile / handle detected",
        matchedText: match[0],
        explanation: "Social media profiles cannot be shared to protect buyer-seller security.",
      });
      break;
    }
  }

  // 5. External Links
  for (const re of LINK_PATTERNS) {
    const match = clean.match(re);
    if (match) {
      violations.push({
        category: "link",
        label: "External URL / website link detected",
        matchedText: match[0],
        explanation: "External web links are blocked to prevent phishing and off-platform dealing.",
      });
      break;
    }
  }

  // 6. Direct contact / off-platform dealing
  for (const re of DIRECT_CONTACT_PATTERNS) {
    const match = clean.match(re);
    if (match) {
      violations.push({
        category: "direct_contact",
        label: "Off-platform arrangement attempt detected",
        matchedText: match[0],
        explanation: "Proposing to work or pay outside the platform violates Escrow safety policies.",
      });
      break;
    }
  }

  return {
    isBlocked: violations.length > 0,
    violations,
    scannedAt: Date.now(),
  };
}

/**
 * Scan an uploaded file (Image, PDF, or Document) for off-platform contact leaks.
 * Reads text content or scans strings in binary data.
 */
export async function scanFileForContacts(file: File): Promise<{
  isBlocked: boolean;
  violations: ShieldViolation[];
  fileName: string;
}> {
  const fileName = file.name;
  const violations: ShieldViolation[] = [];

  // Check file name itself for phone numbers / email / whatsapp
  const nameScan = scanTextForContacts(fileName);
  if (nameScan.isBlocked) {
    violations.push(...nameScan.violations);
  }

  try {
    if (file.type.includes("text") || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
      const text = await file.text();
      const contentScan = scanTextForContacts(text);
      if (contentScan.isBlocked) {
        violations.push(...contentScan.violations);
      }
    } else if (file.type.includes("pdf") || file.name.endsWith(".pdf")) {
      // Extract printable ascii strings from PDF binary stream to detect hidden phone numbers/emails
      const buffer = await file.arrayBuffer();
      const textDecoder = new TextDecoder("utf-8", { fatal: false });
      const rawText = textDecoder.decode(buffer);
      // Clean PDF operators and look for plain text words
      const extractedText = rawText.replace(/[\x00-\x1F\x7F-\x9F]/g, " ");
      const pdfScan = scanTextForContacts(extractedText);
      if (pdfScan.isBlocked) {
        violations.push(...pdfScan.violations);
      }
    } else if (file.type.startsWith("image/")) {
      // Scan image metadata / text chunks if present
      const buffer = await file.arrayBuffer();
      const textDecoder = new TextDecoder("utf-8", { fatal: false });
      const raw = textDecoder.decode(buffer.slice(0, Math.min(buffer.byteLength, 100000)));
      // Check for embedded text strings
      const imageScan = scanTextForContacts(raw);
      if (imageScan.isBlocked) {
        violations.push(...imageScan.violations);
      }
    }
  } catch {
    // If scanning binary fails, allow file if filename is clean
  }

  return {
    isBlocked: violations.length > 0,
    violations,
    fileName,
  };
}
