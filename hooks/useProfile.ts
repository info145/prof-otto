"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  school_type?: string;
  class_year?: string;
  preferences?: string;
} | null;

export function useProfile() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [profile, setProfile] = useState<Profile>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;
        const u = data.user ? { id: data.user.id } : null;
        setUser(u);
        if (u) {
          const { data: p } = await supabase
            .from("profiles")
            .select("school_type, class_year, preferences")
            .eq("user_id", u.id)
            .maybeSingle();
          if (!mounted) return;
          setProfile((p as Profile) ?? null);
        } else {
          setProfile(null);
        }
      } catch {
        setUser(null);
        setProfile(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return { user, profile, loading };
}
