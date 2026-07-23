"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { migrateGuestDataToSupabase } from "@/lib/supabase/sync";

type Status = "idle" | "sending" | "sent" | "signed-in" | "error" | "unavailable";

export default function SaveMyPlan() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    // One-time mount check of environment availability and auth state — not
    // a storage mirror (createClient()/getUser() aren't a subscribable
    // store), and the sign-in branch below is already async, so this doesn't
    // fit useSyncExternalStore.
    const supabase = createClient();
    if (!supabase) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time mount check; see comment above
      setStatus("unavailable");
      return;
    }
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        await migrateGuestDataToSupabase();
        setStatus("signed-in");
      }
    });
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const supabase = createClient();
    if (!supabase) {
      setStatus("unavailable");
      return;
    }
    setStatus("sending");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setStatus(error ? "error" : "sent");
  }

  if (status === "unavailable") {
    return (
      <div aria-live="polite" className="rounded-2xl bg-canvas p-5 text-center text-sm text-ink-soft">
        Your plan is saved on this device. Account sync is coming soon.
      </div>
    );
  }

  if (status === "signed-in") {
    return (
      <div aria-live="polite" className="rounded-2xl bg-success-soft p-5 text-center text-sm text-success">
        Your plan is saved. Come back anytime from any device.
      </div>
    );
  }

  if (status === "sent") {
    return (
      <div aria-live="polite" className="rounded-2xl bg-canvas p-5 text-center text-sm text-ink-soft">
        Check your email for a magic link to finish saving your plan.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-5 shadow-sm" aria-live="polite">
      <p className="text-sm font-medium text-primary">Save your plan</p>
      <p className="mt-1 text-xs text-ink-soft">
        Save your plan so you can access it from any device.
      </p>
      <div className="mt-3 flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="h-11 flex-1 rounded-full border border-border px-4 text-sm focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="h-11 rounded-full bg-primary px-4 text-sm font-medium text-white disabled:opacity-60"
        >
          {status === "sending" ? "Sending..." : "Save"}
        </button>
      </div>
      {status === "error" && (
        <p className="mt-2 text-xs text-danger">Something went wrong. Please try again.</p>
      )}
    </form>
  );
}
