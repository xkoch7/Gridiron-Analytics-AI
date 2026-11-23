import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

// Google/Microsoft sign-in and email confirmation links land here with a
// one-time code, which we exchange for a session cookie.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/account";
  // Only allow redirects within this site
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/account";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${safeNext}`);
  }

  const description = searchParams.get("error_description") ?? "Sign-in failed. Please try again.";
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(description)}`);
}
