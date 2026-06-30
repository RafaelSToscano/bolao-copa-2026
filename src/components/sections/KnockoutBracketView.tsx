"use client";

import { useEffect, useRef } from "react";
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

function ColumnHeaderRow({ size = "default" }: { size?: "default" | "large" }) {
  const isLarge = size === "large";
  const cellWidth = isLarge ? "w-7" : "w-5";
  const padding = isLarge ? "px-3" : "px-2";

  return (
    <div
      className={`flex items-center gap-2 ${padding} mb-0.5 text-[10px] font-black uppercase tracking-widest text-slate-500`}
    >
      <span className="flex-1" />
      <span
        className={`shrink-0 ${cellWidth} text-center text-blue-300/70`}
        title="Palpite"
      >
        P
      </span>
      <span
        className={`shrink-0 ${cellWidth} text-center`}
        title="Resultado"
      >
        R
      </span>
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
      } ${isWinner ? "bg-yellow-400/15 text-yellow-300" : "text-white"}`}
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
}: {
  match: DisplayKnockoutMatch;
  emphasis?: boolean;
  /** Flag-only layout. Used by the dashboard's next-round preview so the
   * two-column bracket fragment fits on mobile without horizontal scroll. */
  compact?: boolean;
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
        <div className="flex items-center justify-center gap-2">
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
              <ColumnHeaderRow size="large" />
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
              />
              <TeamRow
                team={awayTeam}
                score={hasScore ? match.official_score_away : null}
                prediction={awayPrediction}
                isWinner={awayWinner}
                size="large"
                provisional={softenTeamNames}
                showPredictionColumn={showPredictionColumn}
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

      {showPredictionColumn && <ColumnHeaderRow />}
      <div className="space-y-0.5">
        <TeamRow
          team={homeTeam}
          score={hasScore ? match.official_score_home : null}
          prediction={homePrediction}
          isWinner={homeWinner}
          provisional={softenTeamNames}
          showPredictionColumn={showPredictionColumn}
        />
        <TeamRow
          team={awayTeam}
          score={hasScore ? match.official_score_away : null}
          prediction={awayPrediction}
          isWinner={awayWinner}
          provisional={softenTeamNames}
          showPredictionColumn={showPredictionColumn}
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

export function BracketColumn({
  round,
  slots,
  isLastRound,
  compact = false,
}: {
  round: BracketRound;
  slots: BracketSlot[];
  isLastRound: boolean;
  /** Flag-only cards, narrower column width. Used by the dashboard
   * preview to keep two rounds visible on mobile without horizontal
   * scroll. */
  compact?: boolean;
}) {
  const isFinal = round === "final";
  const columnWidth = compact
    ? "var(--bracket-col-compact-w, 8.5rem)"
    : isFinal
      ? "calc(var(--bracket-col-w) * 2)"
      : "var(--bracket-col-w)";

  return (
    <div className="flex shrink-0 flex-col" data-round={round}>
      <h3
        className={`mb-3 text-center font-black uppercase tracking-wide ${
          isFinal && !compact
            ? "text-xl text-yellow-300"
            : "text-sm text-yellow-400/90"
        }`}
      >
        {BRACKET_ROUND_TITLE[round]}
      </h3>

      <div
        className="grid"
        style={{
          width: columnWidth,
          gridTemplateRows: "repeat(16, var(--bracket-row))",
        }}
      >
        {slots.map((slot, index) => {
          const isTopSibling = index % 2 === 0;
          const hasParent = !isLastRound;

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
                style={{ paddingRight: "var(--bracket-gap)" }}
              >
                {slot.match ? (
                  <MatchCard
                    match={slot.match}
                    emphasis={isFinal && !compact}
                    compact={compact}
                  />
                ) : (
                  <EmptyMatchCard />
                )}
              </div>

              {hasParent && (
                <Connector
                  isTopSibling={isTopSibling}
                  siblingSpan={slot.rowSpan}
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
// that meets at the parent card's center in the next column.
function Connector({
  isTopSibling,
  siblingSpan,
}: {
  isTopSibling: boolean;
  siblingSpan: number;
}) {
  // Vertical bar height: distance from this card's center to the pair's
  // midpoint. Two siblings each span `siblingSpan` rows; the midpoint sits
  // exactly `siblingSpan / 2` rows away from each card's center.
  const verticalHeight = `calc(var(--bracket-row) * ${siblingSpan / 2})`;
  // The connector's elbow (vertical bar) sits at the midpoint of the
  // inter-column gap so the half-L from each sibling meets the next
  // column's card cleanly. `--bracket-gap` is the entire gap width;
  // `--bracket-elbow` is half of it (the elbow's distance from this card's
  // right edge).
  const elbowOffset = "var(--bracket-elbow)";

  return (
    <>
      <span
        className="pointer-events-none absolute top-1/2 h-px bg-slate-600"
        style={{ right: elbowOffset, width: elbowOffset }}
        aria-hidden
      />
      <span
        className="pointer-events-none absolute w-px bg-slate-600"
        style={{
          right: elbowOffset,
          height: verticalHeight,
          top: isTopSibling ? "50%" : "auto",
          bottom: isTopSibling ? "auto" : "50%",
        }}
        aria-hidden
      />
      <span
        className="pointer-events-none absolute right-0 h-px bg-slate-600"
        style={{
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
      <h3 className="mb-3 text-center text-sm font-black uppercase tracking-wide text-yellow-400/90">
        3º lugar
      </h3>
      {match ? <MatchCard match={match} /> : <EmptyMatchCard />}
    </div>
  );
}

// Picks the round the user most likely wants to see first: the earliest
// round in tournament order that still has any match without a confirmed
// winner. `winner_team` is the only reliable "this match is done" signal —
// `match_date` is unreliable because a scheduled date in the past does NOT
// mean the match has been played (admin may not have entered the result
// yet), and using it would push the anchor all the way to the final on
// match day. Falls back to the final once every round is decided.
function pickAnchorRound(matches: DisplayKnockoutMatch[]): BracketRound {
  for (const round of BRACKET_ROUNDS) {
    const roundMatches = matches.filter((m) => m.round === round);
    if (roundMatches.length === 0) continue;

    const hasPendingMatch = roundMatches.some((m) => m.winner_team === null);
    if (hasPendingMatch) return round;
  }

  return "final";
}

export function KnockoutBracketView({ matches }: Props) {
  const columns = BRACKET_ROUNDS.map((round) => ({
    round,
    slots: buildRoundSlots(
      round,
      matches.filter((match) => match.round === round)
    ),
  }));

  const thirdPlaceMatch =
    matches.find((match) => match.round === "third_place") ?? null;

  const scrollerRef = useRef<HTMLDivElement>(null);
  const anchorRound = pickAnchorRound(matches);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const column = scroller.querySelector<HTMLElement>(
      `[data-round="${anchorRound}"]`
    );
    if (!column) return;

    // Position the anchor round flush with the container's left edge so
    // the active round is the first thing the user sees on open. We
    // always run this — even when the anchor is r32 (which technically
    // sits at scrollLeft 0) — because browsers restore the previous
    // horizontal scroll position on reload, which would otherwise leave
    // the user staring at whatever round they last visited.
    const containerRect = scroller.getBoundingClientRect();
    const columnRect = column.getBoundingClientRect();
    const left = columnRect.left - containerRect.left + scroller.scrollLeft;
    scroller.scrollTo({ left, behavior: "auto" });
  }, [anchorRound]);

  return (
    <div
      ref={scrollerRef}
      // touch-action: manipulation lets the browser handle all gestures
      // (horizontal pan on this scroll container, vertical page scroll
      // bubbling out, and pinch-zoom on the page). pan-x alone blocks the
      // vertical scroll bubble; pinch-zoom alone blocks horizontal pan.
      className="-mx-4 overflow-x-auto pb-6 md:mx-0 [touch-action:manipulation]"
      style={BRACKET_GEOMETRY}
    >
      <div className="min-w-max px-4 md:px-1">
        <div className="mb-4 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm font-bold text-slate-300 md:hidden">
          Use dois dedos para dar zoom ou arraste para o lado.
        </div>

        <div className="flex items-start">
          {columns.map(({ round, slots }, index) => (
            <BracketColumn
              key={round}
              round={round}
              slots={slots}
              isLastRound={index === columns.length - 1}
            />
          ))}
        </div>

        <div className="mt-6 flex justify-center">
          <ThirdPlaceCard match={thirdPlaceMatch} />
        </div>
      </div>
    </div>
  );
}
