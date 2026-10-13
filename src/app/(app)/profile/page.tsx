"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, BellRing, CarFront, ChevronRight, FileText, FileClock, LogOut, Moon, ShieldAlert, Star, Sun } from "lucide-react";
import { useDriver } from "@/lib/store";

export default function ProfilePage() {
  const { driver, vehicle, theme, toggleTheme, signOut, stats, push, turnOnPush, turnOffPush } = useDriver();
  const router = useRouter();
  if (!driver || !vehicle) return null;

  const status = {
    approved: { label: "Approved", icon: BadgeCheck, tone: "text-go" },
    pending: { label: "Under review", icon: FileClock, tone: "text-brand" },
    rejected: { label: "Not approved", icon: ShieldAlert, tone: "text-danger" },
  }[vehicle.status];
  const StatusIcon = status.icon;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-5 p-4 lg:p-8">
        <div className="flex items-center gap-4 rounded-3xl bg-surface p-5 lg:p-6">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-brand text-2xl font-extrabold text-brandInk">{driver.name[0]}</div>
          <div className="min-w-0 flex-1">
            <div className="text-xl font-extrabold">{driver.name}</div>
            <div className="text-sm text-muted">+91 {driver.phone.replace(/^\+91/, "")}</div>
            <div className="mt-1 flex items-center gap-3 text-sm">
              {stats.avgRating ? (
                <span className="flex items-center gap-1 font-bold">
                  <Star size={14} className="fill-brand text-brand" /> {stats.avgRating} <span className="font-medium text-muted">({stats.ratingCount})</span>
                </span>
              ) : (
                <span className="text-muted">No ratings yet</span>
              )}
              <span className="text-muted">{stats.completedTrips} trips</span>
            </div>
          </div>
        </div>

        <section>
          <h2 className="mb-2 px-1 text-sm font-extrabold uppercase tracking-wider text-muted">My vehicle</h2>
          <div className="overflow-hidden rounded-3xl bg-surface">
            {vehicle.photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={vehicle.photoUrl} alt={vehicle.makeModel} className="h-44 w-full object-cover" />
            )}
            <div className="flex items-center gap-4 p-5">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-surface2">
                <CarFront />
              </div>
              <div className="flex-1">
                <div className="font-extrabold">
                  {vehicle.makeModel} <span className="font-semibold capitalize text-muted">· {vehicle.type}</span>
                </div>
                <div className="mt-1 inline-block rounded-md border border-line/20 px-2 py-0.5 text-xs font-extrabold tracking-wider">{vehicle.plate}</div>
                <div className="mt-1.5 text-xs text-muted">
                  {vehicle.city} · {vehicle.seats} seats{vehicle.ac ? " · AC" : ""} · ₹{vehicle.ratePerKm}/km{vehicle.baseFare ? ` + ₹${vehicle.baseFare}` : ""}
                </div>
              </div>
              <span className={`flex items-center gap-1.5 text-sm font-extrabold ${status.tone}`}>
                <StatusIcon size={18} /> {status.label}
              </span>
            </div>
            <Link href="/register" className="hairline flex items-center justify-between border-t px-5 py-4 text-sm font-bold">
              Edit vehicle &amp; rates <ChevronRight size={17} className="text-muted" />
            </Link>
          </div>
          <p className="mt-2 px-1 text-xs text-muted">Changing vehicle details sends it back for a quick re-check, and pauses your listing until it&apos;s approved.</p>
        </section>

        <section>
          <h2 className="mb-2 px-1 text-sm font-extrabold uppercase tracking-wider text-muted">Documents</h2>
          <div className="divide-y divide-line/10 overflow-hidden rounded-3xl bg-surface">
            {[
              { name: "Driving licence", value: driver.licenceNo },
              { name: "Vehicle RC", value: vehicle.rcNo },
            ].map((d) => (
              <div key={d.name} className="flex items-center gap-4 p-4">
                <FileText size={19} className="text-muted" />
                <div className="flex-1">
                  <div className="text-sm font-bold">{d.name}</div>
                  <div className="text-xs uppercase tracking-wider text-muted">{d.value || "Not provided"}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-2 px-1 text-sm font-extrabold uppercase tracking-wider text-muted">Settings</h2>
          <div className="overflow-hidden rounded-3xl bg-surface">
            {(push === "on" || push === "off") && (
              <button onClick={push === "on" ? turnOffPush : turnOnPush} className="hairline flex w-full items-center gap-4 border-b p-4 text-left">
                <BellRing size={19} className="text-muted" />
                <span className="flex-1 text-sm font-bold">Booking alerts</span>
                <span className={`text-sm font-semibold ${push === "on" ? "text-go" : "text-muted"}`}>{push === "on" ? "On" : "Off — turn on"}</span>
              </button>
            )}
            <button onClick={toggleTheme} className="flex w-full items-center gap-4 p-4 text-left">
              {theme === "dark" ? <Moon size={19} className="text-muted" /> : <Sun size={19} className="text-muted" />}
              <span className="flex-1 text-sm font-bold">Appearance</span>
              <span className="text-sm font-semibold text-muted">{theme === "dark" ? "Dark" : "Light"}</span>
              <ChevronRight size={17} className="text-muted" />
            </button>
          </div>
        </section>

        <button
          onClick={async () => {
            await signOut();
            router.replace("/login");
          }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-danger/10 py-4 font-extrabold text-danger"
        >
          <LogOut size={18} /> Sign out
        </button>
      </div>
    </div>
  );
}
