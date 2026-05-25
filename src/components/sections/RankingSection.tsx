"use client";

import { Player } from "@/types/player";
import { Card, CardContent } from "@/components/ui/card";

interface RankingSectionProps {
  ranking: (Player & { total: number; exacts: number })[];
}

export function RankingSection({ ranking }: RankingSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-black">Ranking Geral</h2>
        <p className="text-slate-400 text-sm">
          Classificação atual do bolão.
        </p>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ranking.slice(0, 3).map((player, index) => (
          <Card
            key={player.id}
            className="bg-slate-900 border-slate-800 text-white rounded-3xl"
          >
            <CardContent className="p-5 text-center space-y-3">
              <img
                src="/brand/bolao-logo.jpg"
                alt="Ranking"
                className="mx-auto h-16 w-16 rounded-2xl object-cover shadow-lg"
              />

              <div className="text-4xl md:text-3xl font-black">{index + 1}º</div>
              <div className="font-bold">{player.name}</div>
              <div className="text-yellow-400 font-black text-xl">
                {player.total} pts
              </div>
              <div className="text-xs text-slate-400">
                {player.exacts} placares exatos
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Full Ranking Table */}
      <Card className="bg-slate-900 border-slate-800 text-white rounded-3xl">
        <CardContent className="p-0 overflow-hidden">
          {ranking.map((player, index) => (
            <div
              key={player.id}
              className="grid grid-cols-12 p-4 border-b border-slate-800 items-center"
            >
              <div className="col-span-2 font-black text-yellow-400">
                {index + 1}º
              </div>
              <div className="col-span-6 font-semibold">
                {player.name}
              </div>
              <div className="col-span-2 text-right font-bold">
                {player.total}
              </div>
              <div className="col-span-2 text-right text-xs text-slate-400">
                {player.exacts} exatos
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
