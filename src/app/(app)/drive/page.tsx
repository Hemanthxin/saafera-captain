"use client";

import dynamic from "next/dynamic";
import { Moon, Sun } from "lucide-react";
import { useDriver } from "@/lib/store";
import { rupees } from "@/lib/format";
import { DrivePanel } from "@/components/DrivePanel";

// Leaflet touches `window`, so the map is client-only.
const DriveMap = dynamic(() => import("@/components/DriveMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-surface" />,
});

export default function DrivePage() {
  const { vehicle, active, requests, pos, theme, toggleTheme, today } = useDriver();
  const live = !!vehicle?.available;

  // the map shows the booking being worked on, else the newest request
  const shown = active ?? requests[0] ?? null;
  const pickup = shown && shown.pickupLat != null && shown.pickupLng != null ? { lat: shown.pickupLat, lng: shown.pickupLng } : null;
  const drop = shown && shown.dropLat != null && shown.dropLng != null ? { lat: shown.dropLat, lng: shown.dropLng } : null;

  return (
    <div className="relative h-full lg:flex">
      <div className="absolute inset-0 lg:relative lg:flex-1">
        <DriveMap driver={pos} pickup={pickup} drop={drop} focusKey={shown ? `${shown.id}:${shown.status}` : "idle"} />

        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-3.5 lg:p-5">
          <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-surface/90 py-2 pl-2 pr-4 shadow-lg backdrop-blur">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-brand text-sm font-extrabold text-brandInk">₹</span>
            <div className="leading-tight">
              <div className="text-sm font-extrabold">{rupees(today.earnings)}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">{today.trips} trips today</div>
            </div>
          </div>
          <div className="pointer-events-auto flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full bg-surface/90 px-3.5 py-2 text-xs font-bold shadow-lg backdrop-blur">
              <span className={`h-2.5 w-2.5 rounded-full ${live ? "bg-go" : "bg-muted"}`} />
              {live ? "Listed" : "Paused"}
            </div>
            <button onClick={toggleTheme} aria-label="Toggle theme" className="grid h-9 w-9 place-items-center rounded-full bg-surface/90 shadow-lg backdrop-blur">
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </div>
      </div>

      <DrivePanel />
    </div>
  );
}
