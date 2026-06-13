"use client";

import { Game } from "@/types/game";
import { Player } from "@/types/player";
import { Prediction } from "@/types/prediction";
import { Card, CardContent } from "@/components/ui/card";
import { Flag } from "@/components/ui/Flag";
import { formatDate } from "@/lib/formatting";

interface CrowdPredictionsSectionProps {
  games: Game[];
  predictions: Prediction[];
  players: Player[];
  currentUserId: string;
  ranking: (Player & {
    total: number;
    exacts: number;
    position: number;
  })[];
}

function scoreKey(a: number | null, b: number | null) {
  if (a === null || b === null) return "Sem palpite";
  return `${a} x ${b}`;
}

function outcome(scoreA: number | null, scoreB: number | null): "A" | "E" | "B" | null {
  if (scoreA === null || scoreB === null) return null;
  if (scoreA > scoreB) return "A";
  if (scoreA < scoreB) return "B";
  return "E";
}

export function CrowdPredictionsSection({
  games,
  predictions,
  players,
  currentUserId,
  ranking,
}: CrowdPredictionsSectionProps) {
  const now = new Date().getTime();

  const nextGames = [...games]
    .filter((game) => {
      if (!game.match_date) return false;
      const hasOfficialResult =
        game.official_score_a !== null && game.official_score_b !== null;
      return !hasOfficialResult && new Date(game.match_date).getTime() >= now - 3 * 60 * 60 * 1000;
    })
    .sort((a, b) => {
      const dateA = a.match_date ? new Date(a.match_date).getTime() : Number.MAX_SAFE_INTEGER;
      const dateB = b.match_date ? new Date(b.match_date).getTime() : Number.MAX_SAFE_INTEGER;
      return dateA - dateB;
    })
    .slice(0, 2);

  const approvedPlayers = players.filter(
  (p) => p.approved
);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl lg:text-5xl font-black tracking-tight">
          Palpites da Galera
        </h2>
        <p className="text-slate-300 text-lg mt-2">
          Veja os palpites dos próximos jogos e saiba quem você precisa secar. 😅
        </p>
      </div>

      {nextGames.map((game) => {
        const gamePredictions = approvedPlayers.map((player) => {
          const prediction = predictions.find(
            (p) => p.player_id === player.id && p.game_id === game.id
          );

          return {
            player,
            prediction,
            scoreA: prediction?.predicted_score_a ?? null,
            scoreB: prediction?.predicted_score_b ?? null,
          };
        });

        const userPrediction = gamePredictions.find(
        (item) => item.player.id === currentUserId
        );
        
        const scoreCounts = new Map<string, number>();
        const resultCounts = {
          A: 0,
          E: 0,
          B: 0,
        };

        for (const item of gamePredictions) {
          const key = scoreKey(item.scoreA, item.scoreB);
          scoreCounts.set(key, (scoreCounts.get(key) ?? 0) + 1);

            const result = outcome(item.scoreA, item.scoreB);
            if (result) resultCounts[result] += 1;
            }

            const mostPickedScore =
            [...scoreCounts.entries()]
                .filter(([key]) => key !== "Sem palpite")
                .sort((a, b) => b[1] - a[1])[0] ?? null;

            const getPosition = (playerId: string) =>
                ranking.find((r) => r.id === playerId)?.position ?? 999;
                
            const sortedPredictions = [...gamePredictions].sort((a, b) => {
                return getPosition(a.player.id) - getPosition(b.player.id);
                });

            return (
            <Card
                key={game.id}
                className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 text-white rounded-3xl shadow-2xl overflow-hidden"
            >
                <CardContent className="p-5 lg:p-6 space-y-5">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                    <div className="text-sm text-slate-400 font-bold">
                        {formatDate(game.match_date)}
                    </div>

                    <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-2">
                        <Flag team={game.team_a} />
                        <span className="font-black text-lg">{game.team_a}</span>
                        </div>

                        <span className="text-yellow-400 font-black">x</span>

                        <div className="flex items-center gap-2">
                        <Flag team={game.team_b} />
                        <span className="font-black text-lg">{game.team_b}</span>
                        </div>
                    </div>
                    </div>

                    {game.group_name && (
                    <div className="text-xs text-slate-400 font-bold uppercase">
                        Grupo {game.group_name}
                    </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
                    <div className="text-xs uppercase text-slate-400 font-black">
                        Palpite
                    </div>
                    <div className="text-3xl font-black text-yellow-400 mt-2">
                        {scoreKey(userPrediction?.scoreA ?? null, userPrediction?.scoreB ?? null)}
                    </div>
                    </div>

                    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
                    <div className="text-xs uppercase text-slate-400 font-black">
                        Placar mais apostado
                    </div>
                    <div className="text-3xl font-black text-emerald-400 mt-2">
                        {mostPickedScore ? `${mostPickedScore[0]} (${mostPickedScore[1]})` : "—"}
                    </div>
                    </div>

                    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
                    <div className="text-xs uppercase text-slate-400 font-black">
                     Resumo das apostas
                    </div>

                    <div className="text-sm font-bold mt-2 space-y-1">
                 <div>
                  Vitória do {game.team_a}:{" "}
                 <span className="text-yellow-400">{resultCounts.A} apostas</span>
                </div>

                <div>
               Empate:{" "}
                  <span className="text-yellow-400">{resultCounts.E} apostas</span>
                </div>

                <div>
                  Vitória da {game.team_b}:{" "}
             <span className="text-yellow-400">{resultCounts.B} apostas</span>
            </div>
            </div>
                    </div>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl overflow-hidden">
    <div className="bg-slate-900 px-4 py-3 flex justify-between text-sm font-black uppercase text-slate-300">
        <span>Ranking</span>
        <span>Palpite</span>
    </div>

    <div className="divide-y divide-slate-800">
        {sortedPredictions.map((item) => (
        <div
            key={item.player.id}
            className={`flex items-center justify-between px-4 py-3 ${
            item.player.id === currentUserId ? "bg-yellow-500/10" : ""
            }`}
        >
            <div className="font-bold truncate">
            {getPosition(item.player.id)} - {item.player.name}
            {item.player.id === currentUserId ? " (você)" : ""}
            </div>

            <div className="font-black text-yellow-400">
            {scoreKey(item.scoreA, item.scoreB)}
            </div>
        </div>
        ))}
    </div>
    </div>

    </CardContent>
</Card>
        );
      })}
    </div>
  );
}