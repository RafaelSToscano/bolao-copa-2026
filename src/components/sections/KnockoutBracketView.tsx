"use client";

import { useEffect, useRef, useState } from "react";
import { Flag } from "@/components/ui/Flag";
import { formatDate, isToday } from "@/lib/formatting";
import { DisplayKnockoutMatch } from "@/lib/knockoutDisplayMatches";
import { KnockoutRound } from "@/types/knockout";
import { Shield } from "lucide-react";

type Props = {
  matches: DisplayKnockoutMatch[];
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

// Vertical ordering so siblings sit next to each other and connectors form
// clean Ls all the way up to the final. Indexes follow knockout_matches.match_number.
export const BRACKET_ROUND_ORDER_BY_MATCH_NUMBER: Record<BracketRound, number[]> = {
  r32: [2, 5, 1, 3, 11, 12, 9, 10, 4, 6, 7, 8, 14, 16, 13, 15],
  r16: [1, 2, 5, 6, 3, 4, 7, 8],
  qf: [1, 2, 3, 4],
  sf: [1, 2],
  final: [1],
};

// Bracket geometry knobs — all sizing flows from these so the
// connectors stay aligned with the cards at any tuning. Exported so
// dashboard previews can mount BracketColumn with the same scale.
export const BRACKET_GEOMETRY: React.CSSProperties = {
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
      <span
        className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"
      />
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
  // Hover shows the tooltip on desktop. On touch devices (no hover),
  // tap toggles it open and any outside tap closes it. The
  // peer-focus class also keeps the tooltip visible while the button
  // is focused via keyboard, for accessibility.
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
  /** This team's predicted score from the user's palpite. `null` when
   * the user has no prediction (renders a muted dash) or when the
   * prediction column is hidden entirely. */
  prediction: number | null;
  isWinner: boolean;
  size?: "default" | "large";
  /** Renders the team name as tentative (italic + dimmer) — used when
   * the team here is a live-score-derived provisional cascade, not a
   * DB-confirmed result. */
  provisional?: boolean;
  /** Reserve space and render the prediction cell. Hidden on `/mata-mata`
   * and other surfaces that don't pass a user prediction. */
  showPredictionColumn?: boolean;
  /** Flips the row contents so flag/score sit on opposite sides — used
   * by the right-half desktop mirror so the layout reads outward from
   * the center: score + guess + name + flag. */
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
  emphasis = false,
  compact = false,
  mirrored = false,
}: {
  match: DisplayKnockoutMatch;
  emphasis?: boolean;
  /** Flag-only layout. Used by the dashboard's next-round preview so the
   * two-column bracket fragment fits on mobile without horizontal scroll. */
  compact?: boolean;
  /** Flips internal row layout so the score sits on the inside of the
   * mirror bracket (closer to center). Used by the desktop mirror's
   * right half. */
  mirrored?: boolean;
}) {
  const homeTeam = match.display_home_team;
  const awayTeam = match.display_away_team;

  const hasScore =
    match.official_score_home !== null && match.official_score_away !== null;

  const homeWinner = match.winner_team !== null && match.winner_team === homeTeam;
  const awayWinner = match.winner_team !== null && match.winner_team === awayTeam;
  const isLive = match.live === true;
  const isTentativeTeams = match.tentative_teams === true;
  const softenTeamNames = isLive || isTentativeTeams;

  // `my_prediction === undefined` → caller didn't plumb predictions, so
  // we skip the P column entirely (this is what /mata-mata does).
  // `my_prediction === null` → caller plumbed predictions and confirmed
  // there's no palpite for this match — render the column with dashes
  // so the layout stays consistent across cards in the same view.
  const showPredictionColumn =
    !compact && match.my_prediction !== undefined;
  const homePrediction = match.my_prediction?.predicted_score_home ?? null;
  const awayPrediction = match.my_prediction?.predicted_score_away ?? null;
  // Highlight today's matches in amber so users can spot them at a glance,
  // same convention as PredictionsSection / Upcoming dashboard rows.
  // Applies regardless of whether the match has finished yet — a final
  // result from earlier today is still "today" and worth surfacing.
  // Skipped for compact cards (the next-round preview) since the next
  // round usually isn't today, and a stray same-day next-round match
  // shouldn't visually compete with the current-round cards. Live
  // matches keep their own amber tone instead of stacking.
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
        {/* Golden fog — a soft, animated radial cloud that bleeds OUTSIDE
            the card to give the Final a halo. Lives in a sibling layer
            (not inside the card) because the card has overflow-hidden
            for the inner glow orbit. The fog uses a long ease-in-out
            opacity pulse so the halo breathes slowly. Keyframes live in
            globals.css as `bracket-fog`. */}
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

export type BracketSlot = { match: DisplayKnockoutMatch | null; rowSpan: number };

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

// Splits a round's bracket slots at the midpoint so the desktop mirror
// layout can render the top half on the left and the bottom half on the
// right. `BRACKET_ROUND_ORDER_BY_MATCH_NUMBER` already pairs siblings in
// bracket order, so the first N/2 entries feed the top semifinal and the
// remaining N/2 feed the bottom. The Final has only one slot, so it
// returns it under `top` and an empty `bottom`.
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
}: {
  round: BracketRound;
  slots: BracketSlot[];
  isLastRound: boolean;
  /** Flag-only cards, narrower column width. Used by the dashboard
   * preview to keep two rounds visible on mobile without horizontal
   * scroll. */
  compact?: boolean;
  /** Flips card padding side and connector geometry so the column
   * points inward from the right. Used by the desktop mirror layout
   * for the right half of the bracket. */
  mirrored?: boolean;
  /** Pin the round title to the top of the nearest scrolling ancestor
   * so it stays in view while the user scrolls vertically. Used by the
   * /mata-mata page; the dashboard preview leaves it off because it
   * lives inside a section with its own sticky header. */
  stickyHeader?: boolean;
  /** Skip rendering the column header entirely — used when the parent
   * lifts headers into a separate sticky row above the scroller so
   * vertical page scroll keeps them pinned (CSS `position: sticky`
   * inside a scrollable ancestor would otherwise stay trapped there). */
  hideHeader?: boolean;
  /** Extra content stacked vertically beneath each match card inside
   * the same grid cell. The Final column uses this to render the 3rd
   * place card right under the Final without falling off the bottom
   * of the bracket. */
  footer?: React.ReactNode;
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
          // --bracket-rows defaults to 16 (full bracket height). The
          // desktop mirror layout overrides it to 8 so each half-column
          // collapses to the height of 8 r32 slots.
          gridTemplateRows:
            "repeat(var(--bracket-rows, 16), var(--bracket-row))",
        }}
      >
        {slots.map((slot, index) => {
          const isTopSibling = index % 2 === 0;
          const hasParent = !isLastRound;
          // In the desktop mirror, the sf round renders just one card
          // per side — no sibling to pair with — so the L-shaped vertical
          // bar would dangle. Collapse it to a straight horizontal line
          // pointing at the Final card.
          const isLoneSibling = slots.length === 1;

          const showFooter = footer !== null && index === slots.length - 1;

          return (
            <div
              key={index}
              // The Final card paints a fog halo that bleeds outside its
              // own bounds, so we can't clip its cell. R32 (rowSpan 1)
              // still needs overflow-hidden so cards don't overlap.
              className={`relative flex items-center ${
                isFinal && !compact ? "" : "overflow-hidden"
              }`}
              style={{ gridRow: `span ${slot.rowSpan} / span ${slot.rowSpan}` }}
            >
              <div
                className="relative w-full"
                // The trailing/leading gap exists to give the NEXT
                // column's connector room to reach this card. The last
                // round (Final) has no neighbor pointing into it from
                // that side, so it skips the padding — otherwise it
                // would leave dead space between the Final card and the
                // mirror's right-side SF column, breaking the SF→Final
                // connector.
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
                    emphasis={isFinal && !compact}
                    compact={compact}
                    mirrored={mirrored}
                  />
                ) : (
                  <EmptyMatchCard />
                )}

                {/* Footer is absolutely positioned below the card so it
                    doesn't shift the card's vertical centering in the
                    cell — the sibling-column connectors target the
                    cell's vertical midpoint, so the card must stay
                    centered. The footer's own padding mirrors the
                    wrapper's so it aligns under the card horizontally. */}
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

// Each card draws half of the bracket: a short horizontal stub at its own
// vertical center, then a vertical bar from that center to the midpoint with
// its sibling. The sibling draws the mirror half — together they form the L
// that meets at the parent card's center in the next column. When mirrored,
// all three spans pin to the card's left edge instead of the right so the
// L points toward the center of a mirror layout.
function Connector({
  isTopSibling,
  siblingSpan,
  mirrored = false,
  straight = false,
}: {
  isTopSibling: boolean;
  siblingSpan: number;
  mirrored?: boolean;
  /** Skip the L-shape and just draw a straight horizontal line at the
   * card's mid-height. Used by the desktop mirror's sf → final bridge,
   * where each side has only one sf card so there's no sibling to pair
   * with and no vertical bar to draw. */
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

function ThirdPlaceCard({ match }: { match: DisplayKnockoutMatch | null }) {
  return (
    <div className="w-full max-w-xs">
      {/* Blue label so it doesn't read as part of the Final card now
          that they share the same column. */}
      <h3 className="mb-3 text-center text-sm font-black uppercase tracking-wide text-sky-400/90">
        3º lugar
      </h3>
      {match ? <MatchCard match={match} /> : <EmptyMatchCard />}
    </div>
  );
}

// Headers row that mirrors the bracket scroller's column layout and
// syncs its horizontal position to the scroller's scrollLeft via a
// `transform: translateX(-scrollLeft)`. Rendered as a sibling above the
// scroller so it can be `position: sticky` against the page viewport
// (the bracket scroller would otherwise trap sticky inside itself).
function BracketHeaderStrip({
  rounds,
  scrollerRef,
}: {
  rounds: BracketRound[];
  scrollerRef: React.RefObject<HTMLDivElement | null>;
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

// Mouse drag-to-pan on a scrollable element. Pans both axes — horizontal
// inside the element when scrollable, vertical bubbles up to the window
// when the element has no vertical scroll. Mobile already gets native
// touch pan; this adds the same gesture for desktop pointers so users
// can grab the bracket and drag it in any direction. We bail out of the
// trailing click only if the pointer actually moved, so card clicks
// still work.
function useDragScroll(ref: React.RefObject<HTMLDivElement | null>) {
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
      // Only react to primary button. Let right-click and middle-click
      // through so users can still open links / paste / etc.
      if (e.button !== 0) return;
      // Skip when the press lands on an interactive element so clicks
      // and text inputs still work normally.
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

      // Horizontal pan inside the scrollable element.
      el.scrollLeft = startScrollLeft - dx;

      // Vertical pan — element first if it scrolls vertically, otherwise
      // bubble to the page so the whole bracket page pans.
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

    // If the pointer was dragged, swallow the trailing click so links /
    // buttons inside the scroller don't fire after a pan gesture.
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

export function KnockoutBracketView({ matches }: Props) {
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

  // Center the desktop mirror on mount so the Final is in view and the
  // user can drag either way to inspect the halves. (The mobile anchor
  // logic doesn't apply here — desktop mirror has no notion of an
  // "active round" because both halves are visually equal weight.)
  useEffect(() => {
    const scroller = desktopScrollerRef.current;
    if (!scroller) return;
    const left = (scroller.scrollWidth - scroller.clientWidth) / 2;
    if (typeof scroller.scrollTo === "function") {
      scroller.scrollTo({ left, behavior: "auto" });
    } else {
      scroller.scrollLeft = left;
    }
  }, []);

  // Wire mouse drag-to-pan on both scrollers. Mobile already gets touch
  // pan natively via overflow-x-auto; this adds the same gesture for
  // desktop pointers so users can grab and drag the bracket horizontally.
  useDragScroll(scrollerRef);
  useDragScroll(desktopScrollerRef);

  // If any card will render the Palpite/Resultado columns we need a
  // taller row, otherwise siblings overlap (same fix the dashboard
  // preview already applies). `my_prediction === undefined` means the
  // caller didn't plumb predictions and the column will be hidden.
  const hasPredictionColumn = matches.some(
    (match) => match.my_prediction !== undefined
  );
  const geometry: React.CSSProperties = hasPredictionColumn
    ? {
        ...BRACKET_GEOMETRY,
        ["--bracket-row" as string]: "8.5rem",
      }
    : BRACKET_GEOMETRY;

  // Mirror layout halves the row count per side (top/bottom each carry
  // 8 r32 slots instead of 16), so the grid only needs 8 rows. Without
  // this override the column would still allocate 16 rows and double its
  // vertical footprint, leaving a huge empty space below each side.
  const mirrorGeometry: React.CSSProperties = {
    ...geometry,
    ["--bracket-rows" as string]: "8",
  };
  const standardGeometry: React.CSSProperties = {
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
      {/* Mobile — a single horizontally-scrolling row of all five rounds,
          with the active round scrolled into view on mount. Round titles
          live in a sticky header strip ABOVE the scroller so they stay
          pinned to the page top while the user scrolls vertically; their
          horizontal position syncs to the bracket scroller via transform.
          `select-none` keeps mouse-drag panning (mostly used on tablets
          with a mouse, since touch panning never selects text) from
          highlighting card contents. */}
      <div className="md:hidden" style={standardGeometry}>
        <BracketHeaderStrip
          rounds={mobileHeaderRounds}
          scrollerRef={scrollerRef}
        />
        <div
          ref={scrollerRef}
          // touch-action: manipulation lets the browser handle all gestures
          // (horizontal pan on this scroll container, vertical page scroll
          // bubbling out, and pinch-zoom on the page). pan-x alone blocks the
          // vertical scroll bubble; pinch-zoom alone blocks horizontal pan.
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
                  footer={
                    round === "final" ? (
                      <ThirdPlaceCard match={thirdPlaceMatch} />
                    ) : null
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop mirror — left half grows inward, right half mirrors
          inward, Final centered. The row's intrinsic width (~160rem)
          exceeds the content area, so the wrapper pans horizontally via
          `overflow-x-auto` plus mouse drag (useDragScroll). `min-w-0`
          lets the flex/grid parent shrink below its intrinsic content
          size so the wrapper can actually scroll instead of pushing
          siblings. The grab cursor signals the drag affordance. */}
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
                />
              );
            })}

            {/* Center column — Final card with 3rd place directly under
                it (rendered as the column's footer slot so it sits right
                below the Final, not detached at the bottom of the page). */}
            {finalColumn && (
              <BracketColumn
                round="final"
                // Override the Final slot's rowSpan from 16 → 8 so the
                // center column's vertical footprint matches each half's
                // 8-row layout. The card itself stays vertically centered
                // within the 8 rows because the cell uses flex-center.
                slots={finalColumn.top.map((slot) => ({
                  ...slot,
                  rowSpan: 8,
                }))}
                isLastRound
                hideHeader
                footer={<ThirdPlaceCard match={thirdPlaceMatch} />}
              />
            )}

            {rightHalfRounds.map((round) => {
              const column = splitColumns.find((c) => c.round === round)!;
              return (
                <BracketColumn
                  key={`right-${round}`}
                  round={round}
                  slots={column.bottom}
                  // Every right-side round has a parent (the SF feeds
                  // the Final). Only the Final itself is the last round,
                  // and it's rendered as the center column separately.
                  isLastRound={false}
                  mirrored
                  hideHeader
                />
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
