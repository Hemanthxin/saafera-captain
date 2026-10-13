"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BellRing, CarFront, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useDriver } from "@/lib/store";
import { Logo } from "@/components/Logo";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const { ready, signedIn, signIn, signUp } = useDriver();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && signedIn) router.replace("/drive");
  }, [ready, signedIn, router]);

  function switchMode(m: Mode) {
    setMode(m);
    setError("");
    setPassword("");
    setConfirm("");
  }

  async function submit() {
    setError("");
    if (phone.replace(/\D/g, "").length !== 10) return setError("Enter your 10-digit mobile number");
    if (mode === "signup") {
      if (name.trim().length < 2) return setError("Enter your full name");
      if (password.length < 8) return setError("Password must be at least 8 characters");
      if (password !== confirm) return setError("The two passwords don't match");
    } else if (!password) {
      return setError("Enter your password");
    }

    setBusy(true);
    const res = mode === "signup" ? await signUp(name, phone, password) : await signIn(phone, password);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    router.replace("/drive");
  }

  const field = "mt-1.5 w-full rounded-2xl border-2 border-transparent bg-surface px-4 py-3.5 text-[16px] font-semibold outline-none placeholder:text-muted/50 focus:border-brand";
  const label = "block text-xs font-bold uppercase tracking-wider text-muted";
  const onEnter = (e: React.KeyboardEvent) => e.key === "Enter" && !busy && submit();

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
          <div className="mb-8 lg:hidden">
            <Logo size={44} tagline />
          </div>

          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-surface p-1">
            {(["signin", "signup"] as const).map((m) => (
              <button key={m} onClick={() => switchMode(m)} className={`rounded-xl py-2.5 text-sm font-extrabold transition ${mode === m ? "bg-brand text-brandInk" : "text-muted hover:text-ink"}`}>
                {m === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <div className="animate-rise mt-7" key={mode}>
            <h2 className="text-3xl font-extrabold tracking-tight">{mode === "signin" ? "Welcome back" : "Join as a driver"}</h2>
            <p className="mt-2 text-muted">{mode === "signin" ? "Sign in with your mobile number and password." : "Create your account, then register your vehicle."}</p>

            <div className="mt-6 space-y-4">
              {mode === "signup" && (
                <label className={label}>
                  Full name
                  <input className={field} value={name} onChange={(e) => setName(e.target.value)} onKeyDown={onEnter} autoComplete="name" placeholder="Ravi Kumar" />
                </label>
              )}

              <label className={label}>
                Mobile number
                <div className="mt-1.5 flex items-center gap-3 rounded-2xl border-2 border-transparent bg-surface px-4 focus-within:border-brand">
                  <span className="font-bold text-muted">+91</span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    onKeyDown={onEnter}
                    inputMode="numeric"
                    autoComplete="username"
                    placeholder="98765 43210"
                    className="w-full bg-transparent py-3.5 text-[16px] font-semibold normal-case tracking-normal outline-none placeholder:text-muted/50"
                  />
                </div>
              </label>

              <label className={label}>
                Password
                <div className="relative">
                  <input
                    className={`${field} pr-12`}
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={onEnter}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
                  />
                  <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted">
                    {show ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
              </label>

              {mode === "signup" && (
                <label className={label}>
                  Confirm password
                  <input className={field} type={show ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} onKeyDown={onEnter} autoComplete="new-password" placeholder="Type it again" />
                </label>
              )}
            </div>

            {error && <p className="mt-4 rounded-xl bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">{error}</p>}

            <button disabled={busy} onClick={submit} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-base font-extrabold text-brandInk transition active:scale-[0.98] disabled:opacity-60">
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"} <ArrowRight size={18} />
            </button>

            {mode === "signin" && <p className="mt-5 text-center text-sm text-muted">Forgot your password? Contact Saafera support and they&apos;ll give you a new one.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
