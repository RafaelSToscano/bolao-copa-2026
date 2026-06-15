"use client";

import { Player } from "@/types/player";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface RankingSectionProps {
  ranking: (Player & { total: number; exacts: number; position: number })[];
  positionChanges?: Map<string, number>;
}

function PositionBadge({ change }: { change: number | undefined }) {
  if (change === undefined || change === 0)
    return <span className="text-slate-600 text-xs flex items-center gap-0.5"><Minus size={12} /></span>;
  if (change > 0)
    return (
      <span className="text-emerald-400 text-xs font-bold flex items-center gap-0.5">
        <TrendingUp size={12} />+{change}
      </span>
    );
  return (
    <span className="text-red-400 text-xs font-bold flex items-center gap-0.5">
      <TrendingDown size={12} />{change}
    </span>
  );
}

const podiumCards = [
  {
    label: "1º",
    title: "Líder",
    icon: "🏆",
    color: "text-yellow-400",
  },
  {
    label: "2º",
    title: "Vice-líder",
    icon: "🥈",
    color: "text-slate-300",
  },
  {
    label: "3º",
    title: "Terceiro",
    icon: "🥉",
    color: "text-orange-300",
  },
];

export function RankingSection({ ranking, positionChanges }: RankingSectionProps) {
  const lastPlayer = ranking.length > 0 ? ranking[ranking.length - 1] : null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-black">Ranking Geral</h2>
        <p className="text-slate-400 text-sm">
          Classificação atual do bolão.
        </p>
      </div>

      {/* Podium + Lantern */}
<div className="space-y-3">
  <div className="grid grid-cols-3 gap-2 md:grid-cols-2 xl:grid-cols-3 md:gap-4">
    {ranking.slice(0, 3).map((player, index) => {
      const card = podiumCards[index];

      return (
        <Card
          key={player.id}
          className="bg-slate-900 border-slate-800 text-white rounded-2xl md:rounded-3xl"
        >
          <CardContent className="p-2 md:p-5 text-center space-y-1 md:space-y-3">
            <div className="text-2xl md:text-7xl leading-none drop-shadow-lg">
              {card.icon}
            </div>

            <div
              className={`text-base md:text-3xl font-black ${card.color} flex items-center justify-center gap-1`}
            >
              {player.position}º
              <PositionBadge change={positionChanges?.get(player.id)} />
            </div>

            <div className="hidden md:block text-xs uppercase tracking-wide text-slate-400 font-black">
              {player.position === 1 ? "LÍDER" : card.title}
            </div>

            <div className="text-base md:text-lg font-bold truncate">
              {player.name}
            </div>

            <div className="text-yellow-400 font-black text-base md:text-xl">
              {player.total} pts
            </div>

            <div className="hidden md:flex items-center justify-center gap-2 text-xs text-slate-400">
              <span>{player.exacts} placares exatos</span>
            </div>

            <div className="md:hidden text-base text-slate-400">
              {player.exacts}✓
            </div>
          </CardContent>
        </Card>
      );
    })}
  </div>

  {lastPlayer && (
    <Card className="bg-slate-900 border-red-900/60 text-white rounded-3xl">
      <CardContent className="p-3 md:p-5 grid grid-cols-12 md:block items-center md:text-center md:space-y-3">
        <div className="col-span-2 text-2xl md:text-7xl drop-shadow-lg">
          🔦
        </div>

        <div className="col-span-2 font-black text-red-400 md:text-3xl">
          {lastPlayer.position}º
        </div>

        <div className="col-span-6 font-semibold truncate md:space-y-3">
          <span className="text-base uppercase tracking-wider text-red-300 font-black mr-2">
            Lanterna
          </span>
          {lastPlayer.name}
        </div>

        <div className="col-span-2 text-right font-bold text-red-400 md:text-center md:text-xl">
          {lastPlayer.total}
        </div>

        <div className="hidden md:flex items-center justify-center gap-2 text-xs text-slate-400">
          <span>Prêmio consolação 😅</span>
          <PositionBadge change={positionChanges?.get(lastPlayer.id)} />
        </div>
      </CardContent>
    </Card>
  )}
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
                {player.position}º
              </div>

              <div className="col-span-5 font-semibold truncate">
                {player.name}
              </div>

              <div className="col-span-2 flex justify-center">
                <PositionBadge change={positionChanges?.get(player.id)} />
              </div>

              <div className="col-span-2 text-right font-bold">
                {player.total}
              </div>

              <div className="col-span-1 text-right text-xs text-slate-500">
                {player.exacts}✓
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}