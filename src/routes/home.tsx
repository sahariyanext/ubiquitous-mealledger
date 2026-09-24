import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  dateKey,
  daysUpToToday,
  formatBDT,
  loadEntries,
  monthLabel,
  monthStats,
  saveEntry,
  type MealMap,
} from "@/lib/meals";
import { downloadMonthPdf } from "@/lib/pdf";
import { useInstall } from "@/lib/install";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Home — Meal Ledger" },
      {
        name: "description",
        content:
          "Log your daily meal cost in Taka, skip days you don't eat, edit mistakes, and download a monthly total as PDF.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const { installed, ready: installReady } = useInstall();
  const [entries, setEntries] = useState<MealMap>({});
  const [ready, setReady] = useState(false);
  const [today, setToday] = useState<Date>(() => new Date());
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (installReady && !installed) {
      navigate({ to: "/", replace: true });
    }
  }, [installReady, installed, navigate]);

  useEffect(() => {
    let active = true;

    async function loadUserEntries() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate({ to: "/", replace: true });
        return;
      }

      try {
        const nextEntries = await loadEntries(session.user.id);
        if (active) {
          setUserId(session.user.id);
          setEntries(nextEntries);
          setToday(new Date());
          setReady(true);
        }
      } catch (error) {
        console.error(error);
        if (active) setToast("Could not load your meals");
      }
    }

    void loadUserEntries();
    return () => {
      active = false;
    };
  }, [navigate]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  const todayKey = dateKey(today);
  const stats = useMemo(() => monthStats(entries, today), [entries, today]);
  const days = useMemo(() => daysUpToToday(today), [today]);

  function update(key: string, entry: MealMap[string] | null) {
    setEntries((prev) => {
      const next = { ...prev };
      if (entry === null) delete next[key];
      else next[key] = entry;

      if (userId) {
        void saveEntry(userId, key, entry).catch((error) => {
          console.error(error);
          setToast("Could not save your meal");
        });
      }

      return next;
    });
  }

  function commitDraft(key: string) {
    const value = parseFloat(draft.replace(/[^\d.]/g, ""));
    if (!draft.trim() || Number.isNaN(value) || value < 0) {
      setEditing(null);
      setDraft("");
      return;
    }
    update(key, { cost: Math.round(value * 100) / 100, skipped: false });
    setEditing(null);
    setDraft("");
    setToast("Saved");
  }

  const todayEntry = entries[todayKey];

  if (!ready || !installReady || !installed) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased">
      <div className="mx-auto max-w-[420px] px-6 pb-32 pt-6">
        <header className="flex animate-rise items-center justify-between pb-6">
          <span className="font-display text-[17px] font-semibold italic">Meal Ledger</span>
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
            {monthLabel(today)}
          </span>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/", replace: true });
            }}
            className="font-mono text-[11px] uppercase tracking-wide text-faint transition-colors hover:text-primary"
          >
            Sign out
          </button>
        </header>

        <section className="animate-rise pb-7 [animation-delay:70ms]">
          <p className="mb-2 font-mono text-[11px] tracking-[0.2em] text-faint">MONTH TOTAL</p>
          <div className="font-display text-[68px] font-semibold leading-none tracking-tight tabular-nums">
            {formatBDT(stats.sum)}
          </div>
          <p className="mt-3 text-[13px] text-body">
            {stats.logged} meal day{stats.logged === 1 ? "" : "s"}
            {stats.skipped > 0 ? ` · ${stats.skipped} skipped` : ""}
            {stats.logged > 0 ? ` · ${formatBDT(stats.avg)} avg` : ""}
          </p>
        </section>

        {/* Today card */}
        <section className="mb-8 animate-rise rounded-[22px] bg-card p-5 ring-1 ring-black/5 [animation-delay:150ms]">
          <div className="mb-4 flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
              Today ·{" "}
              {today.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
            {todayEntry ? (
              <button
                onClick={() => update(todayKey, null)}
                className="font-mono text-[11px] uppercase tracking-wide text-faint transition-colors hover:text-primary"
              >
                Clear
              </button>
            ) : null}
          </div>

          {todayEntry?.skipped ? (
            <p className="mb-5 font-display text-[32px] font-semibold leading-none text-body">
              No meal today
            </p>
          ) : (
            <div className="mb-5 flex items-center gap-2">
              <span className="font-mono text-[18px] text-faint">৳</span>
              <input
                type="text"
                inputMode="decimal"
                aria-label="Today's meal cost"
                placeholder="0"
                maxLength={9}
                value={editing === todayKey ? draft : todayEntry ? String(todayEntry.cost) : ""}
                onFocus={() => {
                  setEditing(todayKey);
                  setDraft(todayEntry ? String(todayEntry.cost) : "");
                }}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
                onBlur={() => commitDraft(todayKey)}
                className="w-full bg-transparent font-display text-[40px] font-semibold leading-none tracking-tight outline-none placeholder:text-faint/50"
              />
            </div>
          )}

          <button
            onClick={() => {
              if (editing === todayKey) commitDraft(todayKey);
              else setToast("Tap the amount to enter today's cost");
            }}
            className="mb-3 w-full rounded-[14px] bg-primary py-3.5 font-display text-[15px] font-semibold italic text-primary-foreground transition-colors active:bg-primary/90"
          >
            Save today's entry
          </button>
          <button
            onClick={() => {
              if (todayEntry?.skipped) update(todayKey, null);
              else update(todayKey, { cost: 0, skipped: true });
            }}
            className="w-full rounded-[14px] border border-border py-3 text-[13px] font-medium text-body transition-colors active:bg-secondary"
          >
            {todayEntry?.skipped ? "Undo — I did eat" : "No meal today"}
          </button>
        </section>

        {/* Day list */}
        <section className="animate-rise [animation-delay:220ms]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-mono text-[11px] tracking-[0.2em] text-faint">THIS MONTH</h2>
            <span className="font-mono text-[11px] text-faint">TAP TO EDIT</span>
          </div>
          <div className="border-t border-border">
            {days.map((d, i) => {
              const key = dateKey(d);
              const entry = entries[key];
              const isToday = key === todayKey;
              const isEditing = editing === key && !isToday;
              return (
                <div
                  key={key}
                  className="flex animate-slide items-center justify-between gap-3 border-b border-border py-4"
                  style={{ animationDelay: `${240 + Math.min(i, 12) * 45}ms` }}
                >
                  <span className="flex items-baseline gap-2 text-[15px] font-medium">
                    <span
                      className={`font-display font-semibold italic ${isToday ? "text-primary" : ""}`}
                    >
                      {d.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="text-[11px] text-faint">
                      {isToday ? "today" : d.toLocaleDateString("en-US", { weekday: "short" })}
                    </span>
                  </span>

                  {isEditing ? (
                    <span className="flex items-center gap-1">
                      <span className="font-mono text-[13px] text-faint">৳</span>
                      <input
                        autoFocus
                        type="text"
                        inputMode="decimal"
                        maxLength={9}
                        aria-label={`Cost for ${key}`}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.currentTarget.blur();
                          if (e.key === "Escape") {
                            setEditing(null);
                            setDraft("");
                          }
                        }}
                        onBlur={() => commitDraft(key)}
                        className="w-24 border-b border-primary bg-transparent text-right font-mono text-[15px] tabular-nums outline-none"
                      />
                    </span>
                  ) : (
                    <span className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          if (isToday) return;
                          setEditing(key);
                          setDraft(entry && !entry.skipped ? String(entry.cost) : "");
                        }}
                        className="font-mono text-[15px] tabular-nums transition-colors hover:text-primary"
                      >
                        {entry?.skipped ? (
                          <span className="text-primary">no meal</span>
                        ) : entry ? (
                          formatBDT(entry.cost)
                        ) : (
                          <span className="text-faint">add</span>
                        )}
                      </button>
                      <button
                        aria-label={`Toggle no meal for ${key}`}
                        onClick={() => {
                          if (entry?.skipped) update(key, null);
                          else update(key, { cost: 0, skipped: true });
                        }}
                        className="font-mono text-[13px] text-faint transition-colors hover:text-primary"
                      >
                        {entry?.skipped ? "↺" : "✕"}
                      </button>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {toast ? (
        <div className="fixed bottom-24 left-1/2 z-30 -translate-x-1/2 animate-pop rounded-full bg-foreground px-4 py-2 text-[12px] font-medium text-background shadow-lg">
          {toast}
        </div>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-20 bg-background/85 backdrop-blur-sm">
        <div className="mx-auto max-w-[420px] px-6 py-4">
          <button
            onClick={() => downloadMonthPdf(entries, today)}
            className="flex w-full animate-pop items-center justify-center gap-2.5 rounded-[16px] bg-foreground py-4 font-display text-[16px] font-semibold italic text-background transition-colors active:bg-foreground/90 [animation-delay:680ms]"
          >
            <span className="font-mono text-[13px] tracking-wide">↓</span>
            Download {today.toLocaleDateString("en-US", { month: "long" })} PDF
          </button>
        </div>
      </div>
    </div>
  );
}
