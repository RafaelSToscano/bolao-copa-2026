"use client";

import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";
import { TeamStanding } from "@/types/standings";
import { Card, CardContent } from "@/components/ui/card";
import { Flag } from "@/components/ui/Flag";
import { formatDate, isPast, isToday } from "@/lib/formatting";

interface StandingsSectionProps {
  games: Game[];
  predictions: Prediction[];
  allGroupStandings: Record<string, TeamStanding[]>;
  bestThirdPlace: TeamStanding[];
  calculateGroupStandingsFromPredictions: (
    groupGames: Game[],
    playerPredictions: Prediction[],
    playerId: string
  ) => TeamStanding[];
  currentUserId: string;
}

export function StandingsSection({
  games,
  allGroupStandings,
  bestThirdPlace,
}: StandingsSectionProps) {
  const groupedGames = games.reduce((acc: Record<string, Game[]>, game) => {
    const group = game.group_name || "Outros";
    if (!acc[group]) acc[group] = [];
    acc[group].push(game);
    return acc;
  }, {});
  Object.values(groupedGames).forEach((g) =>
    g.sort((a, b) => (a.match_date ?? "").localeCompare(b.match_date ?? ""))
  );

  return (
    <div className="space-y-8">
      {Object.entries(groupedGames).map(([group, groupGames]) => {
        const standings = allGroupStandings[group] || [];

        return (
          <div
            key={group}
            className="space-y-4 bg-slate-900/70 border border-slate-800 rounded-3xl p-3"
          >
            {/* Group header */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-yellow-500 text-slate-950 flex items-center justify-center font-black">
                {group}
              </div>
              <div>
                <h3 className="text-2xl font-black">Grupo {group}</h3>
                <p className="text-slate-400 text-sm">Fase de grupos</p>
              </div>
            </div>

            {/* Classification table */}
<div className="bg-slate-950/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
  <div className="bg-gradient-to-r from-[#2A398D] to-slate-900 text-white text-center font-black text-base lg:text-lg py-4 tracking-wide">
    CLASSIFICAÇÃO - GRUPO {group}
  </div>

  {/* Desktop */}
  <div className="hidden md:block">
    <div className="grid grid-cols-[52px_280px_260px] items-center justify-center text-xs lg:text-sm uppercase tracking-wide text-slate-300 px-4 py-3 font-black border-b border-slate-800 bg-slate-950">
      <div className="text-center">#</div>
      <div>Seleção</div>

      <div className="grid grid-cols-7 gap-2 text-center">
        <div>P</div>
        <div>J</div>
        <div>V</div>
        <div>E</div>
        <div>D</div>
        <div>SG</div>
        <div>GP</div>
      </div>
    </div>

    {standings.map((team: TeamStanding, index: number) => (
      <div
        key={team.team}
        className={`grid grid-cols-[52px_280px_260px] items-center justify-center px-4 py-4 border-t border-slate-800 text-sm lg:text-base ${
          index < 2 ? "bg-emerald-900/20" : ""
        }`}
      >
        <div className="text-center font-black text-yellow-400">
          {index + 1}º
        </div>

        <div className="font-black text-base lg:text-lg flex items-center gap-3 min-w-0">
          <Flag team={team.team} />
          <span className="truncate">{team.team}</span>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center font-semibold">
          <div>{team.points}</div>
          <div>{team.played}</div>
          <div>{team.wins}</div>
          <div>{team.draws}</div>
          <div>{team.losses}</div>
          <div>{team.goalDiff}</div>
          <div>{team.goalsFor}</div>
        </div>
      </div>
    ))}
  </div>

  {/* Mobile */}
  <div className="md:hidden divide-y divide-slate-800">
    {standings.map((team: TeamStanding, index: number) => (
      <div
        key={team.team}
        className={`flex items-center justify-between px-4 py-4 ${
          index < 2 ? "bg-emerald-900/20" : ""
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-yellow-400 font-black w-8 shrink-0">
            {index + 1}º
          </span>

          <Flag team={team.team} />

          <span className="font-black text-base truncate">
            {team.team}
          </span>
        </div>

        <div className="text-right shrink-0 ml-3">
          <div className="text-yellow-400 font-black text-lg">
            {team.points} pts
          </div>

          <div className="text-[11px] text-slate-400">
            J:{team.played} V:{team.wins} SG:{team.goalDiff}
          </div>
        </div>
      </div>
    ))}
  </div>
</div>

            {/* Games with official scores */}
<div className="space-y-0 bg-slate-950/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
  <div className="bg-gradient-to-r from-[#2A398D] to-slate-900 text-white text-center font-black text-base lg:text-lg py-4 tracking-wide">
    JOGOS - GRUPO {group}
  </div>

  {groupGames.map((game: Game) => {
    const past = isPast(game.match_date);
    const today = !past && isToday(game.match_date);
    const rowTone = past
      ? "border-slate-800 bg-emerald-500/[0.05] border-l-2 border-l-emerald-500/60 hover:bg-emerald-500/[0.08]"
      : today
        ? "border-slate-800 bg-amber-500/[0.04] border-l-2 border-l-amber-500/60 hover:bg-amber-500/[0.07]"
        : "border-slate-800 bg-slate-950/40 hover:bg-slate-900/70";
    return (
    <div
      key={game.id}
      className={`border-b transition ${rowTone}`}
    >
      {/* Mobile */}
      <div className="md:hidden p-3 space-y-3">
        <div className="text-slate-300 text-xs">
          {formatDate(game.match_date)}
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex items-center justify-end gap-2 min-w-0">
            <span className="font-bold text-sm text-right truncate">
              {game.team_a}
            </span>
            <Flag team={game.team_a} />
          </div>

          <div className="flex items-center justify-center gap-2">
            <div className="h-11 w-12 rounded-xl shadow-lg border border-[#2A398D] bg-slate-950 text-center text-lg font-bold text-white flex items-center justify-center">
              {game.official_score_a ?? "-"}
            </div>

            <span className="font-black text-slate-300">x</span>

            <div className="h-11 w-12 rounded-xl shadow-lg border border-[#2A398D] bg-slate-950 text-center text-lg font-bold text-white flex items-center justify-center">
              {game.official_score_b ?? "-"}
            </div>
          </div>

          <div className="flex items-center justify-start gap-2 min-w-0">
            <Flag team={game.team_b} />
            <span className="font-bold text-sm truncate">
              {game.team_b}
            </span>
          </div>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden md:grid md:grid-cols-[120px_minmax(150px,1fr)_40px_48px_24px_48px_40px_minmax(150px,1fr)] items-center text-white text-lg min-h-[54px] px-4">
        <div className="text-slate-300 text-base whitespace-nowrap">
          {formatDate(game.match_date)}
        </div>

        <div className="text-right font-bold truncate pr-5 text-lg">
          {game.team_a}
        </div>

        <div className="flex justify-center">
          <Flag team={game.team_a} />
        </div>

        <div className="flex justify-center">
          <div className="h-10 w-12 rounded-xl shadow-lg border border-[#2A398D] bg-slate-950 text-center text-lg font-bold text-white flex items-center justify-center">
            {game.official_score_a ?? "-"}
          </div>
        </div>

        <div className="text-center font-bold text-slate-300">x</div>

        <div className="flex justify-center">
          <div className="h-10 w-12 rounded-xl shadow-lg border border-[#2A398D] bg-slate-950 text-center text-lg font-bold text-white flex items-center justify-center">
            {game.official_score_b ?? "-"}
          </div>
        </div>

        <div className="flex justify-center">
          <Flag team={game.team_b} />
        </div>

        <div className="font-bold truncate pl-5 text-lg">
          {game.team_b}
        </div>
      </div>
    </div>
    );
  })}
</div>
   </div>
        );
      })}
      
      {/* Best Third Place */}
      <Card className="bg-slate-900 border-slate-800 text-white rounded-3xl">
        <CardContent className="p-5 space-y-4">
          <div>
            <h2 className="text-2xl font-black">Melhores 3º colocados</h2>
            <p className="text-slate-400 text-sm">
              Os 8 melhores avançam para o mata-mata.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-800">
            <div className="grid grid-cols-12 bg-slate-800 text-xs uppercase tracking-wide text-slate-400 p-3 font-bold">
              <div className="col-span-1">#</div>
              <div className="col-span-2">Grupo</div>
              <div className="col-span-4">Seleção</div>
              <div className="col-span-1 text-center">P</div>
              <div className="col-span-1 text-center">SG</div>
              <div className="col-span-1 text-center">GP</div>
              <div className="col-span-2 text-center">Status</div>
            </div>

            {bestThirdPlace.map((team: TeamStanding & { group?: string }, index: number) => (
              <div
                key={`${team.group}-${team.team}`}
                className={`grid grid-cols-12 p-3 border-t border-slate-800 items-center ${
                  index < 8 ? "bg-emerald-900/20" : ""
                }`}
              >
                <div className="col-span-1 font-black text-yellow-400">
                  {index + 1}º
                </div>
                <div className="col-span-2">Grupo {team.group}</div>
                <div className="col-span-4 font-semibold flex items-center gap-1">
                  <Flag team={team.team} />
                  {team.team}
                </div>
                <div className="col-span-1 text-center font-bold">{team.points}</div>
                <div className="col-span-1 text-center">{team.goalDiff}</div>
                <div className="col-span-1 text-center">{team.goalsFor}</div>
                <div className="col-span-2 text-center text-xs font-bold">
                  {index < 8 ? "Classificado" : "Eliminado"}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
  } 
