"use client";

import { useMemo } from "react";
import { useDriver } from "@/lib/store";
import { dayLabel, rupees, sameDay } from "@/lib/format";

export default function EarningsPage() {
  const { bookings, today } = useDriver();
  const done = useMemo(() => bookings.filter((b) => b.status === "completed"), [bookings]);

  const days = useMemo(() => {
    const out: Array<{ label: string; total: number; trips: number; isToday: boolean }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const mine = done.filter((b) => sameDay(new Date(b.updatedAt), d));
      out.push({ label: dayLabel(d), total: mine.reduce((n, b) => n + b.fare, 0), trips: mine.length, isToday: i === 0 });
    }
    return out;
  }, [done]);

  const week = days.reduce((n, d) => n + d.total, 0);
  const weekTrips = days.reduce((n, d) => n + d.trips, 0);
  const max = Math.max(1, ...days.map((d) => d.total));
  const lifetime = done.reduce((n, b) => n + b.fare, 0);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl space-y-5 p-4 lg:p-8">
        <h1 className="text-2xl font-extrabold tracking-tight lg:text-3xl">Earnings</h1>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-3xl bg-brand p-6 text-brandInk">
            <div className="text-xs font-bold uppercase tracking-wider opacity-70">Today</div>
            <div className="mt-1 text-5xl font-extrabold tracking-tight">{rupees(today.earnings)}</div>
            <div className="mt-2 text-sm font-semibold opacity-80">
              {today.trips} trips · {today.km.toFixed(1)} km
            </div>
          </div>
          <div className="rounded-3xl bg-surface p-6">
            <div className="text-xs font-bold uppercase tracking-wider text-muted">All completed trips</div>
            <div className="mt-1 text-4xl font-extrabold tracking-tight">{rupees(lifetime)}</div>
            <div className="mt-1 text-sm text-muted">{done.length} trips</div>
          </div>
        </div>

        <div className="rounded-3xl bg-surface p-5 lg:p-6">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-muted">Last 7 days</div>
              <div className="text-3xl font-extrabold tracking-tight">{rupees(week)}</div>
            </div>
            <div className="text-right text-sm text-muted">
              {weekTrips} trips
              <br />
              avg {rupees(weekTrips ? week / weekTrips : 0)} / trip
            </div>
          </div>
          <div className="mt-6 flex h-44 items-end gap-2.5 lg:gap-4">
            {days.map((d) => (
              <div key={d.label + d.isToday} className="flex flex-1 flex-col items-center gap-2">
                <div className="text-[10px] font-bold text-muted">{d.total ? rupees(d.total) : ""}</div>
                <div className="flex w-full flex-1 items-end">
                  <div className={`w-full rounded-t-xl transition-all ${d.isToday ? "bg-brand" : "bg-surface2"}`} style={{ height: `${Math.max(4, (d.total / max) * 100)}%` }} />
                </div>
                <div className={`text-xs font-bold ${d.isToday ? "text-brand" : "text-muted"}`}>{d.label}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="px-1 text-xs text-muted">Earnings are the estimated fare of each completed booking. Payments between you and the traveller happen directly at the end of the trip.</p>
      </div>
    </div>
  );
}
