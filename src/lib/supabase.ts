import { createBrowserClient } from "@supabase/ssr";

// Browser client: stores the session in cookies so the server and middleware can read it
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);
