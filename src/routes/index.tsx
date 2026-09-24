import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthForm } from "@/components/auth-form";
import { isStandalone, useInstall } from "@/lib/install";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Meal Ledger — Daily Meal Cost Tracker" },
      {
        name: "description",
        content:
          "A simple, private daily meal cost tracker. Log meals in Taka, skip days you don't eat, and download monthly totals as PDF. Install the app to begin.",
      },
      { property: "og:title", content: "Meal Ledger — Daily Meal Cost Tracker" },
      {
        property: "og:description",
        content:
          "A simple, private daily meal cost tracker. Log meals in Taka, skip days you don't eat, and download monthly totals as PDF.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,600;1,9..144,700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    title: "Log in seconds",
    body: "One tap a day. Enter today's meal cost in Taka and you're done.",
  },
  {
    title: "Mistakes are fine",
    body: "Tap any past day to edit or clear it. Nothing is locked in.",
  },
  {
    title: "Skipped days count",
    body: "Mark days you didn't eat so monthly totals and averages stay honest.",
  },
  {
    title: "Monthly PDF",
    body: "Download a clean PDF of the month's total whenever you need it.",
  },
];

const SOCIALS = [
  { label: "Facebook", href: "https://facebook.com" },
  { label: "Instagram", href: "https://instagram.com" },
  { label: "X / Twitter", href: "https://x.com" },
  { label: "GitHub", href: "https://github.com" },
];

function Landing() {
  const navigate = useNavigate();
  const { installed, ready, promptInstall } = useInstall();
  const [iosHelp, setIosHelp] = useState(false);
  const [manualHelp, setManualHelp] = useState(false);

  // Installed apps open straight to the tracker — skip the landing page.
  useEffect(() => {
    if (isStandalone()) {
      navigate({ to: "/home", replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate({ to: "/home", replace: true });
    });
  }, [navigate]);

  async function handleInstall() {
    const result = await promptInstall();
    if (result === "ios") {
      setIosHelp(true);
      setManualHelp(false);
    } else if (result === "manual") {
      setManualHelp(true);
    }
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased">
      <div className="mx-auto max-w-[420px] px-6 pb-16 pt-8">
        <header className="flex animate-rise items-center justify-between pb-10">
          <span className="font-display text-[17px] font-semibold italic">Meal Ledger</span>
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
            est. 2026
          </span>
        </header>

        <section className="animate-rise pb-10 [animation-delay:60ms]">
          <p className="mb-3 font-mono text-[11px] tracking-[0.2em] text-primary">
            DAILY MEAL COST TRACKER
          </p>
          <h1 className="font-display text-[44px] font-semibold leading-[1.05] tracking-tight">
            Know what your meals <span className="italic text-primary">really</span> cost.
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-body">
            Meal Ledger is a tiny, private app for tracking daily meal expenses in Taka. Log a day
            in one tap, mark days you didn't eat, fix mistakes anytime, and download a monthly total
            as PDF. Your ledger syncs securely across your devices.
          </p>
        </section>

        <section className="animate-rise pb-10 [animation-delay:140ms]">
          {ready && installed ? (
            <Link
              to="/home"
              className="flex w-full items-center justify-between rounded-[18px] bg-foreground px-5 py-4 text-background transition-colors active:bg-foreground/90"
            >
              <span className="text-left">
                <span className="block font-display text-[15px] font-semibold italic">
                  App installed
                </span>
                <span className="block text-[12px] opacity-70">You're all set — jump back in</span>
              </span>
              <span className="rounded-full bg-background px-4 py-2 font-display text-[13px] font-semibold italic text-foreground">
                Open app →
              </span>
            </Link>
          ) : (
            <>
              <button
                onClick={handleInstall}
                className="flex w-full items-center justify-between rounded-[18px] bg-primary px-5 py-4 text-primary-foreground transition-colors active:bg-primary/90"
              >
                <span className="text-left">
                  <span className="block font-display text-[15px] font-semibold italic">
                    Install to continue
                  </span>
                  <span className="block text-[12px] opacity-80">
                    The tracker only runs as an installed app
                  </span>
                </span>
                <span className="rounded-full bg-background px-4 py-2 font-display text-[13px] font-semibold italic text-foreground">
                  Install ↓
                </span>
              </button>
              <p className="mt-3 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
                Installation required to use the tracker
              </p>
              {iosHelp && (
                <p className="mt-3 rounded-[14px] border border-border bg-card px-4 py-3 text-[13px] leading-relaxed text-body">
                  On iPhone: tap the <span className="font-semibold text-foreground">Share</span>{" "}
                  button (square with arrow) in Safari, then choose{" "}
                  <span className="font-semibold text-foreground">“Add to Home Screen”</span>. Then
                  open Meal Ledger from your home screen.
                </p>
              )}
              {manualHelp && (
                <p className="mt-3 rounded-[14px] border border-border bg-card px-4 py-3 text-[13px] leading-relaxed text-body">
                  Open your browser menu and choose{" "}
                  <span className="font-semibold text-foreground">“Install app”</span> or{" "}
                  <span className="font-semibold text-foreground">“Add to Home screen”</span>, then
                  open Meal Ledger from your home screen.
                </p>
              )}
            </>
          )}
        </section>

        <AuthForm />

        <section className="animate-rise pb-10 [animation-delay:220ms]">
          <p className="mb-3 font-mono text-[11px] tracking-[0.2em] text-faint">
            WHY YOU'LL LIKE IT
          </p>
          <div className="border-t border-border">
            {FEATURES.map((f) => (
              <div key={f.title} className="border-b border-border py-4">
                <h2 className="font-display text-[16px] font-semibold italic">{f.title}</h2>
                <p className="mt-1 text-[13px] leading-relaxed text-body">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="animate-rise [animation-delay:300ms]">
          <p className="mb-3 font-mono text-[11px] tracking-[0.2em] text-faint">FOLLOW</p>
          <div className="flex flex-wrap gap-2">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-border px-4 py-2 text-[13px] font-medium text-body transition-colors hover:border-primary hover:text-primary"
              >
                {s.label}
              </a>
            ))}
          </div>
          <p className="mt-8 text-[11px] text-faint">
            Meal Ledger — your private ledger, wherever you are.
          </p>
        </footer>
      </div>
    </div>
  );
}
