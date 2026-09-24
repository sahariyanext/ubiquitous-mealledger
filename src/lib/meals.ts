import { supabase } from "./supabase";

export type MealEntry = {
  /** cost in BDT; 0 when skipped */
  cost: number;
  skipped: boolean;
};

export type MealMap = Record<string, MealEntry>;

export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function monthKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export async function loadEntries(userId: string): Promise<MealMap> {
  const { data, error } = await supabase
    .from("meal_entries")
    .select("meal_date, cost, skipped")
    .eq("user_id", userId);

  if (error) throw error;

  return Object.fromEntries(
    (data ?? []).map((entry) => [
      entry.meal_date,
      { cost: Number(entry.cost), skipped: entry.skipped },
    ]),
  );
}

export async function saveEntry(
  userId: string,
  key: string,
  entry: MealEntry | null,
): Promise<void> {
  const query = supabase.from("meal_entries");

  if (entry === null) {
    const { error } = await query.delete().eq("user_id", userId).eq("meal_date", key);
    if (error) throw error;
    return;
  }

  const { error } = await query.upsert(
    {
      user_id: userId,
      meal_date: key,
      cost: entry.cost,
      skipped: entry.skipped,
    },
    { onConflict: "user_id,meal_date" },
  );

  if (error) {
    throw error;
  }
}

/** Days of the given month from day 1 up to `today`, newest first. */
export function daysUpToToday(today: Date): Date[] {
  const out: Date[] = [];
  const y = today.getFullYear();
  const m = today.getMonth();
  for (let day = today.getDate(); day >= 1; day--) {
    out.push(new Date(y, m, day));
  }
  return out;
}

export function monthTotal(entries: MealMap, today: Date): number {
  const prefix = monthKey(today);
  let sum = 0;
  for (const [k, v] of Object.entries(entries)) {
    if (k.startsWith(prefix) && !v.skipped && typeof v.cost === "number") {
      sum += v.cost;
    }
  }
  return sum;
}

export function monthStats(entries: MealMap, today: Date) {
  const prefix = monthKey(today);
  let logged = 0;
  let skipped = 0;
  let sum = 0;
  for (const [k, v] of Object.entries(entries)) {
    if (!k.startsWith(prefix)) continue;
    if (v.skipped) {
      skipped++;
    } else if (v.cost > 0) {
      logged++;
      sum += v.cost;
    }
  }
  return { logged, skipped, sum, avg: logged > 0 ? sum / logged : 0 };
}

export function formatBDT(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  const str = rounded % 1 === 0 ? String(rounded) : rounded.toFixed(2);
  const parts = str.split(".");
  const int = parts[0] ?? "0";
  const dec = parts[1];
  const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `৳${withCommas}${dec ? `.${dec}` : ""}`;
}

export function monthLabel(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function shortDayLabel(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
