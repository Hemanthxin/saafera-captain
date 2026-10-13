"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LatLng } from "@/lib/types";

// Plain OpenStreetMap tiles; the dark theme is a CSS filter (see globals.css).
// OSM's tile servers are for light use — point this at a hosted provider (MapTiler,
// Stadia, Mapbox) before launch.
const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

const carIcon = L.divIcon({
  className: "car-marker",
  iconSize: [44, 44],
  iconAnchor: [22, 22],
  html: `<div style="width:44px;height:44px;border-radius:50%;background:rgb(255,176,32);display:grid;place-items:center;box-shadow:0 0 0 6px rgba(255,176,32,.25),0 6px 16px rgba(0,0,0,.45)">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a1203" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17h14M6 17l1.5-6h9L18 17M7.5 11l1-3h7l1 3"/><circle cx="8" cy="17.5" r="1.4" fill="#1a1203"/><circle cx="16" cy="17.5" r="1.4" fill="#1a1203"/></svg></div>`,
});

const pin = (color: string, label: string) =>
  L.divIcon({
    className: "pin-marker",
    iconSize: [34, 44],
    iconAnchor: [17, 42],
    html: `<div style="display:flex;flex-direction:column;align-items:center">
      <div style="min-width:30px;height:30px;padding:0 8px;border-radius:15px;background:${color};color:#fff;font:800 12px/30px system-ui;text-align:center;box-shadow:0 4px 12px rgba(0,0,0,.45)">${label}</div>
      <div style="width:2px;height:10px;background:${color}"></div></div>`,
  });

interface Props {
  driver: LatLng;
  pickup?: LatLng | null;
  drop?: LatLng | null;
  /** change this when the focus should re-fit (e.g. a different booking or stage) */
  focusKey: string;
}

/** Shows the driver's car and, for the booking in hand, the pickup and drop. */
export default function DriveMap({ driver, pickup, drop, focusKey }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const car = useRef<L.Marker | null>(null);
  const layers = useRef<L.Layer[]>([]);
  const fitted = useRef("");

  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, { zoomControl: false }).setView([driver.lat, driver.lng], 13);
    L.tileLayer(TILE_URL, { maxZoom: 19, attribution: "© OpenStreetMap contributors" }).addTo(m);
    car.current = L.marker([driver.lat, driver.lng], { icon: carIcon, zIndexOffset: 1000 }).addTo(m);
    map.current = m;
    const t = setTimeout(() => m.invalidateSize(), 150);
    return () => {
      clearTimeout(t);
      m.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    car.current?.setLatLng([driver.lat, driver.lng]);
  }, [driver]);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    layers.current.forEach((l) => l.remove());
    layers.current = [];
    const pts: L.LatLngExpression[] = [[driver.lat, driver.lng]];

    if (pickup) {
      layers.current.push(L.marker([pickup.lat, pickup.lng], { icon: pin("#19c37d", "Pickup") }).addTo(m));
      pts.push([pickup.lat, pickup.lng]);
    }
    if (drop) {
      layers.current.push(L.marker([drop.lat, drop.lng], { icon: pin("#ff5d6c", "Drop") }).addTo(m));
      pts.push([drop.lat, drop.lng]);
    }
    if (pickup && drop) {
      layers.current.push(
        L.polyline(
          [
            [pickup.lat, pickup.lng],
            [drop.lat, drop.lng],
          ],
          { color: "#ffb020", weight: 5, opacity: 0.9, dashArray: "2 10", lineCap: "round" },
        ).addTo(m),
      );
    }

    // re-frame only when the focus changes, so the driver can still pan around
    if (fitted.current !== focusKey) {
      fitted.current = focusKey;
      if (pts.length > 1) {
        m.fitBounds(L.latLngBounds(pts), { paddingTopLeft: [60, 90], paddingBottomRight: [60, window.innerWidth < 1024 ? 380 : 90], maxZoom: 15, animate: true });
      } else {
        m.setView([driver.lat, driver.lng], 14, { animate: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickup?.lat, pickup?.lng, drop?.lat, drop?.lng, focusKey]);

  return <div ref={el} className="isolate h-full w-full" />;
}
