export type MealEntry = {
  /** cost in BDT; 0 when skipped */
  cost: number;
  skipped: boolean;
};

export type MealMap = Record<string, MealEntry>;

const STORAGE_KEY = "meal-ledger-v1";

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

export function loadEntries(): MealMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as MealMap) : {};
  } catch {
    return {};
  }
}

export function saveEntries(map: MealMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // storage full or unavailable — ignore
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
