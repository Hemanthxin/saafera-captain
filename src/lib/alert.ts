// Sound, vibration and OS notification for a new booking. All best-effort:
// browsers only allow audio after a tap, so the first sign-in tap unlocks it.
let ctx: AudioContext | null = null;

export function unlockAudio() {
  try {
    ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    void ctx.resume();
  } catch {}
}

export function chime() {
  try {
    unlockAudio();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    [880, 1175, 880, 1175].forEach((freq, i) => {
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t0 + i * 0.22);
      gain.gain.exponentialRampToValueAtTime(0.3, t0 + i * 0.22 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.22 + 0.2);
      osc.connect(gain).connect(ctx!.destination);
      osc.start(t0 + i * 0.22);
      osc.stop(t0 + i * 0.22 + 0.22);
    });
  } catch {}
  try {
    navigator.vibrate?.([300, 120, 300, 120, 300]);
  } catch {}
}

export function askNotificationPermission() {
  try {
    if ("Notification" in window && Notification.permission === "default") void Notification.requestPermission();
  } catch {}
}

/** Shows an OS notification when the tab is in the background. */
export function osNotify(title: string, body: string) {
  try {
    if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
      new Notification(title, { body, tag: "captain-booking" });
    }
  } catch {}
}
