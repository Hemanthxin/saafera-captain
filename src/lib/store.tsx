"use client";

// The driver's session. Everything real lives on the Saafera server; this keeps a
// copy fresh by polling /sync every few seconds, so a booking a traveller makes in
// Saafera shows up here (with a chime) within moments.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { api, getToken, setToken } from "./api";
import { askNotificationPermission, chime, osNotify, unlockAudio } from "./alert";
import { sameDay } from "./format";
import { disablePush, enablePush as subscribePush, getPushState, syncSubscription, type PushState } from "./push";
import type { Alert, Booking, Driver, DriverAction, DriverStats, LatLng, Vehicle, VehicleForm } from "./types";

// Push is the real-time path; polling is only the safety net, so it slows right down once push is on.
const POLL_MS = 3000;
const POLL_MS_WITH_PUSH = 10000;
const THEME_KEY = "saafera-captain:theme";
export const CITY_CENTRE: LatLng = { lat: 12.9716, lng: 77.5946 };

interface SyncReply {
  driver: Driver;
  vehicle: Vehicle | null;
  stats: DriverStats;
  bookings: Booking[];
  notifications: Alert[];
}

interface Ctx {
  ready: boolean;
  signedIn: boolean;
  loaded: boolean; // first sync finished
  driver: Driver | null;
  vehicle: Vehicle | null;
  bookings: Booking[];
  alerts: Alert[];
  unread: number;
  requests: Booking[];
  /** the accepted booking being worked on now (earliest pickup) */
  active: Booking | null;
  /** other accepted bookings, soonest first */
  upcoming: Booking[];
  stats: DriverStats;
  push: PushState;
  pushError: string;
  turnOnPush: () => Promise<void>;
  turnOffPush: () => Promise<void>;
  today: { earnings: number; trips: number; km: number };
  pos: LatLng;
  theme: "dark" | "light";
  error: string;
  /** the newest booking request nobody has answered yet, shown as a pop-up */
  popup: Booking | null;
  dismissPopup: () => void;
  toggleTheme: () => void;
  signIn: (phone: string, password: string) => Promise<{ ok: true; hasVehicle: boolean } | { ok: false; error: string }>;
  signUp: (name: string, phone: string, password: string) => Promise<{ ok: true; hasVehicle: boolean } | { ok: false; error: string }>;
  /** resolves to an error message, or null on success */
  changePassword: (current: string, next: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  saveVehicle: (f: VehicleForm) => Promise<{ ok: true } | { ok: false; error: string }>;
  setAvailable: (on: boolean) => Promise<string | null>;
  act: (id: string, action: DriverAction, otp?: string) => Promise<string | null>;
  markAlertsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

const StoreCtx = createContext<Ctx | null>(null);

export function DriverProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [token, setTok] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [pos, setPos] = useState<LatLng>(CITY_CENTRE);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [error, setError] = useState("");
  const [popup, setPopup] = useState<Booking | null>(null);
  const [stats, setStats] = useState<DriverStats>({ avgRating: null, ratingCount: 0, completedTrips: 0 });
  const [push, setPush] = useState<PushState>("loading");
  const [pushError, setPushError] = useState("");
  const seen = useRef<Set<string> | null>(null); // request ids already announced

  // restore session + theme
  useEffect(() => {
    setTok(getToken());
    try {
      const t = localStorage.getItem(THEME_KEY);
      if (t === "light" || t === "dark") setTheme(t);
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
  }, [theme]);

  // the driver's own position, for the map
  useEffect(() => {
    if (!token || !("geolocation" in navigator)) return;
    const id = navigator.geolocation.watchPosition(
      (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [token]);

  const clear = useCallback(() => {
    setToken(null);
    setTok(null);
    setDriver(null);
    setVehicle(null);
    setBookings([]);
    setAlerts([]);
    setLoaded(false);
    setPopup(null);
    setStats({ avgRating: null, ratingCount: 0, completedTrips: 0 });
    seen.current = null;
  }, []);

  const refresh = useCallback(async () => {
    if (!getToken()) return;
    const res = await api<SyncReply>("/sync");
    if (!res.ok) {
      if (res.status === 401) clear();
      else setError(res.error);
      return;
    }
    setError("");
    setDriver(res.driver);
    setVehicle(res.vehicle);
    setStats(res.stats);
    setBookings(res.bookings);
    setAlerts(res.notifications);
    setLoaded(true);

    // Announce requests we haven't seen. The first sync only records what is
    // already there, so signing in doesn't chime for old requests.
    const open = res.bookings.filter((b) => b.status === "requested");
    if (seen.current === null) {
      seen.current = new Set(open.map((b) => b.id));
      return;
    }
    const fresh = open.filter((b) => !seen.current!.has(b.id));
    if (fresh.length) {
      fresh.forEach((b) => seen.current!.add(b.id));
      const newest = fresh[0];
      setPopup(newest);
      chime();
      osNotify("New booking request", `${newest.pickupText} → ${newest.dropText} · ₹${newest.fare}`);
    }
  }, [clear]);

  // poll while signed in
  useEffect(() => {
    if (!token) return;
    void refresh();
    const id = setInterval(() => void refresh(), push === "on" ? POLL_MS_WITH_PUSH : POLL_MS);
    const onVis = () => !document.hidden && void refresh();
    // a push arriving at the service worker refreshes the open app at once
    const onMsg = (e: MessageEvent) => e.data?.type === "captain-push" && void refresh();
    document.addEventListener("visibilitychange", onVis);
    navigator.serviceWorker?.addEventListener("message", onMsg);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
      navigator.serviceWorker?.removeEventListener("message", onMsg);
    };
  }, [token, refresh, push]);

  // find out whether alerts are on; if the driver already allowed them, quietly keep this device registered
  useEffect(() => {
    if (!token) return;
    let off = false;
    void (async () => {
      const s = await getPushState();
      if (off) return;
      if (s === "off" && typeof Notification !== "undefined" && Notification.permission === "granted") {
        const r = await syncSubscription();
        if (!off) setPush(r.state);
      } else setPush(s);
    })();
    return () => {
      off = true;
    };
  }, [token]);

  // a popup for a request that has since been answered/expired should go away
  useEffect(() => {
    if (popup && !bookings.some((b) => b.id === popup.id && b.status === "requested")) setPopup(null);
  }, [bookings, popup]);

  // Sign-in and sign-up both end the same way: keep the token and start the session.
  const startSession = useCallback((token: string | undefined) => {
    unlockAudio(); // the tap that signed in also unlocks the booking chime
    setToken(token ?? null);
    seen.current = null;
    setTok(token ?? null);
  }, []);

  const signIn: Ctx["signIn"] = useCallback(
    async (phone, password) => {
      const res = await api<{ token: string; vehicle: Vehicle | null }>("/auth/login", { body: { phone, password } });
      if (!res.ok) return { ok: false, error: res.error };
      startSession(res.token);
      return { ok: true, hasVehicle: !!res.vehicle };
    },
    [startSession],
  );

  const signUp: Ctx["signUp"] = useCallback(
    async (name, phone, password) => {
      const res = await api<{ token: string; vehicle: Vehicle | null }>("/auth/signup", { body: { name, phone, password } });
      if (!res.ok) return { ok: false, error: res.error };
      startSession(res.token);
      return { ok: true, hasVehicle: false };
    },
    [startSession],
  );

  const changePassword: Ctx["changePassword"] = useCallback(async (current, next) => {
    const res = await api("/auth/password", { body: { current, next } });
    return res.ok ? null : res.error;
  }, []);

  const signOut = useCallback(async () => {
    await api("/auth/logout", { method: "POST", body: {} });
    clear();
  }, [clear]);

  const saveVehicle: Ctx["saveVehicle"] = useCallback(
    async (f) => {
      const res = await api<{ vehicle: Vehicle }>("/vehicle", {
        body: {
          type: f.type,
          makeModel: f.makeModel,
          colour: f.colour || null,
          plate: f.plate,
          year: f.year ? Number(f.year) : null,
          seats: Number(f.seats),
          ac: f.ac,
          city: f.city,
          ratePerKm: Number(f.ratePerKm),
          baseFare: Number(f.baseFare || 0),
          rcNo: f.rcNo || null,
          licenceNo: f.licenceNo || null,
          photoUrl: f.photoUrl,
        },
      });
      if (!res.ok) return { ok: false, error: res.error };
      setVehicle(res.vehicle);
      void refresh();
      return { ok: true };
    },
    [refresh],
  );

  const setAvailable = useCallback(async (on: boolean) => {
    const res = await api<{ vehicle: Vehicle }>("/availability", { body: { available: on } });
    if (!res.ok) return res.error;
    setVehicle(res.vehicle);
    if (on) askNotificationPermission();
    return null;
  }, []);

  const act = useCallback(
    async (id: string, action: DriverAction, otp?: string) => {
      const res = await api<{ booking: Booking }>(`/bookings/${id}`, { body: { action, otp } });
      await refresh();
      return res.ok ? null : res.error;
    },
    [refresh],
  );

  const turnOnPush = useCallback(async () => {
    setPushError("");
    const r = await subscribePush();
    setPush(r.state);
    if (r.error) setPushError(r.error);
  }, []);

  const turnOffPush = useCallback(async () => {
    setPush(await disablePush());
  }, []);

  const markAlertsRead = useCallback(async () => {
    await api("/notifications/read", { method: "POST", body: {} });
    setAlerts((a) => a.map((x) => ({ ...x, readAt: x.readAt ?? new Date().toISOString() })));
  }, []);

  const requests = useMemo(() => bookings.filter((b) => b.status === "requested"), [bookings]);
  const inProgress = useMemo(
    () =>
      bookings
        .filter((b) => b.status === "accepted" || b.status === "arrived" || b.status === "started")
        // a trip already under way always comes first, then the soonest pickup
        .sort((a, b) => Number(b.status === "started") - Number(a.status === "started") || +new Date(a.pickupAt) - +new Date(b.pickupAt)),
    [bookings],
  );
  const active = inProgress[0] ?? null;
  const upcoming = useMemo(() => inProgress.slice(1), [inProgress]);
  const unread = useMemo(() => alerts.filter((a) => !a.readAt).length, [alerts]);
  const today = useMemo(() => {
    const now = new Date();
    const done = bookings.filter((b) => b.status === "completed" && sameDay(new Date(b.updatedAt), now));
    return { earnings: done.reduce((n, b) => n + b.fare, 0), trips: done.length, km: done.reduce((n, b) => n + (b.distanceKm ?? 0), 0) };
  }, [bookings]);

  const value: Ctx = {
    ready,
    signedIn: !!token,
    loaded,
    driver,
    vehicle,
    bookings,
    alerts,
    unread,
    requests,
    active,
    upcoming,
    stats,
    push,
    pushError,
    turnOnPush,
    turnOffPush,
    today,
    pos,
    theme,
    error,
    popup,
    dismissPopup: () => setPopup(null),
    toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    signIn,
    signUp,
    changePassword,
    signOut,
    saveVehicle,
    setAvailable,
    act,
    markAlertsRead,
    refresh,
  };
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useDriver(): Ctx {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useDriver must be used inside <DriverProvider>");
  return c;
}
