import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import DodoPayments from "dodopayments";
import { DODO_WEBHOOK_EVENTS } from "@/lib/dodo";

const TABLE = "dna_entitlements";

/** API key: DodoPayments SDK requires it even for webhook verify. Use DODO_PAYMENTS_API_KEY or DODO_API_KEY */
function getApiKey(): string | null {
  return process.env.DODO_PAYMENTS_API_KEY?.trim() || process.env.DODO_API_KEY?.trim() || null;
}

/** Webhook key: use DODO_PAYMENTS_WEBHOOK_KEY (Dodo docs) or DODO_WEBHOOK_SECRET */
function getWebhookKey(): string | null {
  return (
    process.env.DODO_PAYMENTS_WEBHOOK_KEY?.trim() ||
    process.env.DODO_WEBHOOK_SECRET?.trim() ||
    null
  );
}

/**
 * Dodo webhook handler.
 * Verifies webhook signature via official SDK, then on payment.succeeded inserts into dna_entitlements.
 * Requires: DODO_PAYMENTS_WEBHOOK_KEY (or DODO_WEBHOOK_SECRET), NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const webhookKey = getWebhookKey();
  if (!webhookKey) {
    console.warn("Dodo webhook: missing DODO_PAYMENTS_WEBHOOK_KEY or DODO_WEBHOOK_SECRET");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const headers = {
    "webhook-id": request.headers.get("webhook-id") ?? "",
    "webhook-signature": request.headers.get("webhook-signature") ?? "",
    "webhook-timestamp": request.headers.get("webhook-timestamp") ?? "",
  };

  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("Dodo webhook: missing DODO_PAYMENTS_API_KEY or DODO_API_KEY (required by SDK for verify)");
    return NextResponse.json({ error: "Server config error" }, { status: 500 });
  }

  let payload: Record<string, unknown>;
  try {
    const client = new DodoPayments({ bearerToken: apiKey, webhookKey });
    payload = client.webhooks.unwrap(rawBody, { headers, key: webhookKey }) as unknown as Record<string, unknown>;
  } catch (err) {
    console.warn("Dodo webhook: signature verification failed", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const eventType = (payload.type ?? payload.event_type ?? payload.eventType) as string | undefined;
  if (eventType !== DODO_WEBHOOK_EVENTS.PAYMENT_SUCCEEDED) {
    return NextResponse.json({ ok: true });
  }

  const data = payload.data as Record<string, unknown> | undefined;
  const payment = data?.payment as Record<string, unknown> | undefined;
  const metadata = (data?.metadata ?? payment?.metadata ?? data?.checkout_session_metadata) as Record<string, string> | undefined;
  const userId = metadata?.user_id;
  const paymentId = (data?.payment_id ?? data?.id ?? payment?.id) as string | undefined;

  if (!userId || !paymentId) {
    console.warn("Dodo webhook: missing user_id or payment id", {
      userId: !!userId,
      paymentId: !!paymentId,
      dataKeys: data ? Object.keys(data) : [],
      hasMetadata: !!metadata,
    });
    return NextResponse.json({ ok: true });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error("Dodo webhook: missing Supabase env");
    return NextResponse.json({ error: "Server config error" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const { error } = await supabase.from(TABLE).insert({
    user_id: userId,
    order_id: String(paymentId),
    variant_id: null,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ ok: true });
    }
    console.error("Dodo webhook insert error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
