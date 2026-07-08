"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Swords } from "lucide-react";
import { DisplayKnockoutMatch } from "@/lib/knockoutDisplayMatches";
import { KnockoutPrediction } from "@/types/knockout";
import {
  BRACKET_GEOMETRY,
  BracketColumn,
  BracketRound,
  BracketSlot,
  buildRoundSlots,
} from "@/components/sections/KnockoutBracketView";
import { StickySectionHeader } from "./StickySectionHeader";

interface KnockoutBracketPreviewProps {
  currentRound: BracketRound | null;
  currentMatches: DisplayKnockoutMatch[];
  nextRound: BracketRound | null;
  nextMatches: DisplayKnockoutMatch[];
  currentUserId?: string;
  knockoutPredictions?: KnockoutPrediction[];
}

// The shared BRACKET_ROUND_SPAN is calibrated for the full 16-row grid
// used on /mata-mata, so a single-round preview inherits 16 rows of
// vertical padding it doesn't need. Renormalize to just enough rows to
// vertically center the next-round column beside the current column.
function compactSlots(
  slots: BracketSlot[],
  slotsPerRow: number
): BracketSlot[] {
  return slots.map((slot) => ({ ...slot, rowSpan: slotsPerRow }));
}

export function KnockoutBracketPreview({
  currentRound,
  currentMatches,
  nextRound,
  nextMatches,
  currentUserId,
  knockoutPredictions = [],
}: KnockoutBracketPreviewProps) {
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

  if (!currentRound && !nextRound) return null;

  const currentSlots = currentRound
    ? compactSlots(buildRoundSlots(currentRound, currentMatches), 1)
    : [];
  const nextSlots = nextRound
    ? compactSlots(buildRoundSlots(nextRound, nextMatches), 2)
    : [];

  // Grid rows = the current column's slot count (each takes 1 row) OR
  // the next column's slot-count × 2 — both always equal since a
  // knockout bracket halves per round. Falls back to the next column
  // when only it is present.
  const bracketRows = currentSlots.length || nextSlots.length * 2;

  return (
    <div className="space-y-3">
      <StickySectionHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black flex items-center gap-2">
            <Swords className="text-yellow-400" size={20} />
            Mata-mata
          </h2>
          <Link
            href="/mata-mata"
            className="text-base font-bold text-yellow-400 hover:text-yellow-300"
          >
            Ver chaveamento →
          </Link>
        </div>
      </StickySectionHeader>

      <div
        className="pb-2 [touch-action:manipulation]"
        style={{
          ...BRACKET_GEOMETRY,
          ["--bracket-gap" as string]: "1.5rem",
          ["--bracket-elbow" as string]: "0.75rem",
          // Row height is calibrated for the current-round card body
          // (date + team rows + prediction row). Slot spans are
          // renormalized above so each row corresponds to exactly one
          // current-round slot, no wasted vertical space.
          ["--bracket-row" as string]: "8.5rem",
          ["--bracket-rows" as string]: String(bracketRows),
          // The next-round column is compact (flag-only), so the
          // current-round column can claim more width than the
          // /mata-mata default (14rem). clamp() lets it grow on wider
          // viewports up to 18rem, but shrinks to fit on phones so the
          // two columns + gap never force horizontal scroll. The
          // preferred value subtracts the compact column (8.5rem),
          // the gap (1.5rem), and ~2rem of side padding from 100vw.
          ["--bracket-col-w" as string]:
            "clamp(10rem, calc(100vw - 10rem), 18rem)",
        }}
      >
        <div>
          <div className="flex items-start">
            {currentRound && (
              <BracketColumn
                round={currentRound}
                slots={currentSlots}
                isLastRound={!nextRound}
                predictionsByMatchId={predictionsByMatchId}
                showPredictions={Boolean(currentUserId)}
              />
            )}
            {nextRound && (
              <BracketColumn
                round={nextRound}
                slots={nextSlots}
                isLastRound
                compact
                predictionsByMatchId={predictionsByMatchId}
                showPredictions={Boolean(currentUserId)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}