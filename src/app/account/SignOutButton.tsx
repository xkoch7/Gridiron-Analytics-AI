"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import styles from "./account.module.css";

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button type="button" className={styles.signOut} onClick={handleSignOut}>
      Sign out
    </button>
  );
}
