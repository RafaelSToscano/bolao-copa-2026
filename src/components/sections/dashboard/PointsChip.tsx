"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SCORING_RULES } from "@/config/scoring";
import { PredictionPointsBreakdown } from "@/services/predictions/predictionCalculations";

interface PointsChipProps {
  /**
   * The full breakdown (which rules matched). Pass `null` to hide
   * the chip (caller decides — e.g. when there's no live score yet).
   */
  breakdown: PredictionPointsBreakdown | null;
  /** Render label override; defaults to a friendly emoji + total. */
  label?: string;
  /**
   * When true, the tooltip footer notes the calculation is
   * provisional and may change once the result is finalized. Off by
   * default — finished-game chips stay quiet about that.
   */
  provisional?: boolean;
}

function tone(total: number, exact: boolean) {
  if (exact)
    return "text-yellow-300 bg-yellow-500/10 border-yellow-500/30";
  if (total > 0)
    return "text-emerald-300 bg-emerald-500/10 border-emerald-500/30";
  return "text-red-300 bg-red-500/10 border-red-500/30";
}

function defaultLabel(total: number, exact: boolean) {
  if (exact) return `🔥 Placar exato · +${total} pts`;
  if (total > 0) return `🏆 ${total} pts`;
  return "❌ 0 pts";
}

const TOOLTIP_WIDTH_PX = 288; // matches w-72
const TOOLTIP_GAP_PX = 8;
const VIEWPORT_INSET_PX = 12;

export function PointsChip({ breakdown, label, provisional }: PointsChipProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null
  );
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Position the portal'd tooltip below (or above) the chip, clamped
  // to the viewport. We use position: fixed so ancestor overflow:
  // hidden / transform / contain rules don't clip or offset it.
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const btn = buttonRef.current;
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      const tooltipHeight = tooltipRef.current?.offsetHeight ?? 0;

      // Prefer below the chip; flip above when there's no room.
      let top = r.bottom + TOOLTIP_GAP_PX;
      const wouldOverflowBottom =
        top + tooltipHeight > window.innerHeight - VIEWPORT_INSET_PX;
      if (wouldOverflowBottom && r.top - TOOLTIP_GAP_PX - tooltipHeight > VIEWPORT_INSET_PX) {
        top = r.top - TOOLTIP_GAP_PX - tooltipHeight;
      }

      let left = r.left + r.width / 2 - TOOLTIP_WIDTH_PX / 2;
      const minLeft = VIEWPORT_INSET_PX;
      const maxLeft = window.innerWidth - TOOLTIP_WIDTH_PX - VIEWPORT_INSET_PX;
      left = Math.max(minLeft, Math.min(maxLeft, left));

      setCoords({ top, left });
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onAnyTap = (e: MouseEvent | TouchEvent) => {
      const target = e.target instanceof Node ? e.target : null;
      const inButton =
        buttonRef.current && target && buttonRef.current.contains(target);
      const inTooltip =
        tooltipRef.current && target && tooltipRef.current.contains(target);
      if (!inButton && !inTooltip) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onAnyTap);
    document.addEventListener("touchstart", onAnyTap);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onAnyTap);
      document.removeEventListener("touchstart", onAnyTap);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!breakdown) return null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        aria-expanded={open}
        aria-label="Como esses pontos foram calculados"
        className={`text-base font-black rounded-full px-3 py-1 border cursor-help ${tone(
          breakdown.total,
          breakdown.exact
        )}`}
      >
        {label ?? defaultLabel(breakdown.total, breakdown.exact)}
      </button>

      {open && coords !== null && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={tooltipRef}
              role="tooltip"
              onMouseEnter={() => setOpen(true)}
              onMouseLeave={() => setOpen(false)}
              style={{
                position: "fixed",
                top: coords.top,
                left: coords.left,
                width: TOOLTIP_WIDTH_PX,
              }}
              className="z-[70] rounded-2xl bg-slate-900 border border-slate-700 shadow-xl p-3 text-base text-left text-slate-200 normal-case tracking-normal whitespace-normal"
            >
              <span className="block font-black text-white mb-2">
                Como você ganha pontos
              </span>

              <BreakdownLine
                label="Placar exato"
                value={`+${SCORING_RULES.EXACT_SCORE} pts`}
                active={breakdown.exact}
              />
              <BreakdownLine
                label="Acertou o vencedor"
                value={`+${SCORING_RULES.CORRECT_OUTCOME} pts`}
                active={breakdown.correctOutcome && !breakdown.exact}
                mutedWhenInactive={breakdown.exact}
              />
              <BreakdownLine
                label="Acertou o placar do time da casa"
                value={`+${SCORING_RULES.CORRECT_TEAM_SCORE} pts`}
                active={breakdown.correctTeamA && !breakdown.exact}
                mutedWhenInactive={breakdown.exact}
              />
              <BreakdownLine
                label="Acertou o placar do time visitante"
                value={`+${SCORING_RULES.CORRECT_TEAM_SCORE} pts`}
                active={breakdown.correctTeamB && !breakdown.exact}
                mutedWhenInactive={breakdown.exact}
              />

              <span className="block mt-2 pt-2 border-t border-slate-800 font-black text-white">
                Total: {breakdown.total} pts
              </span>

              {provisional && (
                <span className="block mt-2 text-slate-400 text-base">
                  Cálculo provisório baseado no placar ao vivo. Vai re-contar
                  quando o resultado for oficializado.
                </span>
              )}
            </div>,
            document.body
          )
        : null}
    </>
  );
}

function BreakdownLine({
  label,
  value,
  active,
  mutedWhenInactive,
}: {
  label: string;
  value: string;
  active: boolean;
  mutedWhenInactive?: boolean;
}) {
  const cls = active
    ? "text-emerald-300"
    : mutedWhenInactive
      ? "text-slate-500"
      : "text-slate-400";
  return (
    <span className={`flex items-center justify-between gap-3 ${cls}`}>
      <span className="flex items-center gap-2">
        <span aria-hidden="true">{active ? "✅" : "•"}</span>
        <span>{label}</span>
      </span>
      <span className="font-bold tabular-nums">{value}</span>
    </span>
  );
}
