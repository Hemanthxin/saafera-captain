"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Bell, CarFront, ClipboardList, IndianRupee, UserRound, type LucideIcon } from "lucide-react";
import { useDriver } from "@/lib/store";
import { useGuard } from "@/lib/guard";
import { rupees } from "@/lib/format";
import { BookingPopup } from "./BookingPopup";
import { Logo, LogoMark } from "./Logo";

const NAV: Array<{ href: string; label: string; icon: LucideIcon; badge?: boolean }> = [
  { href: "/drive", label: "Drive", icon: CarFront },
  { href: "/trips", label: "Bookings", icon: ClipboardList },
  { href: "/earnings", label: "Earnings", icon: IndianRupee },
  { href: "/alerts", label: "Alerts", icon: Bell, badge: true },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export function Splash() {
  return (
    <div className="grid h-dvh place-items-center">
      <div className="animate-pulse">
        <LogoMark size={56} />
      </div>
    </div>
  );
}

/** Sidebar on desktop, bottom tab bar on phones. Also guards the signed-in routes. */
export function AppShell({ children }: { children: ReactNode }) {
  const { driver, vehicle, today, unread } = useDriver();
  const path = usePathname();
  const ok = useGuard({ needVehicle: true });

  if (!ok) return <Splash />;

  const live = !!vehicle?.available;

  return (
    <div className="flex h-dvh flex-col lg:flex-row">
      <aside className="hairline hidden w-64 shrink-0 flex-col border-r bg-surface p-5 lg:flex">
        <Logo tagline />
        <nav className="mt-8 flex flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon, badge }) => {
            const on = path.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition ${on ? "bg-brand text-brandInk" : "text-muted hover:bg-surface2 hover:text-ink"}`}
              >
                <Icon size={19} />
                <span className="flex-1">{label}</span>
                {badge && unread > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1.5 text-[11px] font-extrabold text-white">{unread}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto space-y-3">
          <div className="rounded-2xl bg-surface2 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">Today</div>
            <div className="mt-1 text-2xl font-extrabold">{rupees(today.earnings)}</div>
            <div className="text-xs text-muted">{today.trips} trips</div>
          </div>
          <div className="flex items-center gap-3 px-1">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-brand font-extrabold text-brandInk">{driver?.name?.[0] ?? "D"}</div>
            <div className="min-w-0 text-sm">
              <div className="truncate font-bold">{driver?.name}</div>
              <div className="flex items-center gap-1.5 text-xs text-muted">
                <span className={`h-2 w-2 rounded-full ${live ? "bg-go" : "bg-muted"}`} />
                {live ? "Taking bookings" : "Not taking bookings"}
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="relative min-h-0 flex-1 overflow-hidden">{children}</main>

      <nav className="hairline safe-b z-30 flex shrink-0 border-t bg-surface lg:hidden">
        {NAV.map(({ href, label, icon: Icon, badge }) => {
          const on = path.startsWith(href);
          return (
            <Link key={href} href={href} className={`relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold ${on ? "text-brand" : "text-muted"}`}>
              <span className="relative">
                <Icon size={21} />
                {badge && unread > 0 && <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-extrabold text-white">{unread}</span>}
              </span>
              {label}
            </Link>
          );
        })}
      </nav>

      <BookingPopup />
    </div>
  );
}
