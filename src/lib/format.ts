export const rupees = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export function clock(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function dayLabel(d: Date): string {
  return d.toLocaleDateString("en-IN", { weekday: "short" });
}

export function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

export function sameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

export function navUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
}

export function whenLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);
  const t = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  if (sameDay(d, now)) return `Today, ${t}`;
  if (sameDay(d, tomorrow)) return `Tomorrow, ${t}`;
  return `${d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}, ${t}`;
}

export function ago(iso: string): string {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}
