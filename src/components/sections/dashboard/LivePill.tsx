"use client";

/**
 * Single source of truth for the "Ao vivo" chip used across the
 * dashboard (live match header, ranking section header, etc.). Always
 * red — broadcast convention is red dot for live.
 */
export function LivePill() {
  return (
    <span className="inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 rounded-full px-3 py-1 shrink-0">
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
      </span>
      <span className="text-base font-black text-red-400 uppercase tracking-wider whitespace-nowrap">
        Ao vivo
      </span>
    </span>
  );
}
