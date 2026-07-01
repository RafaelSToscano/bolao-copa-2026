"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode, RefObject } from "react";
import { Flag } from "@/components/ui/Flag";
import { formatDate, isToday } from "@/lib/formatting";
import { DisplayKnockoutMatch } from "@/lib/knockoutDisplayMatches";
import { KnockoutPrediction, KnockoutRound } from "@/types/knockout";
import { Shield } from "lucide-react";

type Props = {
  matches: DisplayKnockoutMatch[];
  knockoutPredictions?: KnockoutPrediction[];
  currentUserId?: string;
  showPredictions?: boolean;
};

type MatchMeta = DisplayKnockoutMatch & {
  my_prediction?: KnockoutPrediction | null;
  live?: boolean;
  tentative_teams?: boolean;
};

export type BracketRound = Exclude<KnockoutRound, "third_place">;

const BRACKET_ROUNDS: BracketRound[] = ["r32", "r16", "qf", "sf", "final"];

export const BRACKET_ROUND_TITLE: Record<BracketRound, string> = {
  r32: "16 avos",
  r16: "Oitavas",
  qf: "Quartas",
  sf: "Semifinais",
  final: "Final",
};

export const BRACKET_ROUND_SPAN: Record<BracketRound, number> = {
  r32: 1,
  r16: 2,
  qf: 4,
  sf: 8,
  final: 16,
};

export const BRACKET_ROUND_ORDER_BY_MATCH_NUMBER: Record<
  BracketRound,
  number[]
> = {
  r32: [2, 5, 1, 3, 11, 12, 9, 10, 4, 6, 7, 8, 14, 16, 13, 15],
  r16: [1, 2, 5, 6, 3, 4, 7, 8],
  qf: [1, 2, 3, 4],
  sf: [1, 2],
  final: [1],
};

export const BRACKET_GEOMETRY: CSSProperties = {
  ["--bracket-row" as string]: "7.5rem",
  ["--bracket-col-w" as string]: "14rem",
  ["--bracket-gap" as string]: "2rem",
  ["--bracket-elbow" as string]: "1rem",
};

function LiveDot({ size = 8 }: { size?: number }) {
  return (
    <span
      className="relative inline-flex shrink-0"
      style={{ width: size, height: size }}
      aria-label="Ao vivo"
      title="Ao vivo"
    >
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
      <span className="relative inline-flex h-full w-full rounded-full bg-red-500" />
    </span>
  );
}

function HeaderCell({
  letter,
  label,
  className = "",
  cellWidth,
}: {
  letter: string;
  label: string;
  className?: string;
  cellWidth: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent | TouchEvent) => {
      if (!ref.current) return;
      if (e.target instanceof Node && ref.current.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    document.addEventListener("touchstart", handle);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("touchstart", handle);
    };
  }, [open]);

  return (
    <span
      ref={ref}
      className={`group relative shrink-0 ${cellWidth} text-center ${className}`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-describedby={`hdr-${letter}-tooltip`}
        className="inline-block w-full bg-transparent p-0 text-center font-black uppercase tracking-widest"
      >
        {letter}
      </button>
      <span
        id={`hdr-${letter}-tooltip`}
        role="tooltip"
        className={`pointer-events-none absolute left-1/2 bottom-full z-50 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-200 shadow-lg transition-opacity duration-150 group-hover:opacity-100 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      >
        {label}
      </span>
    </span>
  );
}

function ColumnHeaderRow({
  size = "default",
  mirrored = false,
}: {
  size?: "default" | "large";
  mirrored?: boolean;
}) {
  const isLarge = size === "large";
  const cellWidth = isLarge ? "w-7" : "w-5";
  const padding = isLarge ? "px-3" : "px-2";

  return (
    <div
      className={`flex items-center gap-2 ${padding} mb-0.5 text-[10px] font-black uppercase tracking-widest text-slate-500 ${
        mirrored ? "flex-row-reverse" : ""
      }`}
    >
      <span className="flex-1" />
      <HeaderCell
        letter="P"
        label="Palpite"
        cellWidth={cellWidth}
        className="text-blue-300/70"
      />
      <HeaderCell letter="R" label="Resultado" cellWidth={cellWidth} />
    </div>
  );
}

function TeamRow({
  team,
  score,
  prediction,
  isWinner,
  size = "default",
  provisional = false,
  showPredictionColumn = false,
  mirrored = false,
}: {
  team: string | null;
  score: number | null;
  prediction: number | null;
  isWinner: boolean;
  size?: "default" | "large";
  provisional?: boolean;
  showPredictionColumn?: boolean;
  mirrored?: boolean;
}) {
  const isLarge = size === "large";
  const teamClass = provisional
    ? "italic text-slate-300/80"
    : isWinner
      ? ""
      : "";

  return (
    <div
      className={`flex items-center rounded-lg ${
        isLarge ? "gap-3 px-3 py-2" : "gap-2 px-2 py-1"
      } ${isWinner ? "bg-yellow-400/15 text-yellow-300" : "text-white"} ${
        mirrored ? "flex-row-reverse" : ""
      }`}
    >
      {team ? (
        <Flag team={team} size={isLarge ? "medium" : "small"} />
      ) : (
        <Shield size={isLarge ? 24 : 18} className="text-slate-500" />
      )}

      <span
        className={`flex-1 truncate font-bold ${
          isLarge ? "text-xl" : "text-base"
        } ${teamClass}`}
      >
        {team ?? "A definir"}
      </span>

      {showPredictionColumn && (
        <span
          className={`shrink-0 text-center font-black tabular-nums text-blue-300/70 ${
            isLarge ? "w-7 text-2xl" : "w-5 text-base"
          }`}
        >
          {prediction !== null ? prediction : (
            <span className="text-slate-600">—</span>
          )}
        </span>
      )}

      {score !== null && (
        <span
          className={`shrink-0 text-center font-black tabular-nums ${
            isLarge ? "w-7 text-2xl" : "w-5 text-base"
          }`}
        >
          {score}
        </span>
      )}

      {score === null && showPredictionColumn && (
        <span
          className={`shrink-0 text-center font-black tabular-nums text-slate-600 ${
            isLarge ? "w-7 text-2xl" : "w-5 text-base"
          }`}
        >
          —
        </span>
      )}
    </div>
  );
}

export function MatchCard({
  match,
  prediction = null,
  showPredictions = false,
  emphasis = false,
  compact = false,
  mirrored = false,
}: {
  match: DisplayKnockoutMatch;
  prediction?: KnockoutPrediction | null;
  showPredictions?: boolean;
  emphasis?: boolean;
  compact?: boolean;
  mirrored?: boolean;
}) {
  const matchMeta = match as MatchMeta;
  const homeTeam = match.display_home_team;
  const awayTeam = match.display_away_team;

  const hasScore =
    match.official_score_home !== null && match.official_score_away !== null;

  const effectivePrediction = prediction ?? matchMeta.my_prediction ?? null;
  const homePrediction = effectivePrediction?.predicted_score_home ?? null;
  const awayPrediction = effectivePrediction?.predicted_score_away ?? null;

  const homeWinner = match.winner_team !== null && match.winner_team === homeTeam;
  const awayWinner = match.winner_team !== null && match.winner_team === awayTeam;
  const isLive = matchMeta.live === true;
  const isTentativeTeams = matchMeta.tentative_teams === true;
  const softenTeamNames = isLive || isTentativeTeams;

  const showPredictionColumn =
    !compact && (showPredictions || matchMeta.my_prediction !== undefined);

  const isToday_ = !compact && !isLive && isToday(match.match_date);

  if (compact) {
    return (
      <div
        className={`w-full rounded-xl border bg-slate-950/95 px-3 py-3 shadow-xl shadow-black/20 ${
          isLive || isToday_
            ? "border-amber-400/40 ring-1 ring-amber-400/20"
            : "border-slate-700/80"
        }`}
      >
        <p
          className={`mb-2 flex items-center justify-center gap-1.5 truncate text-center text-[11px] font-semibold ${
            isLive || isToday_ ? "text-amber-300/80" : "text-slate-400"
          }`}
        >
          {isLive && <LiveDot size={7} />}
          {isToday_
            ? `Hoje · ${formatDate(match.match_date)}`
            : formatDate(match.match_date)}
        </p>
        <div
          className={`flex items-center justify-center gap-2 ${
            mirrored ? "flex-row-reverse" : ""
          }`}
        >
          {homeTeam ? (
            <Flag team={homeTeam} size="medium" />
          ) : (
            <Shield size={20} className="text-slate-500" />
          )}
          {hasScore ? (
            <span className="text-base font-black tabular-nums text-white">
              {match.official_score_home}
            </span>
          ) : null}
          <span className="text-sm font-black text-slate-500">×</span>
          {hasScore ? (
            <span className="text-base font-black tabular-nums text-white">
              {match.official_score_away}
            </span>
          ) : null}
          {awayTeam ? (
            <Flag team={awayTeam} size="medium" />
          ) : (
            <Shield size={20} className="text-slate-500" />
          )}
        </div>
      </div>
    );
  }

  if (emphasis) {
    return (
      <div className="relative">
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-12 animate-[bracket-fog_5s_ease-in-out_infinite] bg-[radial-gradient(50%_50%_at_50%_50%,rgba(253,224,71,0.45),rgba(253,224,71,0.12)_45%,transparent_75%)] blur-2xl"
        />

        <div className="relative w-full overflow-hidden rounded-2xl border-2 border-yellow-400/70 bg-gradient-to-br from-amber-500/20 via-slate-950 to-slate-900 p-5 shadow-2xl shadow-amber-500/25 ring-1 ring-yellow-400/30">
          <div className="relative">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 truncate text-base font-semibold text-yellow-300/90">
                {isLive && <LiveDot />}
                {isToday_
                  ? `Hoje · ${formatDate(match.match_date)}`
                  : formatDate(match.match_date)}
              </p>
            </div>

            {showPredictionColumn && (
              <ColumnHeaderRow size="large" mirrored={mirrored} />
            )}
            <div className="space-y-2">
              <TeamRow
                team={homeTeam}
                score={hasScore ? match.official_score_home : null}
                prediction={homePrediction}
                isWinner={homeWinner}
                size="large"
                provisional={softenTeamNames}
                showPredictionColumn={showPredictionColumn}
                mirrored={mirrored}
              />
              <TeamRow
                team={awayTeam}
                score={hasScore ? match.official_score_away : null}
                prediction={awayPrediction}
                isWinner={awayWinner}
                size="large"
                provisional={softenTeamNames}
                showPredictionColumn={showPredictionColumn}
                mirrored={mirrored}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full rounded-xl border bg-slate-950/95 p-2 shadow-xl shadow-black/20 ${
        isLive || isToday_
          ? "border-amber-400/40 ring-1 ring-amber-400/20"
          : "border-slate-700/80"
      }`}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p
          className={`flex items-center gap-1.5 truncate text-sm font-semibold ${
            isLive || isToday_ ? "text-amber-300/80" : "text-slate-400"
          }`}
        >
          {isLive && <LiveDot />}
          {isToday_
            ? `Hoje · ${formatDate(match.match_date)}`
            : formatDate(match.match_date)}
        </p>
      </div>

      {showPredictionColumn && <ColumnHeaderRow mirrored={mirrored} />}
      <div className="space-y-0.5">
        <TeamRow
          team={homeTeam}
          score={hasScore ? match.official_score_home : null}
          prediction={homePrediction}
          isWinner={homeWinner}
          provisional={softenTeamNames}
          showPredictionColumn={showPredictionColumn}
          mirrored={mirrored}
        />
        <TeamRow
          team={awayTeam}
          score={hasScore ? match.official_score_away : null}
          prediction={awayPrediction}
          isWinner={awayWinner}
          provisional={softenTeamNames}
          showPredictionColumn={showPredictionColumn}
          mirrored={mirrored}
        />
      </div>
    </div>
  );
}

function EmptyMatchCard() {
  return (
    <div className="w-full rounded-xl border border-dashed border-slate-700 p-3 text-center text-sm text-slate-500">
      A definir
    </div>
  );
}

export type BracketSlot = {
  match: DisplayKnockoutMatch | null;
  rowSpan: number;
};

export function buildRoundSlots(
  round: BracketRound,
  matches: DisplayKnockoutMatch[]
): BracketSlot[] {
  const order = BRACKET_ROUND_ORDER_BY_MATCH_NUMBER[round];
  const span = BRACKET_ROUND_SPAN[round];
  const byNumber = new Map(matches.map((m) => [m.match_number, m]));

  return order.map((matchNumber) => ({
    match: byNumber.get(matchNumber) ?? null,
    rowSpan: span,
  }));
}

export function splitRoundSlots(
  round: BracketRound,
  matches: DisplayKnockoutMatch[]
): { top: BracketSlot[]; bottom: BracketSlot[] } {
  const full = buildRoundSlots(round, matches);
  const midpoint = Math.floor(full.length / 2);
  return {
    top: full.slice(0, full.length - midpoint),
    bottom: full.slice(full.length - midpoint),
  };
}

export function BracketColumn({
  round,
  slots,
  isLastRound,
  compact = false,
  mirrored = false,
  stickyHeader = false,
  hideHeader = false,
  footer = null,
  predictionsByMatchId,
  showPredictions = false,
}: {
  round: BracketRound;
  slots: BracketSlot[];
  isLastRound: boolean;
  compact?: boolean;
  mirrored?: boolean;
  stickyHeader?: boolean;
  hideHeader?: boolean;
  footer?: ReactNode;
  predictionsByMatchId?: Map<number, KnockoutPrediction>;
  showPredictions?: boolean;
}) {
  const isFinal = round === "final";
  const columnWidth = compact
    ? "var(--bracket-col-compact-w, 8.5rem)"
    : isFinal
      ? "calc(var(--bracket-col-w) * 2)"
      : "var(--bracket-col-w)";

  return (
    <div className="flex shrink-0 flex-col" data-round={round}>
      {!hideHeader && (
        <h3
          className={`mb-3 text-center font-black uppercase tracking-wide ${
            stickyHeader
              ? "sticky top-[56px] z-10 bg-slate-950/95 py-2 backdrop-blur supports-[backdrop-filter]:bg-slate-950/80 lg:top-0"
              : ""
          } ${
            isFinal && !compact
              ? "text-xl text-yellow-300"
              : "text-sm text-yellow-400/90"
          }`}
        >
          {BRACKET_ROUND_TITLE[round]}
        </h3>
      )}

      <div
        className="grid"
        style={{
          width: columnWidth,
          gridTemplateRows:
            "repeat(var(--bracket-rows, 16), var(--bracket-row))",
        }}
      >
        {slots.map((slot, index) => {
          const isTopSibling = index % 2 === 0;
          const hasParent = !isLastRound;
          const isLoneSibling = slots.length === 1;
          const showFooter = footer !== null && index === slots.length - 1;

          return (
            <div
              key={index}
              className={`relative flex items-center ${
                isFinal && !compact ? "" : "overflow-hidden"
              }`}
              style={{ gridRow: `span ${slot.rowSpan} / span ${slot.rowSpan}` }}
            >
              <div
                className="relative w-full"
                style={
                  isLastRound
                    ? undefined
                    : mirrored
                      ? { paddingLeft: "var(--bracket-gap)" }
                      : { paddingRight: "var(--bracket-gap)" }
                }
              >
                {slot.match ? (
                  <MatchCard
                    match={slot.match}
                    prediction={predictionsByMatchId?.get(slot.match.id) ?? null}
                    showPredictions={showPredictions}
                    emphasis={isFinal && !compact}
                    compact={compact}
                    mirrored={mirrored}
                  />
                ) : (
                  <EmptyMatchCard />
                )}

                {showFooter && (
                  <div
                    className="absolute inset-x-0 top-full mt-6 flex justify-center"
                    style={
                      isLastRound
                        ? undefined
                        : mirrored
                          ? { paddingLeft: "var(--bracket-gap)" }
                          : { paddingRight: "var(--bracket-gap)" }
                    }
                  >
                    {footer}
                  </div>
                )}
              </div>

              {hasParent && (
                <Connector
                  isTopSibling={isTopSibling}
                  siblingSpan={slot.rowSpan}
                  mirrored={mirrored}
                  straight={isLoneSibling}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Connector({
  isTopSibling,
  siblingSpan,
  mirrored = false,
  straight = false,
}: {
  isTopSibling: boolean;
  siblingSpan: number;
  mirrored?: boolean;
  straight?: boolean;
}) {
  const elbowOffset = "var(--bracket-elbow)";
  const edgeKey = mirrored ? "left" : "right";

  if (straight) {
    return (
      <span
        className="pointer-events-none absolute top-1/2 h-px bg-slate-600"
        style={{ [edgeKey]: 0, width: `calc(${elbowOffset} * 2)` }}
        aria-hidden
      />
    );
  }

  const verticalHeight = `calc(var(--bracket-row) * ${siblingSpan / 2})`;

  return (
    <>
      <span
        className="pointer-events-none absolute top-1/2 h-px bg-slate-600"
        style={{ [edgeKey]: elbowOffset, width: elbowOffset }}
        aria-hidden
      />
      <span
        className="pointer-events-none absolute w-px bg-slate-600"
        style={{
          [edgeKey]: elbowOffset,
          height: verticalHeight,
          top: isTopSibling ? "50%" : "auto",
          bottom: isTopSibling ? "auto" : "50%",
        }}
        aria-hidden
      />
      <span
        className="pointer-events-none absolute h-px bg-slate-600"
        style={{
          [edgeKey]: 0,
          width: elbowOffset,
          top: isTopSibling ? "auto" : "0",
          bottom: isTopSibling ? "0" : "auto",
        }}
        aria-hidden
      />
    </>
  );
}

function ThirdPlaceCard({
  match,
  predictionsByMatchId,
  showPredictions = false,
}: {
  match: DisplayKnockoutMatch | null;
  predictionsByMatchId?: Map<number, KnockoutPrediction>;
  showPredictions?: boolean;
}) {
  return (
    <div className="w-full max-w-xs">
      <h3 className="mb-3 text-center text-sm font-black uppercase tracking-wide text-sky-400/90">
        3º lugar
      </h3>
      {match ? (
        <MatchCard
          match={match}
          prediction={predictionsByMatchId?.get(match.id) ?? null}
          showPredictions={showPredictions}
        />
      ) : (
        <EmptyMatchCard />
      )}
    </div>
  );
}

function BracketHeaderStrip({
  rounds,
  scrollerRef,
}: {
  rounds: BracketRound[];
  scrollerRef: RefObject<HTMLDivElement | null>;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const track = trackRef.current;
    if (!scroller || !track) return;

    let pending = false;
    const sync = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        track.style.transform = `translateX(${-scroller.scrollLeft}px)`;
      });
    };

    sync();
    scroller.addEventListener("scroll", sync, { passive: true });
    return () => scroller.removeEventListener("scroll", sync);
  }, [scrollerRef]);

  return (
    <div className="pointer-events-none sticky top-[56px] z-20 -mx-4 overflow-hidden border-b border-slate-800/60 bg-slate-950/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-slate-950/80 md:-mx-0 lg:top-0">
      <div ref={trackRef} className="flex min-w-max will-change-transform">
        {rounds.map((round, index) => {
          const isFinal = round === "final";
          const width = isFinal
            ? "calc(var(--bracket-col-w) * 2)"
            : "var(--bracket-col-w)";
          return (
            <div
              key={`${round}-${index}`}
              className="shrink-0 px-1 text-center"
              style={{ width }}
            >
              <span
                className={`font-black uppercase tracking-wide ${
                  isFinal
                    ? "text-xl text-yellow-300"
                    : "text-sm text-yellow-400/90"
                }`}
              >
                {BRACKET_ROUND_TITLE[round]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function useDragScroll(ref: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let isDown = false;
    let startX = 0;
    let startY = 0;
    let startScrollLeft = 0;
    let startScrollTop = 0;
    let startWindowScrollY = 0;
    let moved = false;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("a, button, input, textarea, select, [role='button']")) {
        return;
      }
      isDown = true;
      moved = false;
      startX = e.pageX;
      startY = e.pageY;
      startScrollLeft = el.scrollLeft;
      startScrollTop = el.scrollTop;
      startWindowScrollY = window.scrollY;
      el.style.cursor = "grabbing";
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      const dx = e.pageX - startX;
      const dy = e.pageY - startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;

      el.scrollLeft = startScrollLeft - dx;

      const hasInternalVScroll = el.scrollHeight > el.clientHeight + 1;
      if (hasInternalVScroll) {
        el.scrollTop = startScrollTop - dy;
      } else {
        window.scrollTo({
          left: window.scrollX,
          top: startWindowScrollY - dy,
          behavior: "auto",
        });
      }
    };

    const endDrag = () => {
      if (!isDown) return;
      isDown = false;
      el.style.cursor = "";
    };

    const onClickCapture = (e: MouseEvent) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }
    };

    el.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", endDrag);
    el.addEventListener("mouseleave", endDrag);
    el.addEventListener("click", onClickCapture, true);

    return () => {
      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", endDrag);
      el.removeEventListener("mouseleave", endDrag);
      el.removeEventListener("click", onClickCapture, true);
    };
  }, [ref]);
}

export function KnockoutBracketView({
  matches,
  knockoutPredictions = [],
  currentUserId,
  showPredictions = false,
}: Props) {
  const predictionsByMatchId = useMemo(() => {
    const byMatchId = new Map<number, KnockoutPrediction>();

    if (!currentUserId) return byMatchId;

    for (const prediction of knockoutPredictions) {
      if (prediction.player_id === currentUserId) {
        byMatchId.set(prediction.match_id, prediction);
      }
    }

    return byMatchId;
  }, [currentUserId, knockoutPredictions]);

  const shouldShowPredictions = showPredictions && Boolean(currentUserId);

  const columns = BRACKET_ROUNDS.map((round) => ({
    round,
    slots: buildRoundSlots(
      round,
      matches.filter((match) => match.round === round)
    ),
  }));

  const splitColumns = BRACKET_ROUNDS.map((round) => ({
    round,
    ...splitRoundSlots(
      round,
      matches.filter((match) => match.round === round)
    ),
  }));

  const thirdPlaceMatch =
    matches.find((match) => match.round === "third_place") ?? null;

  const scrollerRef = useRef<HTMLDivElement>(null);
  const desktopScrollerRef = useRef<HTMLDivElement>(null);

  useDragScroll(scrollerRef);
  useDragScroll(desktopScrollerRef);

  const hasPredictionColumn =
    shouldShowPredictions ||
    matches.some((match) => (match as MatchMeta).my_prediction !== undefined);

  const geometry: CSSProperties = hasPredictionColumn
    ? {
        ...BRACKET_GEOMETRY,
        ["--bracket-row" as string]: "8.5rem",
      }
    : BRACKET_GEOMETRY;

  const mirrorGeometry: CSSProperties = {
    ...geometry,
    ["--bracket-rows" as string]: "8",
  };

  const standardGeometry: CSSProperties = {
    ...geometry,
    ["--bracket-rows" as string]: "16",
  };

  const finalColumn = splitColumns.find((c) => c.round === "final");
  const leftHalfRounds = BRACKET_ROUNDS.filter((r) => r !== "final");
  const rightHalfRounds = [...leftHalfRounds].reverse();

  const mobileHeaderRounds = BRACKET_ROUNDS;
  const desktopHeaderRounds: BracketRound[] = [
    ...leftHalfRounds,
    "final",
    ...rightHalfRounds,
  ];

  return (
    <>
      <div className="md:hidden" style={standardGeometry}>
        <BracketHeaderStrip
          rounds={mobileHeaderRounds}
          scrollerRef={scrollerRef}
        />
        <div
          ref={scrollerRef}
          className="-mx-4 select-none overflow-x-auto pb-6 [touch-action:manipulation]"
          data-bracket-variant="mobile"
        >
          <div className="min-w-max px-4">
            <div className="mb-4 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm font-bold text-slate-300">
              Use dois dedos para dar zoom ou arraste para o lado.
            </div>

            <div className="flex items-start">
              {columns.map(({ round, slots }, index) => (
                <BracketColumn
                  key={round}
                  round={round}
                  slots={slots}
                  isLastRound={index === columns.length - 1}
                  hideHeader
                  predictionsByMatchId={predictionsByMatchId}
                  showPredictions={shouldShowPredictions}
                  footer={
                    round === "final" ? (
                      <ThirdPlaceCard
                        match={thirdPlaceMatch}
                        predictionsByMatchId={predictionsByMatchId}
                        showPredictions={shouldShowPredictions}
                      />
                    ) : null
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        className="hidden min-w-0 md:block"
        style={mirrorGeometry}
        data-bracket-variant="desktop"
      >
        <BracketHeaderStrip
          rounds={desktopHeaderRounds}
          scrollerRef={desktopScrollerRef}
        />
        <div
          ref={desktopScrollerRef}
          className="min-w-0 cursor-grab select-none overflow-x-auto pb-6 [touch-action:manipulation]"
        >
          <div className="flex min-w-max items-start justify-center px-4">
            {leftHalfRounds.map((round) => {
              const column = splitColumns.find((c) => c.round === round)!;
              return (
                <BracketColumn
                  key={`left-${round}`}
                  round={round}
                  slots={column.top}
                  isLastRound={false}
                  hideHeader
                  predictionsByMatchId={predictionsByMatchId}
                  showPredictions={shouldShowPredictions}
                />
              );
            })}

            {finalColumn && (
              <BracketColumn
                round="final"
                slots={finalColumn.top.map((slot) => ({
                  ...slot,
                  rowSpan: 8,
                }))}
                isLastRound
                hideHeader
                predictionsByMatchId={predictionsByMatchId}
                showPredictions={shouldShowPredictions}
                footer={
                  <ThirdPlaceCard
                    match={thirdPlaceMatch}
                    predictionsByMatchId={predictionsByMatchId}
                    showPredictions={shouldShowPredictions}
                  />
                }
              />
            )}

            {rightHalfRounds.map((round) => {
              const column = splitColumns.find((c) => c.round === round)!;
              return (
                <BracketColumn
                  key={`right-${round}`}
                  round={round}
                  slots={column.bottom}
                  isLastRound={false}
                  mirrored
                  hideHeader
                  predictionsByMatchId={predictionsByMatchId}
                  showPredictions={shouldShowPredictions}
                />
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}