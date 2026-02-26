"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const router = useRouter();
  const [schoolType, setSchoolType] = useState("superiori");
  const [classYear, setClassYear] = useState("");
  const [preferences, setPreferences] = useState("");
  const [saving, setSaving] = useState(false);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        router.push("/login");
        return;
      }
      await supabase.from("profiles").upsert({
        user_id: user.id,
        school_type: schoolType,
        class_year: classYear,
        preferences,
      });
      router.push("/chat");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center py-6">
      <form onSubmit={onSave} className="w-full max-w-lg space-y-4 rounded-2xl border border-border bg-white p-6 shadow-soft">
        <h1 className="text-xl font-semibold">Onboarding</h1>
        <label className="block text-sm">
          <span className="mb-1 block text-[#6B7280]">Tipo scuola</span>
          <select
            value={schoolType}
            onChange={(e) => setSchoolType(e.target.value)}
            className="w-full rounded-xl border border-border px-3 py-2"
          >
            <option value="medie">Medie</option>
            <option value="superiori">Superiori</option>
            <option value="universita">Università</option>
            <option value="altro">Altro</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[#6B7280]">Classe/Anno</span>
          <input
            value={classYear}
            onChange={(e) => setClassYear(e.target.value)}
            className="w-full rounded-xl border border-border px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[#6B7280]">Preferenze</span>
          <textarea
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            className="w-full rounded-xl border border-border px-3 py-2"
            rows={3}
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-mentor-orange px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Salvataggio..." : "Continua"}
        </button>
      </form>
    </div>
  );
}
