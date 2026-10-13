"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing, Clock, MapPin, Users } from "lucide-react";
import { useDriver } from "@/lib/store";
import { rupees, whenLabel } from "@/lib/format";

/** Slides in over any screen when a traveller books this driver's vehicle. */
export function BookingPopup() {
  const { popup, dismissPopup, act } = useDriver();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  if (!popup) return null;

  async function respond(action: "accept" | "decline") {
    if (!popup) return;
    setBusy(true);
    setErr("");
    const e = await act(popup.id, action);
    setBusy(false);
    if (e) return setErr(e);
    dismissPopup();
    if (action === "accept") router.push("/drive");
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center p-3 lg:p-5">
      <div className="pointer-events-auto w-full max-w-md animate-rise rounded-3xl border border-brand/40 bg-surface p-5 shadow-[0_25px_60px_-12px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-3">
          <span className="relative grid h-11 w-11 place-items-center rounded-full bg-brand text-brandInk">
            <span className="absolute inset-0 animate-ping2 rounded-full bg-brand/40" />
            <BellRing size={21} className="relative" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-brand">New booking request</div>
            <div className="truncate text-lg font-extrabold">{popup.userName ?? "A traveller"}</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-extrabold">{rupees(popup.fare)}</div>
            {popup.distanceKm && <div className="text-xs text-muted">~{popup.distanceKm} km</div>}
          </div>
        </div>

        <div className="mt-4 space-y-1.5 text-sm">
          <div className="flex gap-2">
            <MapPin size={16} className="mt-0.5 shrink-0 text-go" /> <span className="font-semibold">{popup.pickupText}</span>
          </div>
          <div className="flex gap-2">
            <MapPin size={16} className="mt-0.5 shrink-0 text-danger" /> <span className="font-semibold">{popup.dropText}</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-muted">
            <span className="flex items-center gap-1">
              <Clock size={13} /> {whenLabel(popup.pickupAt)}
            </span>
            <span className="flex items-center gap-1">
              <Users size={13} /> {popup.passengers} {popup.passengers === 1 ? "person" : "people"}
            </span>
          </div>
        </div>

        {err && <p className="mt-3 text-sm font-semibold text-danger">{err}</p>}
        <div className="mt-4 grid grid-cols-[1fr_1fr_2fr] gap-2.5">
          <button disabled={busy} onClick={dismissPopup} className="rounded-2xl bg-surface2 py-3 text-sm font-bold">
            Later
          </button>
          <button disabled={busy} onClick={() => respond("decline")} className="rounded-2xl bg-danger/15 py-3 text-sm font-extrabold text-danger disabled:opacity-50">
            Decline
          </button>
          <button disabled={busy} onClick={() => respond("accept")} className="rounded-2xl bg-go py-3 text-sm font-extrabold text-white disabled:opacity-50">
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
