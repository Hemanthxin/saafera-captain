"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { BadgeCheck, BellRing, CalendarClock, Clock, FileClock, MapPin, Navigation, Pause, Phone, Play, ShieldAlert, Users, X } from "lucide-react";
import { useDriver } from "@/lib/store";
import { rupees, whenLabel } from "@/lib/format";
import type { Booking } from "@/lib/types";

const btn = "flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-base font-extrabold transition active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100";

/** Re-renders every second, for countdowns. */
function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

// Mirrors the server rule: arrival can be marked from this long before pickup.
const EARLY_MS = 90 * 60000;

const hhmm = (ms: number) => new Date(ms).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
const mmss = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

function PushBanner() {
  const { push, pushError, turnOnPush } = useDriver();
  if (push === "loading" || push === "unconfigured") return null;

  if (push === "on") {
    return (
      <div className="mb-4 flex items-center gap-2 rounded-2xl bg-go/10 px-4 py-2.5 text-xs font-bold text-go">
        <BellRing size={15} /> Alerts are on — you&apos;ll be notified even when this app is closed.
      </div>
    );
  }
  const text =
    push === "unsupported"
      ? "This browser can't send alerts when closed. On iPhone, tap Share → Add to Home Screen first; on Android use Chrome."
      : push === "denied"
        ? "Alerts are blocked. Allow notifications for this site in your browser settings to be told about new bookings when the app is closed."
        : "Turn on alerts so a new booking reaches you instantly — even when the app is closed or your screen is off.";
  return (
    <div className="mb-4 rounded-2xl border border-brand/40 bg-brand/10 p-4">
      <div className="flex items-start gap-3">
        <BellRing size={20} className="mt-0.5 shrink-0 text-brand" />
        <p className="text-sm">{text}</p>
      </div>
      {pushError && <p className="mt-2 text-xs font-semibold text-danger">{pushError}</p>}
      {push === "off" && (
        <button onClick={turnOnPush} className="mt-3 w-full rounded-xl bg-brand py-2.5 text-sm font-extrabold text-brandInk">
          Turn on alerts
        </button>
      )}
    </div>
  );
}

function navLink(text: string, lat: number | null, lng: number | null) {
  const dest = lat != null && lng != null ? `${lat},${lng}` : encodeURIComponent(text);
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`;
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="hairline safe-b absolute inset-x-0 bottom-0 z-20 max-h-[72%] overflow-y-auto rounded-t-3xl border-t bg-surface p-5 shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.5)] lg:relative lg:max-h-none lg:w-[26rem] lg:shrink-0 lg:overflow-y-auto lg:rounded-none lg:border-l lg:border-t-0 lg:p-6 lg:shadow-none">
      <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line/20 lg:hidden" />
      <div className="animate-rise">{children}</div>
    </div>
  );
}

function Route({ b }: { b: Booking }) {
  return (
    <div className="relative space-y-3.5 pl-7">
      <span className="absolute bottom-3 left-[7px] top-3 w-0.5 bg-line/20" />
      <div className="relative">
        <span className="absolute -left-7 top-1 h-3.5 w-3.5 rounded-full border-[3px] border-go bg-surface" />
        <div className="text-[11px] font-bold uppercase tracking-wider text-muted">Pickup</div>
        <div className="font-bold leading-tight">{b.pickupText}</div>
      </div>
      <div className="relative">
        <span className="absolute -left-7 top-1 h-3.5 w-3.5 rounded-sm bg-danger" />
        <div className="text-[11px] font-bold uppercase tracking-wider text-muted">Drop</div>
        <div className="font-bold leading-tight">{b.dropText}</div>
      </div>
    </div>
  );
}

function Meta({ b }: { b: Booking }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
      <span className="flex items-center gap-1">
        <Clock size={13} /> {whenLabel(b.pickupAt)}
      </span>
      <span className="flex items-center gap-1">
        <Users size={13} /> {b.passengers}
      </span>
      {b.distanceKm && (
        <span className="flex items-center gap-1">
          <MapPin size={13} /> ~{b.distanceKm} km
        </span>
      )}
    </div>
  );
}

export function DrivePanel() {
  const { vehicle, requests, active, upcoming, today, setAvailable, act } = useDriver();
  const now = useNow();
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");
  const [code, setCode] = useState("");

  async function run(id: string, action: Parameters<typeof act>[1], otp?: string) {
    setBusy(id + action);
    setErr("");
    const e = await act(id, action, otp);
    setBusy("");
    if (e) setErr(e);
    else setCode("");
  }

  if (!vehicle) return null;

  // ── waiting for / failed admin review ──────────────────────────────────────
  if (vehicle.status === "pending") {
    return (
      <Shell>
        <PushBanner />
        <div className="text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand/15 text-brand">
            <FileClock size={30} />
          </span>
          <h2 className="mt-4 text-xl font-extrabold">Waiting for approval</h2>
          <p className="mt-2 text-sm text-muted">
            We&apos;re verifying your {vehicle.makeModel} ({vehicle.plate}). Once it&apos;s approved it will appear in Saafera and you can start taking bookings. This screen updates by itself.
          </p>
        </div>
        <Link href="/register" className={`${btn} mt-6 bg-surface2 text-ink`}>
          Edit vehicle details
        </Link>
      </Shell>
    );
  }
  if (vehicle.status === "rejected") {
    return (
      <Shell>
        <div className="text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-danger/15 text-danger">
            <ShieldAlert size={30} />
          </span>
          <h2 className="mt-4 text-xl font-extrabold">Vehicle not approved</h2>
          {vehicle.rejectReason && <p className="mt-2 rounded-xl bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">{vehicle.rejectReason}</p>}
          <p className="mt-3 text-sm text-muted">Fix the details and submit again.</p>
        </div>
        <Link href="/register" className={`${btn} mt-6 bg-brand text-brandInk`}>
          Fix and resubmit
        </Link>
      </Shell>
    );
  }

  // ── a booking in progress ──────────────────────────────────────────────────
  if (active) {
    const first = active.userName?.split(" ")[0] ?? "the rider";
    return (
      <Shell>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-go">
              {active.status === "accepted" ? "Booking accepted" : active.status === "arrived" ? "At pickup" : "Trip in progress"}
            </div>
            <div className="mt-1 text-xl font-extrabold">{active.userName ?? "Traveller"}</div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-extrabold">{rupees(active.fare)}</div>
            <div className="text-xs text-muted">estimated</div>
          </div>
        </div>
        <div className="my-4">
          <Meta b={active} />
        </div>
        <Route b={active} />
        {active.note && <p className="mt-4 rounded-xl bg-surface2 px-3.5 py-2.5 text-sm">&ldquo;{active.note}&rdquo;</p>}
        {err && <p className="mt-3 text-sm font-semibold text-danger">{err}</p>}

        {active.status === "accepted" && (
          <div className="mt-5 space-y-3">
            <div className="grid grid-cols-[auto_1fr] gap-3">
              {active.userPhone && (
                <a href={`tel:${active.userPhone}`} aria-label="Call rider" className={`${btn} w-14 bg-surface2 px-0 text-go`}>
                  <Phone size={20} />
                </a>
              )}
              <a href={navLink(active.pickupText, active.pickupLat, active.pickupLng)} target="_blank" rel="noreferrer" className={`${btn} bg-surface2 text-ink ${active.userPhone ? "" : "col-span-2"}`}>
                <Navigation size={18} /> Navigate to pickup
              </a>
            </div>
            {(() => {
              const opensAt = new Date(active.pickupAt).getTime() - EARLY_MS;
              const tooEarly = now < opensAt;
              return (
                <>
                  <button disabled={!!busy || tooEarly} onClick={() => run(active.id, "arrived")} className={`${btn} bg-brand text-brandInk`}>
                    I&apos;ve arrived
                  </button>
                  {tooEarly && <p className="text-center text-xs text-muted">Pickup is at {hhmm(new Date(active.pickupAt).getTime())}. You can mark arrival from {hhmm(opensAt)}.</p>}
                </>
              );
            })()}
            <button disabled={!!busy} onClick={() => confirm("Cancel this booking? The traveller will be told.") && run(active.id, "cancel")} className="w-full py-1.5 text-sm font-semibold text-danger">
              Cancel booking
            </button>
          </div>
        )}

        {active.status === "arrived" && (
          <div className="mt-5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted">Ask {first} for their 4-digit start code</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
              inputMode="numeric"
              placeholder="• • • •"
              className="mt-2 w-full rounded-2xl border-2 border-transparent bg-surface2 py-4 text-center text-3xl font-extrabold tracking-[0.5em] outline-none focus:border-brand"
            />
            <button disabled={code.length !== 4 || !!busy} onClick={() => run(active.id, "start", code)} className={`${btn} mt-3 bg-go text-white`}>
              Start trip
            </button>
            <button disabled={!!busy} onClick={() => confirm("Rider didn't show? Cancel this booking.") && run(active.id, "cancel")} className="mt-2 w-full py-1.5 text-sm font-semibold text-danger">
              Rider didn&apos;t show — cancel
            </button>
          </div>
        )}

        {active.status === "started" && (
          <div className="mt-5 space-y-3">
            <a href={navLink(active.dropText, active.dropLat, active.dropLng)} target="_blank" rel="noreferrer" className={`${btn} bg-surface2 text-ink`}>
              <Navigation size={18} /> Navigate to drop
            </a>
            <button disabled={!!busy} onClick={() => confirm(`Complete trip and collect ${rupees(active.fare)}?`) && run(active.id, "complete")} className={`${btn} bg-go text-white`}>
              Complete trip
            </button>
          </div>
        )}
        {upcoming.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-2 text-sm font-extrabold uppercase tracking-wider text-muted">Up next</h3>
            <div className="space-y-2">
              {upcoming.map((b) => (
                <div key={b.id} className="flex items-center gap-3 rounded-2xl bg-surface2 p-3.5 text-sm">
                  <CalendarClock size={18} className="shrink-0 text-brand" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold">
                      {b.pickupText} → {b.dropText}
                    </div>
                    <div className="text-xs text-muted">{whenLabel(b.pickupAt)} · {b.userName ?? "Traveller"}</div>
                  </div>
                  <div className="font-extrabold">{rupees(b.fare)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Shell>
    );
  }

  // ── approved, nothing in progress ──────────────────────────────────────────
  return (
    <Shell>
      <PushBanner />
      <div className="flex items-center gap-4">
        <button
          onClick={async () => setErr((await setAvailable(!vehicle.available)) ?? "")}
          aria-label={vehicle.available ? "Pause bookings" : "Start taking bookings"}
          className={`grid h-20 w-20 shrink-0 place-items-center rounded-full transition active:scale-95 ${vehicle.available ? "bg-go text-white shadow-[0_0_0_8px_rgb(var(--go)/0.18)]" : "bg-brand text-brandInk shadow-[0_0_0_8px_rgb(var(--brand)/0.15)]"}`}
        >
          {vehicle.available ? <Pause size={30} strokeWidth={2.6} /> : <Play size={30} strokeWidth={2.6} className="ml-1" />}
        </button>
        <div className="min-w-0">
          <h2 className="text-xl font-extrabold leading-tight">{vehicle.available ? "You're listed" : "You're paused"}</h2>
          <p className="mt-1 text-sm text-muted">
            {vehicle.available ? `Travellers can book your ${vehicle.makeModel} in Saafera.` : "Tap play to appear in Saafera and take bookings."}
          </p>
        </div>
      </div>
      {err && <p className="mt-3 text-sm font-semibold text-danger">{err}</p>}

      <div className="mt-5 flex items-center gap-2 rounded-2xl bg-surface2 px-4 py-3 text-sm">
        <BadgeCheck size={18} className="text-go" />
        <span className="font-bold">{vehicle.makeModel}</span>
        <span className="text-muted">· {vehicle.plate} · ₹{vehicle.ratePerKm}/km</span>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-muted">Booking requests</h3>
          {requests.length > 0 && <span className="rounded-full bg-brand px-2.5 py-0.5 text-xs font-extrabold text-brandInk">{requests.length}</span>}
        </div>

        {requests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line/20 p-6 text-center text-sm text-muted">
            {vehicle.available ? "No requests yet. You'll get an alert the moment a traveller books your car." : "Requests appear here while you're listed."}
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((b) => (
              <div key={b.id} className="rounded-2xl bg-surface2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 text-sm">
                    <div className="truncate font-extrabold">{b.userName ?? "Traveller"}</div>
                    <div className="mt-1 truncate text-muted">
                      {b.pickupText} → {b.dropText}
                    </div>
                  </div>
                  <div className="text-lg font-extrabold">{rupees(b.fare)}</div>
                </div>
                <div className="mt-2">
                  <Meta b={b} />
                </div>
                <div className="mt-2 text-xs font-bold text-brand">Respond within {mmss(new Date(b.expiresAt).getTime() - now)}</div>
                <div className="mt-3 grid grid-cols-[1fr_2fr] gap-2.5">
                  <button disabled={!!busy} onClick={() => run(b.id, "decline")} className="flex items-center justify-center gap-1 rounded-xl bg-danger/15 py-2.5 text-sm font-extrabold text-danger disabled:opacity-50">
                    <X size={16} /> Decline
                  </button>
                  <button disabled={!!busy} onClick={() => run(b.id, "accept")} className="rounded-xl bg-go py-2.5 text-sm font-extrabold text-white disabled:opacity-50">
                    Accept
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2.5 text-center">
        <div className="rounded-2xl bg-surface2 px-2 py-3">
          <div className="text-lg font-extrabold">{rupees(today.earnings)}</div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">Today</div>
        </div>
        <div className="rounded-2xl bg-surface2 px-2 py-3">
          <div className="text-lg font-extrabold">{today.trips}</div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">Trips</div>
        </div>
        <div className="rounded-2xl bg-surface2 px-2 py-3">
          <div className="text-lg font-extrabold">{today.km.toFixed(0)}</div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">Km</div>
        </div>
      </div>
    </Shell>
  );
}
