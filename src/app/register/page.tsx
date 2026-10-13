"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Camera, CarFront, Check } from "lucide-react";
import { useDriver } from "@/lib/store";
import { useGuard } from "@/lib/guard";
import { Logo } from "@/components/Logo";
import { Splash } from "@/components/AppShell";
import { VEHICLE_TYPES, type VehicleForm, type VehicleType } from "@/lib/types";

const DEFAULTS: Record<VehicleType, { seats: string; rate: string; base: string }> = {
  hatchback: { seats: "4", rate: "11", base: "0" },
  sedan: { seats: "4", rate: "13", base: "0" },
  suv: { seats: "6", rate: "17", base: "0" },
  tempo: { seats: "12", rate: "24", base: "0" },
  luxury: { seats: "4", rate: "26", base: "0" },
};

const EMPTY: VehicleForm = {
  type: "sedan",
  makeModel: "",
  colour: "",
  plate: "",
  year: "",
  seats: "4",
  ac: true,
  city: "",
  ratePerKm: "13",
  baseFare: "0",
  rcNo: "",
  licenceNo: "",
  photoUrl: null,
};

/** Shrinks a phone photo to a ~600px JPEG so it uploads quickly. */
function shrink(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, 800 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => reject(new Error("bad image"));
    img.src = url;
  });
}

export default function RegisterPage() {
  const { vehicle, driver, saveVehicle } = useDriver();
  const router = useRouter();
  const ok = useGuard({ needVehicle: false });
  const [f, setF] = useState<VehicleForm>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const filled = useRef(false);
  const file = useRef<HTMLInputElement>(null);

  // editing an existing registration: start from what is saved
  useEffect(() => {
    if (filled.current || !ok) return;
    filled.current = true;
    if (vehicle) {
      setF({
        type: vehicle.type,
        makeModel: vehicle.makeModel,
        colour: vehicle.colour ?? "",
        plate: vehicle.plate,
        year: vehicle.year ? String(vehicle.year) : "",
        seats: String(vehicle.seats),
        ac: vehicle.ac,
        city: vehicle.city,
        ratePerKm: String(vehicle.ratePerKm),
        baseFare: String(vehicle.baseFare),
        rcNo: vehicle.rcNo ?? "",
        licenceNo: driver?.licenceNo ?? "",
        photoUrl: vehicle.photoUrl,
      });
    }
  }, [ok, vehicle, driver]);

  if (!ok) return <Splash />;

  const set = <K extends keyof VehicleForm>(k: K, v: VehicleForm[K]) => setF((p) => ({ ...p, [k]: v }));

  function pickType(t: VehicleType) {
    const d = DEFAULTS[t];
    // only pre-fill pricing/seats if the driver hasn't customised them yet
    setF((p) => ({ ...p, type: t, seats: vehicle ? p.seats : d.seats, ratePerKm: vehicle ? p.ratePerKm : d.rate }));
  }

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      set("photoUrl", await shrink(file));
    } catch {
      setError("Couldn't read that photo. Try another one.");
    }
  }

  async function submit() {
    setBusy(true);
    setError("");
    const res = await saveVehicle(f);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    router.replace("/drive");
  }

  const input = "mt-1.5 w-full rounded-xl border-2 border-transparent bg-surface px-3.5 py-3 text-[15px] font-semibold outline-none focus:border-brand placeholder:text-muted/50";
  const complete = f.makeModel.trim() && f.plate.trim() && f.city.trim() && f.ratePerKm && f.seats;

  return (
    <div className="min-h-dvh">
      <header className="hairline sticky top-0 z-20 flex items-center justify-between border-b bg-bg/90 px-5 py-4 backdrop-blur">
        <Logo size={32} />
        <span className="text-sm font-semibold text-muted">{driver?.name}</span>
      </header>

      <main className="mx-auto max-w-2xl space-y-8 px-5 pb-32 pt-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{vehicle ? "Edit your vehicle" : "Register your vehicle"}</h1>
          <p className="mt-2 text-muted">
            This is what travellers see in Saafera when they pick a car. After you submit, our team verifies the details
            {vehicle ? " again" : ""} — then you can start taking bookings.
          </p>
        </div>

        <Section title="Vehicle type">
          <div className="flex flex-wrap gap-2">
            {VEHICLE_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => pickType(t)}
                className={`rounded-full px-4 py-2.5 text-sm font-extrabold capitalize transition ${f.type === t ? "bg-brand text-brandInk" : "bg-surface text-muted hover:text-ink"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Vehicle details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Make & model">
              <input className={input} value={f.makeModel} onChange={(e) => set("makeModel", e.target.value)} placeholder="Maruti Dzire" />
            </Field>
            <Field label="Number plate">
              <input className={`${input} uppercase`} value={f.plate} onChange={(e) => set("plate", e.target.value)} placeholder="KA 01 AB 1234" />
            </Field>
            <Field label="Colour">
              <input className={input} value={f.colour} onChange={(e) => set("colour", e.target.value)} placeholder="White" />
            </Field>
            <Field label="Year (optional)">
              <input className={input} inputMode="numeric" value={f.year} onChange={(e) => set("year", e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="2021" />
            </Field>
            <Field label="Seats for passengers">
              <input className={input} inputMode="numeric" value={f.seats} onChange={(e) => set("seats", e.target.value.replace(/\D/g, "").slice(0, 2))} />
            </Field>
            <Field label="Air conditioning">
              <button onClick={() => set("ac", !f.ac)} className={`mt-1.5 flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-[15px] font-semibold ${f.ac ? "bg-go/15 text-go" : "bg-surface text-muted"}`}>
                {f.ac ? "AC available" : "Non-AC"} {f.ac && <Check size={18} />}
              </button>
            </Field>
          </div>
        </Section>

        <Section title="Where you operate & your rates">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="City">
              <input className={input} value={f.city} onChange={(e) => set("city", e.target.value)} placeholder="Bengaluru" />
            </Field>
            <Field label="Rate per km (₹)">
              <input className={input} inputMode="numeric" value={f.ratePerKm} onChange={(e) => set("ratePerKm", e.target.value.replace(/\D/g, "").slice(0, 3))} />
            </Field>
            <Field label="Base fare (₹)">
              <input className={input} inputMode="numeric" value={f.baseFare} onChange={(e) => set("baseFare", e.target.value.replace(/\D/g, "").slice(0, 4))} />
            </Field>
          </div>
          <p className="mt-2 text-xs text-muted">Travellers pay base fare + rate × distance. You can change these any time (it will be re-checked).</p>
        </Section>

        <Section title="Documents">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Driving licence number">
              <input className={`${input} uppercase`} value={f.licenceNo} onChange={(e) => set("licenceNo", e.target.value)} placeholder="KA0120210012345" />
            </Field>
            <Field label="RC (registration) number">
              <input className={`${input} uppercase`} value={f.rcNo} onChange={(e) => set("rcNo", e.target.value)} placeholder="KA01AB1234" />
            </Field>
          </div>
        </Section>

        <Section title="Photo of your vehicle">
          <input ref={file} type="file" accept="image/*" capture="environment" onChange={onPhoto} className="hidden" />
          <button onClick={() => file.current?.click()} className="grid h-48 w-full place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-line/20 bg-surface">
            {f.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={f.photoUrl} alt="Your vehicle" className="h-full w-full object-cover" />
            ) : (
              <span className="flex flex-col items-center gap-2 text-muted">
                <Camera size={30} />
                <span className="text-sm font-bold">Add a clear photo of the car</span>
              </span>
            )}
          </button>
        </Section>

        {error && <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">{error}</p>}
      </main>

      <div className="hairline safe-b fixed inset-x-0 bottom-0 z-20 border-t bg-bg/95 p-4 backdrop-blur">
        <div className="mx-auto flex max-w-2xl gap-3">
          {vehicle && (
            <button onClick={() => router.back()} className="rounded-2xl bg-surface px-6 py-4 font-bold">
              Cancel
            </button>
          )}
          <button disabled={busy || !complete} onClick={submit} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-base font-extrabold text-brandInk disabled:opacity-50">
            <CarFront size={19} /> {busy ? "Saving…" : vehicle ? "Save & resubmit" : "Submit for approval"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wider text-muted">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-xs font-bold uppercase tracking-wider text-muted">
      {label}
      {children}
    </label>
  );
}
