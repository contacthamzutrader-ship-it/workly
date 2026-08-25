/** Turns Firebase auth error codes into plain, useful sentences. */
const MESSAGES: Record<string, string> = {
  "auth/invalid-email": "That email address does not look right.",
  "auth/user-disabled": "This account has been disabled. Contact Workly support.",
  "auth/user-not-found": "No Workly account uses that email. Create one instead.",
  "auth/wrong-password": "That password is not correct. Try again or reset it.",
  "auth/invalid-credential": "Email or password is incorrect.",
  "auth/invalid-login-credentials": "Email or password is incorrect.",
  "auth/email-already-in-use": "An account already uses that email. Log in instead.",
  "auth/weak-password": "Choose a password with at least 8 characters.",
  "auth/too-many-requests": "Too many attempts. Wait a moment and try again.",
  "auth/popup-closed-by-user": "The Google window closed before sign-in finished.",
  "auth/cancelled-popup-request": "Only one sign-in window can be open at a time.",
  "auth/popup-blocked": "Your browser blocked the Google window. Allow pop-ups and retry.",
  "auth/network-request-failed": "Network problem. Check your connection and try again.",
  "auth/account-exists-with-different-credential":
    "This email is already registered with a different sign-in method.",
  "auth/operation-not-allowed": "This sign-in method is not enabled for Workly yet.",
  "auth/requires-recent-login": "For security, sign in again before making this change.",
};

export function authErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  const code = (error as { code?: string })?.code;
  if (code && MESSAGES[code]) return MESSAGES[code];
  const message = (error as { message?: string })?.message;
  if (message && !message.startsWith("Firebase:")) return message;
  return fallback;
}

export interface PasswordCheck {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  tone: string;
  problems: string[];
}

export function checkPassword(value: string): PasswordCheck {
  const problems: string[] = [];
  if (value.length < 8) problems.push("Use at least 8 characters");
  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value)) problems.push("Mix upper and lower case");
  if (!/\d/.test(value)) problems.push("Add a number");

  let score = 0;
  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  if (/\d/.test(value) && /[^\w\s]/.test(value)) score += 1;

  const labels = ["Too short", "Weak", "Okay", "Strong", "Very strong"];
  const tones = ["bg-ink-200", "bg-$danger-500", "bg-$warning-500", "bg-$success-500", "bg-$success-600"];
  const clamped = Math.min(4, score) as 0 | 1 | 2 | 3 | 4;
  return { score: clamped, label: labels[clamped], tone: tones[clamped], problems };
}
