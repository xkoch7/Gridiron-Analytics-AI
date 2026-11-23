import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Badge, PageHead, Panel, ui } from "@/components/ui/kit";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { teamName } from "@/data/nflTeams";
import ProfileForm from "./ProfileForm";
import SignOutButton from "./SignOutButton";
import styles from "./account.module.css";

export const metadata: Metadata = { title: "Account | Gridiron Analytics AI" };

const PROVIDER_LABELS: Record<string, string> = { email: "Email and password", google: "Google", azure: "Microsoft" };

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
    .maybeSingle();

  const name = profile?.display_name || user.email?.split("@")[0] || "Player";
  const initials = name
    .split(/\s+/)
    .map((part: string) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const memberSince = new Date(profile?.created_at ?? user.created_at).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
  const providers = Array.from(new Set((user.identities ?? []).map((i) => i.provider)));

  return (
    <>
      <PageHead title="Account" sub="Your profile and sign-in settings." />

      <section className={styles.profile}>
        <span className={styles.avatar}>{initials}</span>
        <div>
          <div className={styles.name}>{name}</div>
          <div className={ui.secondaryText}>{user.email}</div>
        </div>
        <div className={styles.meta}>
          {profile?.favorite_team && <Badge tone="blue">{teamName(profile.favorite_team)} fan</Badge>}
          <span className={ui.secondaryText}>Member since {memberSince}</span>
        </div>
      </section>

      <div className={ui.twoCol}>
        <Panel title="Profile">
          <ProfileForm
            userId={user.id}
            initialName={profile?.display_name ?? ""}
            initialTeam={profile?.favorite_team ?? ""}
          />
        </Panel>

        <div className={ui.stack}>
          <Panel title="Sign-in methods" flush>
            <ul className={ui.list}>
              {(providers.length ? providers : ["email"]).map((provider) => (
                <li key={provider}>
                  <span className={ui.primaryText}>{PROVIDER_LABELS[provider] ?? provider}</span>
                  <Badge tone="green">Connected</Badge>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Session">
            <p className={styles.sessionText}>Signed in as {user.email}.</p>
            <SignOutButton />
          </Panel>
        </div>
      </div>
    </>
  );
}
