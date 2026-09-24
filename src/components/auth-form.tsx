import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";

export function AuthForm() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    const result =
      mode === "sign-in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setBusy(false);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    if (mode === "sign-up" && !result.data.session) {
      setMessage("Check your email to confirm your account, then sign in.");
      setMode("sign-in");
      return;
    }

    navigate({ to: "/home" });
  }

  return (
    <section className="animate-rise rounded-[22px] bg-card p-5 ring-1 ring-black/5 [animation-delay:180ms]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
            {mode === "sign-in" ? "YOUR LEDGER" : "NEW ACCOUNT"}
          </p>
          <h2 className="mt-1 font-display text-[24px] font-semibold italic">
            {mode === "sign-in" ? "Welcome back" : "Start saving securely"}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => {
            setMode(mode === "sign-in" ? "sign-up" : "sign-in");
            setMessage(null);
          }}
          className="font-mono text-[11px] uppercase tracking-wide text-faint hover:text-primary"
        >
          {mode === "sign-in" ? "Sign up" : "Sign in"}
        </button>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <input
          required
          type="email"
          autoComplete="email"
          placeholder="Email address"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-[14px] border border-border bg-transparent px-4 py-3 text-[14px] outline-none placeholder:text-faint focus:border-primary"
        />
        <input
          required
          minLength={6}
          type="password"
          autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-[14px] border border-border bg-transparent px-4 py-3 text-[14px] outline-none placeholder:text-faint focus:border-primary"
        />
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-[14px] bg-primary py-3.5 font-display text-[15px] font-semibold italic text-primary-foreground transition-colors active:bg-primary/90 disabled:opacity-60"
        >
          {busy ? "Please wait..." : mode === "sign-in" ? "Sign in" : "Create account"}
        </button>
      </form>

      {message ? <p className="mt-3 text-[12px] leading-relaxed text-body">{message}</p> : null}
    </section>
  );
}
