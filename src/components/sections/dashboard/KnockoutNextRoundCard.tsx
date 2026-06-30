"use client";

import Link from "next/link";
import { Swords } from "lucide-react";
import { DisplayKnockoutMatch } from "@/lib/knockoutDisplayMatches";
import {
  BRACKET_GEOMETRY,
  BracketColumn,
  BracketRound,
  buildRoundSlots,
} from "@/components/sections/KnockoutBracketView";
import { StickySectionHeader } from "./StickySectionHeader";

interface KnockoutBracketPreviewProps {
  currentRound: BracketRound | null;
  currentMatches: DisplayKnockoutMatch[];
  nextRound: BracketRound | null;
  nextMatches: DisplayKnockoutMatch[];
}

export function KnockoutBracketPreview({
  currentRound,
  currentMatches,
  nextRound,
  nextMatches,
}: KnockoutBracketPreviewProps) {
  if (!currentRound && !nextRound) return null;

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
          // The Palpite/Resultado header row makes each card taller than
          // the /mata-mata default, so the grid row height needs to grow
          // in lockstep — otherwise siblings overlap. Tuned so the
          // current-round card sits cleanly with the small header on top
          // and the L-connectors meet the compact next-round card.
          ["--bracket-row" as string]: "8.5rem",
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
                slots={buildRoundSlots(currentRound, currentMatches)}
                isLastRound={!nextRound}
              />
            )}
            {nextRound && (
              <BracketColumn
                round={nextRound}
                slots={buildRoundSlots(nextRound, nextMatches)}
                isLastRound
                compact
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
