"use client";

import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";
import { TeamStanding } from "@/types/standings";
import { Card, CardContent } from "@/components/ui/card";
import { Flag } from "@/components/ui/Flag";
import { formatDate } from "@/lib/formatting";

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
            <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
              <div className="bg-[#2A398D] text-white text-center font-black text-sm md:text-base py-3 tracking-wide">
                CLASSIFICAÇÃO - GRUPO {group}
              </div>

              <div className="grid grid-cols-12 text-xs uppercase tracking-wide text-slate-400 px-3 py-2 font-bold border-b border-slate-800">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-4">Seleção</div>
                <div className="col-span-1 text-center">P</div>
                <div className="col-span-1 text-center">J</div>
                <div className="col-span-1 text-center">V</div>
                <div className="col-span-1 text-center">E</div>
                <div className="col-span-1 text-center">D</div>
                <div className="col-span-1 text-center">SG</div>
                <div className="col-span-1 text-center">GP</div>
              </div>

              {standings.map((team: TeamStanding, index: number) => (
                <div
                  key={team.team}
                  className={`grid grid-cols-12 px-3 py-3 border-t border-slate-800 items-center ${
                    index < 2 ? "bg-emerald-900/20" : ""
                  }`}
                >
                  <div className="col-span-1 text-center font-black text-yellow-400 text-sm">
                    {index + 1}º
                  </div>
                  <div className="col-span-4 font-semibold text-sm flex items-center gap-1">
                    <Flag team={team.team} />
                    {team.team}
                  </div>
                  <div className="col-span-1 text-center font-bold">{team.points}</div>
                  <div className="col-span-1 text-center">{team.played}</div>
                  <div className="col-span-1 text-center">{team.wins}</div>
                  <div className="col-span-1 text-center">{team.draws}</div>
                  <div className="col-span-1 text-center">{team.losses}</div>
                  <div className="col-span-1 text-center">{team.goalDiff}</div>
                  <div className="col-span-1 text-center">{team.goalsFor}</div>
                </div>
              ))}
            </div>

            {/* Games with official scores */}
            <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
              <div className="bg-[#2A398D] text-white text-center font-black text-sm md:text-base py-3 tracking-wide">
                JOGOS - GRUPO {group}
              </div>

              {groupGames.map((game: Game) => (
                <div
                  key={game.id}
                  className="grid grid-cols-[76px_minmax(76px,1fr)_32px_38px_18px_38px_32px_minmax(76px,1fr)] md:grid-cols-[90px_minmax(100px,1fr)_34px_48px_24px_48px_34px_minmax(100px,1fr)] items-center bg-slate-900 border-b border-slate-800 text-white text-sm md:text-base min-h-[48px] md:min-h-[58px] px-2 md:px-3"
                >
                  <div className="text-slate-300 text-[10px] md:text-sm whitespace-nowrap">
                    {formatDate(game.match_date)}
                  </div>
                  <div className="text-right font-semibold truncate pr-4 text-sm md:text-base">
                    {game.team_a}
                  </div>
                  <div className="flex justify-center">
                    <Flag team={game.team_a} />
                  </div>
                  <div className="flex justify-center">
                    <div className="h-9 w-10 md:h-10 md:w-12 rounded-lg border border-[#2A398D] bg-slate-950 text-center text-base md:text-lg font-bold text-white flex items-center justify-center">
                      {game.official_score_a ?? "-"}
                    </div>
                  </div>
                  <div className="text-center font-bold text-slate-300">x</div>
                  <div className="flex justify-center">
                    <div className="h-9 w-10 md:h-10 md:w-12 rounded-lg border border-[#2A398D] bg-slate-950 text-center text-base md:text-lg font-bold text-white flex items-center justify-center">
                      {game.official_score_b ?? "-"}
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <Flag team={game.team_b} />
                  </div>
                  <div className="font-semibold truncate pl-4 text-sm md:text-base">
                    {game.team_b}
                  </div>
                </div>
              ))}
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
