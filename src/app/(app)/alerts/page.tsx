"use client";

import { useEffect } from "react";
import { BellRing, CalendarX2, Info } from "lucide-react";
import { useDriver } from "@/lib/store";
import { ago } from "@/lib/format";

const ICON: Record<string, typeof BellRing> = { booking_new: BellRing, booking_cancelled: CalendarX2 };

export default function AlertsPage() {
  const { alerts, unread, markAlertsRead } = useDriver();

  // opening the screen counts as reading, but keep the unread dots visible this visit
  useEffect(() => {
    if (unread === 0) return;
    const t = setTimeout(() => void markAlertsRead(), 2500);
    return () => clearTimeout(t);
  }, [unread, markAlertsRead]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl space-y-5 p-4 lg:p-8">
        <h1 className="text-2xl font-extrabold tracking-tight lg:text-3xl">Alerts</h1>
        {alerts.length === 0 ? (
          <p className="text-muted">Nothing yet. New bookings and cancellations show up here.</p>
        ) : (
          <div className="divide-y divide-line/10 overflow-hidden rounded-3xl bg-surface">
            {alerts.map((a) => {
              const Icon = ICON[a.kind] ?? Info;
              return (
                <div key={a.id} className="flex gap-4 p-4">
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${a.kind === "booking_cancelled" ? "bg-danger/10 text-danger" : "bg-brand/15 text-brand"}`}>
                    <Icon size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold">{a.title}</span>
                      {!a.readAt && <span className="h-2 w-2 rounded-full bg-danger" />}
                    </div>
                    <p className="mt-0.5 text-sm text-muted">{a.body}</p>
                    <p className="mt-1 text-xs text-muted/70">{ago(a.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
