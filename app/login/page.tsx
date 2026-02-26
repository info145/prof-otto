"use client";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const onGoogle = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-white p-6 shadow-soft">
        <h1 className="mb-2 text-xl font-semibold">Accedi</h1>
        <p className="mb-5 text-sm text-[#6B7280]">Entra con Google per usare Prof Otto.</p>
        <button
          type="button"
          onClick={onGoogle}
          className="w-full rounded-xl bg-mentor-orange px-4 py-2 text-sm font-medium text-white"
        >
          Accedi con Google
        </button>
      </div>
    </div>
  );
}
