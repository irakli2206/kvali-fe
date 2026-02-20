import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyDodoWebhookSignature, DODO_WEBHOOK_EVENTS } from "@/lib/dodo";

const TABLE = "dna_entitlements";

/**
 * Dodo webhook handler.
 * Verifies webhook signature, then on payment.succeeded inserts into dna_entitlements (user_id from metadata).
 * Requires: DODO_WEBHOOK_SECRET, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signatureHeader = request.headers.get("webhook-signature") ?? null;
  const timestampHeader = request.headers.get("webhook-timestamp") ?? null;

  if (!verifyDodoWebhookSignature(rawBody, signatureHeader, timestampHeader)) {
    console.warn("Dodo webhook: signature verification failed (check DODO_WEBHOOK_SECRET and headers)");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
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
