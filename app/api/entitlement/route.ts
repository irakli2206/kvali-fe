import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TABLE = "dna_entitlements";

/**
 * GET /api/entitlement
 * Returns whether the current user has purchased the DNA → G25 product (entitled to upload).
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ entitled: false, signedIn: false });
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Entitlement check error:", error);
    return NextResponse.json({ entitled: false, signedIn: true });
  }

  return NextResponse.json({ entitled: !!data, signedIn: true });
}
