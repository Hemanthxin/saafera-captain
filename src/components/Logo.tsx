// The Saafera logo (same file as the main app) on a white tile so it reads on the
// dark theme too. The tile is square; the image keeps its own padding.
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <span className="inline-block shrink-0 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5" style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/saafera-logo.jpg" alt="Saafera" width={size} height={size} className="h-full w-full object-contain" />
    </span>
  );
}

export function Logo({ size = 36, tagline = false }: { size?: number; tagline?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <LogoMark size={size} />
      <div className="leading-tight">
        <div className="text-xl font-extrabold tracking-tight">
          Saafera <span className="text-brand">Captain</span>
        </div>
        {tagline && <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Drive · Earn · Own it</div>}
      </div>
    </div>
  );
}
