"use client";

import { KnockoutMatch } from "@/types/knockout";
import { Card, CardContent } from "@/components/ui/card";
import { Flag } from "@/components/ui/Flag";
import { Info } from "lucide-react";

interface PlayoffSectionProps {
  round32: KnockoutMatch[];
}

const BRACKET_GROUPS = [
  { label: "Chave A", range: [0, 4] },
  { label: "Chave B", range: [4, 8] },
  { label: "Chave C", range: [8, 12] },
  { label: "Chave D", range: [12, 16] },
];

export function PlayoffSection({ round32 }: PlayoffSectionProps) {
  const placeholders: KnockoutMatch[] = Array.from({ length: 16 }, () => ({
    home: undefined,
    away: undefined,
  }));
  const matches = round32.length === 16 ? round32 : placeholders;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black">Meu Mata-mata</h2>
        <p className="text-slate-400 text-sm">
          Simulação da primeira fase eliminatória baseada nos seus palpites de grupos.
        </p>
      </div>

      {round32.length === 0 && (
        <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4">
          <Info className="text-yellow-400 mt-0.5 shrink-0" size={18} />
          <p className="text-yellow-200 text-sm leading-relaxed">
            Faça seus palpites na aba Palpites para ver quais seleções se classificariam
            e como seria o mata-mata com base nas suas previsões.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {BRACKET_GROUPS.map(({ label, range: [from, to] }) => (
          <Card
            key={label}
            className="bg-slate-900 border-slate-800 text-white rounded-3xl"
          >
            <CardContent className="p-5 space-y-3">
              <h3 className="text-base font-black text-yellow-400 uppercase tracking-wide">
                {label}
              </h3>

              <div className="space-y-2">
                {matches.slice(from, to).map((match, i) => (
                  <MatchRow
                    key={from + i}
                    match={match}
                    matchNumber={from + i + 1}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function MatchRow({
  match,
  matchNumber,
}: {
  match: KnockoutMatch;
  matchNumber: number;
}) {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="px-4 py-1.5 bg-slate-800/50 flex items-center justify-between">
        <span className="text-xs text-slate-500 font-semibold uppercase tracking-wide">
          Jogo {matchNumber}
        </span>
        <span className="text-xs text-slate-600">1ª Fase Eliminatória</span>
      </div>

      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <TeamRow team={match.home} isAway={false} />
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="w-px h-8 bg-slate-800" />
          <span className="text-xs text-yellow-500 font-black">VS</span>
          <div className="w-px h-8 bg-slate-800" />
        </div>

        <div className="flex-1 min-w-0">
          <TeamRow team={match.away} isAway={true} />
        </div>
      </div>
    </div>
  );
}

function TeamRow({ team, isAway = false }: { team: KnockoutMatch["home"]; isAway?: boolean }) {
  if (!team) {
    return (
      <div className={`flex items-center gap-3 min-h-[36px] ${isAway ? "flex-row-reverse" : ""}`}>
        <div className="w-7 h-4 rounded-sm bg-slate-800" />
        <div className="space-y-1">
          <div className="h-2.5 w-16 rounded bg-slate-800" />
          <div className="h-3.5 w-24 rounded bg-slate-800" />
        </div>
      </div>
    );
  }

  const positionLabel =
    team.position === "3"
      ? "3º melhor terceiro"
      : `${team.position}º Grupo ${team.group}`;

  return (
    <div className={`flex items-center gap-3 min-h-[36px] ${isAway ? "flex-row-reverse" : ""}`}>
      <Flag team={team.team} size="small" />
      <div className={`truncate ${isAway ? "text-right" : ""}`}>
        <div className="text-xs text-slate-400 leading-none mb-0.5">
          {positionLabel}
        </div>
        <div className="font-bold text-sm leading-none">{team.team}</div>
      </div>
    </div>
  );
}
