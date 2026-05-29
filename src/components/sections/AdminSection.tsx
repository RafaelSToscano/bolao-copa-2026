"use client";

import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Flag } from "@/components/ui/Flag";
import { formatDate, exportAuditCsv } from "@/lib/formatting";
import { calculatePredictionPoints } from "@/services/predictions/predictionCalculations";

interface AdminSectionProps {
  games: Game[];
  predictions: Prediction[];
  players: any[];
  onUpdateResult: (
  gameId: string,
  field: "official_score_a" | "official_score_b",
  value: string
  ) => void;
  onApprovePlayer: (playerId: string) => void;
stats: {
    totalPlayers: number;
    approvedPlayers: number;
    pendingPlayers: number;
    activePlayers: number;
  };
}

export function AdminSection({
  games,
  predictions,
  players,
  onUpdateResult,
  onApprovePlayer,
  stats,
}: AdminSectionProps) {
  const handleExportCsv = () => {
    exportAuditCsv(players, games, predictions, calculatePredictionPoints);
  };

  return (
      <div className="space-y-4">
      <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
    <div>
    <h2 className="text-4xl lg:text-5xl font-black tracking-tight">
      Painel Admin
    </h2>

    <p className="text-slate-300 text-base mt-1">
      Aprove participantes e lance os resultados oficiais dos jogos.
    </p>
    </div>

  <div>
    <Button
          onClick={handleExportCsv}
          className="mt-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
        >
                Exportar auditoria CSV
    </Button>
  </div>
</div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
        <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 text-white rounded-3xl min-h-[120px] lg:min-h-[130px] flex items-center justify-center shadow-2xl">
          <CardContent className="p-5 text-center flex flex-col items-center justify-center gap-2">
            <div className="text-sm lg:text-lg font-bold text-slate-300">
              Participantes
            </div>
            <div className="text-4xl lg:text-5xl font-black text-yellow-400">
              {stats.totalPlayers}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 text-white rounded-3xl min-h-[120px] lg:min-h-[130px] flex items-center justify-center shadow-2xl">
          <CardContent className="p-5 text-center flex flex-col items-center justify-center gap-2">
            <div className="text-sm lg:text-lg font-bold text-slate-300">Aprovados</div>
            <div className="text-4xl lg:text-5xl font-black text-emerald-400">
              {stats.approvedPlayers}
            </div>
          </CardContent>
        </Card>
<Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 text-white rounded-3xl min-h-[120px] lg:min-h-[130px] flex items-center justify-center shadow-2xl">
        
          <CardContent className="p-5 text-center flex flex-col items-center justify-center gap-2">
            <div className="text-sm lg:text-lg font-bold text-slate-300">Pendentes</div>
            <div className="text-4xl lg:text-5xl font-black text-red-400">
              {stats.pendingPlayers}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 text-white rounded-3xl min-h-[120px] lg:min-h-[130px] flex items-center justify-center shadow-2xl">
          <CardContent className="p-5 text-center flex flex-col items-center justify-center gap-2">
            <div className="text-sm lg:text-lg font-bold text-slate-300">
              Já palpitou
            </div>
            <div className="text-4xl lg:text-5xl font-black text-blue-400">
              {stats.activePlayers}
            </div>
          </CardContent>
        </Card>
      </div>
{/* Pending Players */}
{players.filter((player) => !player.is_admin && !player.approved).length > 0 && (
  <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 text-white rounded-3xl shadow-2xl">
    <CardContent className="p-4 space-y-3">
      <div>
        <h3 className="text-2xl font-black">Solicitações pendentes</h3>
        <p className="text-slate-300 text-sm">
          Aprove os participantes que solicitaram acesso ao bolão.
        </p>
      </div>

      <div className="space-y-3">
        {players
          .filter((player) => !player.is_admin && !player.approved)
          .map((player) => (
            <div
              key={player.id}
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-950/80 border border-slate-800 rounded-2xl p-3 shadow-lg"
            >
              <div>
                <div className="font-bold text-lg">{player.name}</div>
                <div className="text-slate-300 text-sm">
                  Celular: {player.access_code}
                </div>
              </div>

              <Button
                onClick={() => onApprovePlayer(player.id)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl px-6"
              >
                Aprovar
              </Button>
            </div>
          ))}
      </div>
    </CardContent>
  </Card>
)}
      {/* Games with Result Input */}
      <div className="space-y-5 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-[28px] p-5 shadow-2xl">
      <div className="bg-gradient-to-r from-[#2A398D] to-slate-900 text-white text-center font-black text-base lg:text-lg py-4 tracking-wide rounded-2xl">
    RESULTADOS OFICIAIS
        </div>
              {games.map((game) => (
             <div
              key={game.id}
              className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg"
>
              <div className="grid grid-cols-[64px_minmax(70px,1fr)_28px_36px_16px_36px_28px_minmax(70px,1fr)_26px] md:grid-cols-[120px_minmax(150px,1fr)_40px_48px_24px_48px_40px_minmax(150px,1fr)_90px] items-center bg-slate-950/40 border-b border-slate-800 hover:bg-slate-900/70 transition text-white text-sm md:text-lg min-h-[48px] md:min-h-[54px] px-2 md:px-4">
                <div className="text-slate-300 text-[10px] md:text-base whitespace-nowrap">
                  {formatDate(game.match_date)}
                </div>

                <div className="text-right font-bold truncate pr-3 md:pr-5 text-sm md:text-lg">
                  {game.team_a}
                </div>

                <div className="flex justify-center">
                  <Flag team={game.team_a} />
                </div>

                <div className="flex justify-center">
                  <Input
                    type="number"
                    min="0"
                    value={game.official_score_a ?? ""}
                    onChange={(e) =>
                      onUpdateResult(
                        game.id,
                        "official_score_a",
                        e.target.value
                      )
                    }
                    className="h-10 w-11 md:h-10 md:w-12 rounded-xl shadow-lg border border-[#2A398D] bg-slate-950 text-center text-base md:text-lg font-bold text-white p-0"
                  />
                </div>

                <div className="text-center font-bold text-slate-300">
                  x
                </div>

                <div className="flex justify-center">
                  <Input
                    type="number"
                    min="0"
                    value={game.official_score_b ?? ""}
                    onChange={(e) =>
                      onUpdateResult(
                        game.id,
                        "official_score_b",
                        e.target.value
                      )
                    }
                    className="h-10 w-11 md:h-10 md:w-12 rounded-xl shadow-lg border border-[#2A398D] bg-slate-950 text-center text-base md:text-lg font-bold text-white p-0"
                  />
                </div>

                <div className="flex justify-center">
                  <Flag team={game.team_b} />
                </div>

                <div className="font-bold truncate pl-3 md:pl-5 text-sm md:text-lg">
                  {game.team_b}
                </div>
              </div>
            </div>
        ))}
      </div>
    </div>
  );
  }
