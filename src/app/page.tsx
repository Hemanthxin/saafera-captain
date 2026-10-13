"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDriver } from "@/lib/store";
import { Splash } from "@/components/AppShell";

export default function Home() {
  const { ready, signedIn } = useDriver();
  const router = useRouter();
  useEffect(() => {
    if (ready) router.replace(signedIn ? "/drive" : "/login");
  }, [ready, signedIn, router]);
  return <Splash />;
}
