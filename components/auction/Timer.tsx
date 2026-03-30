"use client";

export function TimerDisplay({ seconds, label = "Timer" }: { seconds: number; label?: string }) {
  const s = Math.max(0, seconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  const warn = s <= 10 && s > 0;

  return (
    <div
      className={`rounded-lg border px-4 py-3 text-center ${
        warn ? "border-amber-600/50 bg-amber-950/30" : "border-neutral-800 bg-neutral-950/60"
      }`}
    >
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className={`mt-1 font-mono text-3xl font-semibold ${warn ? "text-amber-200" : "text-neutral-100"}`}>
        {String(m).padStart(2, "0")}:{String(r).padStart(2, "0")}
      </p>
    </div>
  );
}
