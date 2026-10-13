"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDriver } from "./store";

/** Sends the driver to the right screen: sign in first, then register a vehicle. */
export function useGuard(opts: { needVehicle: boolean }): boolean {
  const { ready, signedIn, loaded, vehicle } = useDriver();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!signedIn) router.replace("/login");
    else if (loaded && opts.needVehicle && !vehicle) router.replace("/register");
  }, [ready, signedIn, loaded, vehicle, opts.needVehicle, router]);

  return ready && signedIn && loaded && (!opts.needVehicle || !!vehicle);
}
