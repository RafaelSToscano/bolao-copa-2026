"use client";

import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";
import { KnockoutMatch, QualifiedTeam } from "@/types/knockout";
import { Card, CardContent } from "@/components/ui/card";

interface KnockoutSectionProps {
  games: Game[];
  predictions: Prediction[];
  round32: KnockoutMatch[];
  qualifiedTeams: QualifiedTeam[];
  currentUserId: string;
}

export function KnockoutSection({
  games,
  predictions,
  round32,
  qualifiedTeams,
  currentUserId,
}: KnockoutSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-black">Mata-mata</h2>
        <p className="text-slate-400 text-sm">
          Classificados automáticos com base na fase de grupos.
        </p>
      </div>

      <Card className="bg-slate-900 border-slate-800 text-white rounded-3xl">
        <CardContent className="p-5 space-y-4">
          {/* Round 32 */}
          <div>
            <h3 className="text-xl font-black text-yellow-400">
              1ª fase eliminatória
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              {round32.map((match: KnockoutMatch, index: number) => (
                <Card
                  key={index}
                  className="bg-slate-950 border border-slate-800 text-white rounded-2xl"
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="text-xs text-slate-500 uppercase tracking-wide">
                      Jogo {index + 1}
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="text-xs text-slate-500">
                          {match.home
                            ? `${match.home.position}º Grupo ${match.home.group}`
                            : "A definir"}
                        </div>
                        <div className="font-bold">
                          {match.home?.team || "---"}
                        </div>
                      </div>

                      <div className="text-yellow-400 font-black">x</div>

                      <div className="flex-1 text-right">
                        <div className="text-xs text-slate-500">
                          {match.away
                            ? `${match.away.position}º Grupo ${match.away.group}`
                            : "A definir"}
                        </div>
                        <div className="font-bold">
                          {match.away?.team || "---"}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Qualified Teams */}
          <div>
            <h3 className="text-xl font-black text-yellow-400">
              Classificados diretos
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              {qualifiedTeams.map((team: QualifiedTeam) => (
                <div
                  key={`${team.position}-${team.group}-${team.team}`}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex justify-between"
                >
                  <div>
                    <div className="text-xs text-slate-400">
                      {team.position}º do Grupo {team.group}
                    </div>
                    <div className="font-bold">{team.team}</div>
                  </div>

                  <div className="text-yellow-400 font-black">
                    {team.points} pts
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
