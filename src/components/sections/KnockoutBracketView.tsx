"use client";

import { useEffect, useRef } from "react";
import { Flag } from "@/components/ui/Flag";
import { formatDate } from "@/lib/formatting";
import { DisplayKnockoutMatch } from "@/lib/knockoutDisplayMatches";
import { KnockoutRound } from "@/types/knockout";
import { Shield } from "lucide-react";

type Props = {
  matches: DisplayKnockoutMatch[];
};

type BracketRound = Exclude<KnockoutRound, "third_place">;

const BRACKET_ROUNDS: BracketRound[] = ["r32", "r16", "qf", "sf", "final"];

const ROUND_TITLE: Record<BracketRound, string> = {
  r32: "16 avos",
  r16: "Oitavas",
  qf: "Quartas",
  sf: "Semifinais",
  final: "Final",
};

const ROUND_SPAN: Record<BracketRound, number> = {
  r32: 1,
  r16: 2,
  qf: 4,
  sf: 8,
  final: 16,
};

// Vertical ordering so siblings sit next to each other and connectors form
// clean Ls all the way up to the final. Indexes follow knockout_matches.match_number.
const ROUND_ORDER_BY_MATCH_NUMBER: Record<BracketRound, number[]> = {
  r32: [2, 5, 1, 3, 11, 12, 9, 10, 4, 6, 7, 8, 14, 16, 13, 15],
  r16: [1, 2, 5, 6, 3, 4, 7, 8],
  qf: [1, 2, 3, 4],
  sf: [1, 2],
  final: [1],
};

function TeamRow({
  team,
  score,
  isWinner,
}: {
  team: string | null;
  score: number | null;
  isWinner: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-2 py-1 ${
        isWinner ? "bg-yellow-400/15 text-yellow-300" : "text-white"
      }`}
    >
      {team ? (
        <Flag team={team} size="small" />
      ) : (
        <Shield size={18} className="text-slate-500" />
      )}

      <span className="flex-1 truncate text-base font-bold">
        {team ?? "A definir"}
      </span>

      {score !== null && (
        <span className="shrink-0 text-base font-black tabular-nums">
          {score}
        </span>
      )}
    </div>
  );
}

function MatchCard({
  match,
  emphasis = false,
}: {
  match: DisplayKnockoutMatch;
  emphasis?: boolean;
}) {
  const homeTeam = match.display_home_team;
  const awayTeam = match.display_away_team;

  const hasScore =
    match.official_score_home !== null && match.official_score_away !== null;

  const homeWinner = match.winner_team !== null && match.winner_team === homeTeam;
  const awayWinner = match.winner_team !== null && match.winner_team === awayTeam;

  return (
    <div
      className={`w-full rounded-xl p-2 shadow-xl shadow-black/20 ${
        emphasis
          ? "border border-yellow-400/40 bg-gradient-to-br from-slate-950 to-slate-900"
          : "border border-slate-700/80 bg-slate-950/95"
      }`}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="truncate text-sm font-semibold text-slate-400">
          {formatDate(match.match_date)}
        </p>
      </div>

      <div className="space-y-0.5">
        <TeamRow
          team={homeTeam}
          score={hasScore ? match.official_score_home : null}
          isWinner={homeWinner}
        />
        <TeamRow
          team={awayTeam}
          score={hasScore ? match.official_score_away : null}
          isWinner={awayWinner}
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

type Slot = { match: DisplayKnockoutMatch | null; rowSpan: number };

function buildRoundSlots(
  round: BracketRound,
  matches: DisplayKnockoutMatch[]
): Slot[] {
  const order = ROUND_ORDER_BY_MATCH_NUMBER[round];
  const span = ROUND_SPAN[round];
  const byNumber = new Map(matches.map((m) => [m.match_number, m]));

  return order.map((matchNumber) => ({
    match: byNumber.get(matchNumber) ?? null,
    rowSpan: span,
  }));
}

function BracketColumn({
  round,
  slots,
  isLastRound,
}: {
  round: BracketRound;
  slots: Slot[];
  isLastRound: boolean;
}) {
  const isFinal = round === "final";

  return (
    <div className="flex shrink-0 flex-col" data-round={round}>
      <h3
        className={`mb-3 text-center text-sm font-black uppercase tracking-wide ${
          isFinal ? "text-yellow-300" : "text-yellow-400/90"
        }`}
      >
        {ROUND_TITLE[round]}
      </h3>

      <div
        className="grid"
        style={{
          width: "var(--bracket-col-w)",
          gridTemplateRows: "repeat(16, var(--bracket-row))",
        }}
      >
        {slots.map((slot, index) => {
          const isTopSibling = index % 2 === 0;
          const hasParent = !isLastRound;

          return (
            <div
              key={index}
              className="relative flex items-center overflow-hidden"
              style={{ gridRow: `span ${slot.rowSpan} / span ${slot.rowSpan}` }}
            >
              <div
                className="w-full"
                style={{ paddingRight: "var(--bracket-gap)" }}
              >
                {slot.match ? (
                  <MatchCard match={slot.match} emphasis={isFinal} />
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
// round in tournament order that still has any match yet to be played. A
// match counts as "yet to be played" when its date is in the future OR it
// hasn't been scheduled yet (no date). A round whose every match has a
// past date is treated as finished and loses anchor relevance. Falls back
// to r32 before any rounds have started.
function pickAnchorRound(
  matches: DisplayKnockoutMatch[],
  now: number = Date.now()
): BracketRound {
  for (const round of BRACKET_ROUNDS) {
    const roundMatches = matches.filter((m) => m.round === round);
    if (roundMatches.length === 0) continue;

    const hasPendingMatch = roundMatches.some((m) => {
      if (!m.match_date) return true;
      const t = new Date(m.match_date).getTime();
      return Number.isNaN(t) || t >= now;
    });

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
    // r32 already sits at scrollLeft 0 — don't scroll for the default case.
    if (anchorRound === "r32") return;

    const column = scroller.querySelector<HTMLElement>(
      `[data-round="${anchorRound}"]`
    );
    if (!column) return;

    // Position the anchor round flush with the container's left edge so
    // the active round is the first thing the user sees on open.
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
      style={
        {
          // Bracket geometry knobs — all sizing flows from these so the
          // connectors stay aligned with the cards at any tuning. The row
          // height must be ≥ the rendered card height + a hair of breathing
          // room; R32 cards each occupy exactly ONE row, so a too-small row
          // makes adjacent R32 matches visually overlap.
          ["--bracket-row" as string]: "7.5rem",
          ["--bracket-col-w" as string]: "14rem",
          ["--bracket-gap" as string]: "2rem",
          ["--bracket-elbow" as string]: "1rem",
        } as React.CSSProperties
      }
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
