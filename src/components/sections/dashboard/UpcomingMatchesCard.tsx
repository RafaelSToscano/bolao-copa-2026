"use client";

import { Game } from "@/types/game";
import { Card, CardContent } from "@/components/ui/card";
import { Flag } from "@/components/ui/Flag";
import { Calendar } from "lucide-react";
import { formatDate } from "@/lib/formatting";
import { StickySectionHeader } from "./StickySectionHeader";

interface UpcomingMatchesCardProps {
  games: Game[];
}

export function UpcomingMatchesCard({ games }: UpcomingMatchesCardProps) {
  return (
    <div className="space-y-3">
      <StickySectionHeader>
        <h2 className="text-xl font-black flex items-center gap-2">
          <Calendar className="text-yellow-400" size={20} />
          Próximos jogos
        </h2>
      </StickySectionHeader>

      <Card className="bg-slate-900 border-slate-800 text-white rounded-3xl">
        <CardContent className="p-0 overflow-hidden">
          {games.length === 0 ? (
            <div className="p-5 text-center text-base text-slate-400">
              Nenhum jogo agendado.
            </div>
          ) : (
            games.map((game) => (
              <div
                key={game.id}
                className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center p-4 border-b border-slate-800 last:border-b-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Flag team={game.team_a} size="medium" />
                  <span className="font-bold truncate">{game.team_a}</span>
                </div>

                <div className="flex flex-col items-center text-base">
                  <span className="text-slate-400 font-semibold">
                    {formatDate(game.match_date)}
                  </span>
                  {game.group_name && (
                    <span className="text-yellow-400 font-bold">
                      Grupo {game.group_name}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 justify-end min-w-0">
                  <span className="font-bold truncate text-right">{game.team_b}</span>
                  <Flag team={game.team_b} size="medium" />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
