import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCheckoutSession } from "@/lib/dodo";

const DODO_PRODUCT_ID = process.env.DODO_PRODUCT_ID;

/**
 * POST /api/dodo/checkout
 * Creates a Dodo checkout session for the "Put me on the map" (DNA → G25) product.
 * Requires the user to be signed in. Passes user_id in metadata for the webhook.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ error: "Sign in required to purchase." }, { status: 401 });
  }

  if (!DODO_PRODUCT_ID) {
    return NextResponse.json(
      { error: "Product not configured (DODO_PRODUCT_ID)." },
      { status: 500 }
    );
  }

  const baseUrl =
    process.env.DODO_CHECKOUT_REDIRECT_URL?.replace(/\/$/, "").replace(/\/app$/, "") ||
    request.nextUrl.origin;
  const returnUrl = `${baseUrl}/app?dna_purchased=1`;

  if (process.env.NODE_ENV === "development") {
    try {
      const host = new URL(returnUrl).hostname;
      console.log("[Dodo checkout] Return URL:", returnUrl, "→ ensure domain allowed:", host);
    } catch {}
  }

  const result = await createCheckoutSession({
    productId: DODO_PRODUCT_ID,
    returnUrl,
    metadata: { user_id: user.id },
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ url: result.checkoutUrl });
}
