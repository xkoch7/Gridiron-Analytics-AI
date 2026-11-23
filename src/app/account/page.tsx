import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already redirects, this is a fallback
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, favorite_team, created_at")
    .eq("id", user.id)
    .single();

  return (
    <div>
      <h1>Account</h1>
      <p>Welcome{profile?.display_name ? `, ${profile.display_name}` : ""}.</p>
      <dl>
        <dt>Email</dt>
        <dd>{user.email}</dd>
        <dt>Favorite team</dt>
        <dd>{profile?.favorite_team ?? "Not set"}</dd>
        <dt>Member since</dt>
        <dd>{new Date(profile?.created_at ?? user.created_at).toLocaleDateString()}</dd>
      </dl>
    </div>
  );
}
