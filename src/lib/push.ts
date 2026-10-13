"use client";

// Web Push for the driver. Subscribing needs the server's public key
// (GET /push) and tells the server where to send pushes (POST /push).
import { api } from "./api";

export type PushState = "loading" | "unsupported" | "unconfigured" | "denied" | "off" | "on";

const toKey = (b64: string) => {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
};

const supported = () => typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

async function worker() {
  const existing = await navigator.serviceWorker.getRegistration("/");
  const reg = existing ?? (await navigator.serviceWorker.register("/sw.js"));
  await navigator.serviceWorker.ready;
  return reg;
}

export async function getPushState(): Promise<PushState> {
  if (!supported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  const cfg = await api<{ enabled: boolean; publicKey: string | null }>("/push");
  if (!cfg.ok || !cfg.enabled) return "unconfigured";
  const reg = await navigator.serviceWorker.getRegistration("/");
  const sub = await reg?.pushManager.getSubscription();
  return sub && Notification.permission === "granted" ? "on" : "off";
}

/** Asks permission, subscribes this device and tells the server. */
export async function enablePush(): Promise<{ state: PushState; error?: string }> {
  if (!supported()) return { state: "unsupported" };
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return { state: perm === "denied" ? "denied" : "off" };
  return { ...(await syncSubscription()) };
}

/** (Re)registers this device's subscription with the server — also run silently on sign-in. */
export async function syncSubscription(): Promise<{ state: PushState; error?: string }> {
  try {
    const cfg = await api<{ enabled: boolean; publicKey: string | null }>("/push");
    if (!cfg.ok || !cfg.enabled || !cfg.publicKey) return { state: "unconfigured" };
    const reg = await worker();
    const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(cfg.publicKey) }));
    const res = await api("/push", { body: { subscription: sub.toJSON() } });
    return res.ok ? { state: "on" } : { state: "off", error: res.error };
  } catch (e) {
    return { state: "off", error: e instanceof Error ? e.message : "Could not turn on alerts." };
  }
}

export async function disablePush(): Promise<PushState> {
  try {
    const reg = await navigator.serviceWorker.getRegistration("/");
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      await api("/push", { method: "DELETE", body: { endpoint: sub.endpoint } });
      await sub.unsubscribe();
    }
  } catch {}
  return "off";
}
