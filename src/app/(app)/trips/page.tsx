"use client";

import { useMemo } from "react";
import { Star } from "lucide-react";
import { useDriver } from "@/lib/store";
import { rupees, sameDay, whenLabel } from "@/lib/format";
import type { BookingStatus } from "@/lib/types";

const STATUS: Record<BookingStatus, { label: string; tone: string }> = {
  requested: { label: "Waiting", tone: "bg-brand/15 text-brand" },
  accepted: { label: "Accepted", tone: "bg-go/15 text-go" },
  arrived: { label: "At pickup", tone: "bg-go/15 text-go" },
  started: { label: "In trip", tone: "bg-go/15 text-go" },
  completed: { label: "Completed", tone: "bg-surface2 text-ink" },
  declined: { label: "Declined", tone: "bg-surface2 text-muted" },
  cancelled: { label: "Cancelled", tone: "bg-danger/10 text-danger" },
  expired: { label: "Missed", tone: "bg-surface2 text-muted" },
};

function heading(d: Date): string {
  const now = new Date();
  const y = new Date();
  y.setDate(now.getDate() - 1);
  if (sameDay(d, now)) return "Today";
  if (sameDay(d, y)) return "Yesterday";
  return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" });
}

export default function TripsPage() {
  const { bookings } = useDriver();

  const groups = useMemo(() => {
    const map = new Map<string, typeof bookings>();
    for (const b of bookings) {
      const key = heading(new Date(b.createdAt));
      map.set(key, [...(map.get(key) ?? []), b]);
    }
    return [...map.entries()];
  }, [bookings]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-6 p-4 lg:p-8">
        <h1 className="text-2xl font-extrabold tracking-tight lg:text-3xl">Bookings</h1>
        {groups.length === 0 && <p className="text-muted">No bookings yet. Once you&apos;re listed, travellers can book your car from Saafera.</p>}
        {groups.map(([day, list]) => (
          <section key={day}>
            <h2 className="mb-2 px-1 text-sm font-extrabold uppercase tracking-wider text-muted">{day}</h2>
            <div className="divide-y divide-line/10 overflow-hidden rounded-3xl bg-surface">
              {list.map((b) => {
                const s = STATUS[b.status];
                return (
                  <div key={b.id} className="flex items-center gap-4 p-4">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold">
                        {b.pickupText} → {b.dropText}
                      </div>
                      <div className="mt-0.5 text-xs text-muted">
                        {whenLabel(b.pickupAt)} · {b.userName ?? "Traveller"}
                        {b.distanceKm ? ` · ~${b.distanceKm} km` : ""}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-extrabold">{rupees(b.fare)}</div>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${s.tone}`}>{s.label}</span>
                      {b.status === "completed" && b.rating && (
                        <div className="mt-1 flex items-center justify-end gap-0.5 text-xs font-bold">
                          <Star size={12} className="fill-brand text-brand" /> {b.rating}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
