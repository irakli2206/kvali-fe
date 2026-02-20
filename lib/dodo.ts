/**
 * Dodo Payments API helpers: create checkout session, verify webhook signature.
 * Env: DODO_API_KEY or DODO_PAYMENTS_API_KEY, DODO_PRODUCT_ID; optional: DODO_USE_TEST, DODO_CHECKOUT_REDIRECT_URL
 *
 * Use test.dodopayments.com when DODO_USE_TEST is set (or when API key looks like test);
 * otherwise live.dodopayments.com.
 */

import crypto from "node:crypto";

function getDodoBaseUrl(): string {
  const key = process.env.DODO_PAYMENTS_API_KEY ?? process.env.DODO_API_KEY ?? "";
  const useTest =
    process.env.DODO_USE_TEST === "true" ||
    (process.env.DODO_USE_TEST !== "false" && key.toLowerCase().includes("test"));
  return useTest ? "https://test.dodopayments.com" : "https://live.dodopayments.com";
}

export type CreateCheckoutParams = {
  productId: string;
  returnUrl: string;
  metadata?: Record<string, string>;
};

export type CreateCheckoutResponse = {
  checkoutUrl: string;
  sessionId: string;
};

/**
 * Create a checkout session. Returns checkout URL to redirect the customer.
 */
export async function createCheckoutSession(
  params: CreateCheckoutParams
): Promise<CreateCheckoutResponse | { error: string }> {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY?.trim() || process.env.DODO_API_KEY?.trim();
  if (!apiKey) {
    return { error: "Dodo is not configured (missing DODO_PAYMENTS_API_KEY or DODO_API_KEY)." };
  }

  const { productId, returnUrl, metadata } = params;
  const baseUrl = getDodoBaseUrl();
  const res = await fetch(`${baseUrl}/checkouts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      product_cart: [{ product_id: productId, quantity: 1 }],
      return_url: returnUrl,
      ...(metadata && Object.keys(metadata).length > 0 ? { metadata } : {}),
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Dodo create checkout error:", res.status, errText);
    let message = "Failed to create checkout.";
    try {
      const errJson = JSON.parse(errText) as { message?: string; error?: string };
      const detail = errJson?.message ?? errJson?.error;
      if (detail) message = `Dodo ${res.status}: ${detail}`;
    } catch {
      // use generic message
    }
    return { error: message };
  }

  const json = (await res.json()) as {
    checkout_url?: string | null;
    session_id?: string;
  };

  const checkoutUrl = json.checkout_url;
  const sessionId = json.session_id;

  if (!checkoutUrl || !sessionId) {
    return { error: "Invalid checkout response (no checkout URL)." };
  }

  return { checkoutUrl, sessionId };
}

/**
 * Verify Dodo webhook signature.
 * Headers: webhook-id, webhook-signature (format "v1,signature"), webhook-timestamp.
 * Signed payload: timestamp + "." + rawBody (HMAC-SHA256 with webhook secret); Dodo uses base64.
 */
export function verifyDodoWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  timestampHeader: string | null
): boolean {
  const secret = process.env.DODO_WEBHOOK_SECRET;
  if (!secret || !signatureHeader || !timestampHeader) return false;

  const parts = signatureHeader.split(",").map((p) => p.trim());
  const sigPart = parts.find((p) => p.startsWith("v1,"));
  if (!sigPart) return false;
  let signature = sigPart.slice(3); // "v1," -> value
  // Dodo may send base64url (- and _); normalize to base64 for decoding
  if (signature.includes("-") || signature.includes("_")) {
    signature = signature.replace(/-/g, "+").replace(/_/g, "/");
  }

  const signedPayload = `${timestampHeader}.${rawBody}`;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(signedPayload, "utf8");
  const expectedBase64 = hmac.digest("base64");

  try {
    const receivedBuf = Buffer.from(signature, "base64");
    const expectedBuf = Buffer.from(expectedBase64, "base64");
    return receivedBuf.length === expectedBuf.length && crypto.timingSafeEqual(receivedBuf, expectedBuf);
  } catch {
    return false;
  }
}

export const DODO_WEBHOOK_EVENTS = {
  PAYMENT_SUCCEEDED: "payment.succeeded",
} as const;
