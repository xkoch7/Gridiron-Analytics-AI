"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { nflTeams } from "@/data/nflTeams";
import styles from "./account.module.css";

// Edits display name and favorite team. Upsert covers accounts created before the signup trigger.
export default function ProfileForm({
  userId,
  initialName,
  initialTeam,
}: {
  userId: string;
  initialName: string;
  initialTeam: string;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialName);
  const [favoriteTeam, setFavoriteTeam] = useState(initialTeam);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const dirty = displayName !== initialName || favoriteTeam !== initialTeam;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: userId, display_name: displayName.trim() || null, favorite_team: favoriteTeam || null });
    setSaving(false);
    if (error) return setStatus({ ok: false, text: error.message });
    setStatus({ ok: true, text: "Profile saved." });
    router.refresh();
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.field}>
        Display name
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={40}
          autoComplete="nickname"
        />
      </label>

      <label className={styles.field}>
        Favorite team
        <select value={favoriteTeam} onChange={(e) => setFavoriteTeam(e.target.value)}>
          <option value="">No favorite</option>
          {nflTeams.map((team) => (
            <option key={team.abbr} value={team.abbr}>
              {team.name}
            </option>
          ))}
        </select>
      </label>

      <div className={styles.formFooter}>
        {status && <span className={status.ok ? styles.ok : styles.error}>{status.text}</span>}
        <button type="submit" className="btn" disabled={!dirty || saving}>
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}
