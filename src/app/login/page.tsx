"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BellRing, CarFront, ShieldCheck } from "lucide-react";
import { useDriver } from "@/lib/store";
import { Logo } from "@/components/Logo";

const CODE_LEN = 6;

export default function LoginPage() {
  const { ready, signedIn, requestOtp, verify } = useDriver();
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp" | "name">("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(CODE_LEN).fill(""));
  const [hint, setHint] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const boxes = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (ready && signedIn) router.replace("/drive");
  }, [ready, signedIn, router]);

  async function sendOtp() {
    if (phone.replace(/\D/g, "").length !== 10) return setError("Enter your 10-digit mobile number");
    setBusy(true);
    setError("");
    const res = await requestOtp(phone);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setHint(res.devHint ?? "");
    setStep("otp");
    setTimeout(() => boxes.current[0]?.focus(), 80);
  }

  async function submitCode(code: string, driverName?: string) {
    setBusy(true);
    setError("");
    const res = await verify(phone, code, driverName);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      setDigits(Array(CODE_LEN).fill(""));
      setStep("otp");
      setTimeout(() => boxes.current[0]?.focus(), 50);
      return;
    }
    if (res.needsName) return setStep("name");
    router.replace("/drive");
  }

  function setDigit(i: number, v: string) {
    const d = v.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = d;
    setDigits(next);
    if (d && i < CODE_LEN - 1) boxes.current[i + 1]?.focus();
    if (next.every(Boolean)) void submitCode(next.join(""));
  }

  const code = digits.join("");

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-surface lg:block">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-brand/15 blur-3xl" />
        <div className="absolute -bottom-32 right-0 h-[28rem] w-[28rem] rounded-full bg-go/10 blur-3xl" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Logo size={44} tagline />
          <div>
            <h1 className="max-w-md text-5xl font-extrabold leading-[1.08] tracking-tight">
              Register your car. <span className="text-brand">Get booked directly.</span>
            </h1>
            <ul className="mt-8 space-y-4 text-lg text-muted">
              <li className="flex items-center gap-3">
                <CarFront className="text-brand" /> Your vehicle is listed for Saafera travellers
              </li>
              <li className="flex items-center gap-3">
                <BellRing className="text-brand" /> Bookings for your car reach you instantly
              </li>
              <li className="flex items-center gap-3">
                <ShieldCheck className="text-brand" /> You set your own rate per km
              </li>
            </ul>
          </div>
          <p className="text-sm text-muted">Part of the Saafera travel family</p>
        </div>
      </section>

      <section className="flex flex-col justify-center px-6 py-10 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <Logo size={44} tagline />
          </div>

          {step === "phone" && (
            <div className="animate-rise">
              <h2 className="text-3xl font-extrabold tracking-tight">Welcome, driver</h2>
              <p className="mt-2 text-muted">Sign in or create your account with your mobile number.</p>
              <label className="mt-8 block text-xs font-bold uppercase tracking-wider text-muted">Mobile number</label>
              <div className="mt-2 flex items-center gap-3 rounded-2xl border-2 border-transparent bg-surface px-4 focus-within:border-brand">
                <span className="font-bold text-muted">+91</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  onKeyDown={(e) => e.key === "Enter" && sendOtp()}
                  inputMode="numeric"
                  placeholder="98765 43210"
                  className="w-full bg-transparent py-4 text-lg font-semibold outline-none placeholder:text-muted/50"
                />
              </div>
              {error && <p className="mt-2 text-sm font-semibold text-danger">{error}</p>}
              <button disabled={busy} onClick={sendOtp} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-base font-extrabold text-brandInk transition active:scale-[0.98] disabled:opacity-60">
                {busy ? "Sending…" : "Get code"} <ArrowRight size={18} />
              </button>
            </div>
          )}

          {step === "otp" && (
            <div className="animate-rise">
              <h2 className="text-3xl font-extrabold tracking-tight">Enter the code</h2>
              <p className="mt-2 text-muted">
                Sent to +91 {phone}.{" "}
                <button onClick={() => setStep("phone")} className="font-bold text-brand">
                  Change
                </button>
              </p>
              <div className="mt-8 flex gap-2">
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      boxes.current[i] = el;
                    }}
                    value={d}
                    onChange={(e) => setDigit(i, e.target.value)}
                    onKeyDown={(e) => e.key === "Backspace" && !d && i > 0 && boxes.current[i - 1]?.focus()}
                    inputMode="numeric"
                    className="h-14 w-full min-w-0 rounded-xl border-2 border-transparent bg-surface text-center text-xl font-extrabold outline-none focus:border-brand"
                  />
                ))}
              </div>
              {error && <p className="mt-3 text-sm font-semibold text-danger">{error}</p>}
              {busy && <p className="mt-3 text-sm text-muted">Checking…</p>}
              {hint && <p className="mt-6 rounded-xl bg-brand/10 px-4 py-3 text-sm text-brand">Development build — use code <b>{hint}</b></p>}
            </div>
          )}

          {step === "name" && (
            <div className="animate-rise">
              <h2 className="text-3xl font-extrabold tracking-tight">What&apos;s your name?</h2>
              <p className="mt-2 text-muted">Travellers will see this when they book your car.</p>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && name.trim().length > 1 && submitCode(code, name)}
                placeholder="Full name"
                className="mt-8 w-full rounded-2xl border-2 border-transparent bg-surface px-4 py-4 text-lg font-semibold outline-none focus:border-brand"
              />
              {error && <p className="mt-2 text-sm font-semibold text-danger">{error}</p>}
              <button disabled={busy || name.trim().length < 2} onClick={() => submitCode(code, name)} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-base font-extrabold text-brandInk disabled:opacity-50">
                Create account <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
