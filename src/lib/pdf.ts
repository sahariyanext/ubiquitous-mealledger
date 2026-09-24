import { jsPDF } from "jspdf";
import {
  daysUpToToday,
  dateKey,
  monthLabel,
  monthStats,
  type MealMap,
} from "./meals";

/** Generate and download a monthly meal-cost summary PDF. */
export function downloadMonthPdf(entries: MealMap, today: Date) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 48;
  let y = 64;

  const title = `Meal Cost Summary — ${monthLabel(today)}`;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(title, margin, y);
  y += 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(
    `Generated on ${today.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })}`,
    margin,
    y,
  );
  y += 24;

  // Table header
  doc.setDrawColor(200);
  doc.setTextColor(0);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Date", margin, y);
  doc.text("Day", margin + 140, y);
  doc.text("Cost (BDT)", pageW - margin, y, { align: "right" });
  y += 6;
  doc.line(margin, y, pageW - margin, y);
  y += 18;

  doc.setFont("helvetica", "normal");

  const days = daysUpToToday(today).slice().reverse(); // oldest first
  let sum = 0;

  for (const d of days) {
    if (y > 780) {
      doc.addPage();
      y = 64;
    }
    const entry = entries[dateKey(d)];
    const dateStr = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const dayStr = d.toLocaleDateString("en-US", { weekday: "long" });

    doc.setTextColor(0);
    doc.text(dateStr, margin, y);
    doc.text(dayStr, margin + 140, y);

    if (entry?.skipped) {
      doc.setTextColor(150);
      doc.text("no meal", pageW - margin, y, { align: "right" });
    } else if (entry && entry.cost > 0) {
      sum += entry.cost;
      doc.text(`Tk ${entry.cost.toFixed(2)}`, pageW - margin, y, {
        align: "right",
      });
    } else {
      doc.setTextColor(180);
      doc.text("—", pageW - margin, y, { align: "right" });
    }
    y += 18;
  }

  // Totals
  const stats = monthStats(entries, today);
  y += 8;
  doc.line(margin, y, pageW - margin, y);
  y += 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(0);
  doc.text("Total", margin, y);
  doc.text(`Tk ${sum.toFixed(2)}`, pageW - margin, y, { align: "right" });
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(
    `${stats.logged} meal day${stats.logged === 1 ? "" : "s"} · ${stats.skipped} skipped · avg Tk ${stats.avg.toFixed(2)} per meal day`,
    margin,
    y,
  );

  const safeMonth = monthLabel(today).replace(/\s+/g, "-").toLowerCase();
  doc.save(`meal-cost-${safeMonth}.pdf`);
}
