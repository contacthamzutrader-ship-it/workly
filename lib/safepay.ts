import crypto from "crypto";

export interface SafepayTrackerParams {
  amount: number; // in PKR
  currency?: "PKR";
  orderId: string; // taskId or topupId
  clientEmail?: string;
  clientPhone?: string;
}

export interface SafepayTrackerResult {
  token: string;
  checkoutUrl: string;
  env: string;
}

const SAFEPAY_ENV = process.env.SAFEPAY_ENV || "sandbox";
const SAFEPAY_API_KEY = process.env.SAFEPAY_API_KEY || "";
const SAFEPAY_WEBHOOK_SECRET = process.env.SAFEPAY_WEBHOOK_SECRET || "";

const API_BASE_URL =
  SAFEPAY_ENV === "production"
    ? "https://api.getsafepay.com"
    : "https://sandbox.api.getsafepay.com";

const CHECKOUT_BASE_URL =
  SAFEPAY_ENV === "production"
    ? "https://getsafepay.com/checkout/pay"
    : "https://sandbox.api.getsafepay.com/checkout/pay";

/**
 * Initializes a Safepay payment tracker (order token).
 */
export async function createSafepayTracker(
  params: SafepayTrackerParams
): Promise<SafepayTrackerResult> {
  const apiKey = SAFEPAY_API_KEY || "sec_test_mock_safepay_key";

  // If in sandbox mode without production credentials, return sandbox fallback URL for local testing
  if (!SAFEPAY_API_KEY) {
    const mockToken = `track_mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return {
      token: mockToken,
      checkoutUrl: `${CHECKOUT_BASE_URL}?beacon=${mockToken}&env=${SAFEPAY_ENV}&order_id=${encodeURIComponent(params.orderId)}&amount=${params.amount}`,
      env: SAFEPAY_ENV,
    };
  }

  const endpoint = `${API_BASE_URL}/order/v1/init`;

  const payload = {
    client: apiKey,
    amount: params.amount,
    currency: params.currency || "PKR",
    environment: SAFEPAY_ENV,
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Safepay tracker creation failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const token = data?.data?.token || data?.token;

  if (!token) {
    throw new Error("Invalid response received from Safepay tracker API.");
  }

  const checkoutUrl = `${CHECKOUT_BASE_URL}?beacon=${token}&env=${SAFEPAY_ENV}&order_id=${encodeURIComponent(params.orderId)}`;

  return {
    token,
    checkoutUrl,
    env: SAFEPAY_ENV,
  };
}

/**
 * Validates the HMAC-SHA256 signature provided by Safepay Webhooks.
 */
export function verifySafepayWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  if (!signatureHeader) return false;
  const secret = SAFEPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("[Safepay Webhook] Warning: SAFEPAY_WEBHOOK_SECRET is not configured.");
    return false;
  }

  try {
    const computedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(computedSignature, "hex"),
      Buffer.from(signatureHeader, "hex")
    );
  } catch (err) {
    console.error("[Safepay Signature Verification Error]", err);
    return false;
  }
}
