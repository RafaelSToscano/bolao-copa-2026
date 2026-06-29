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
