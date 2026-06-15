"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { LiveRankingRow } from "@/types/dashboard";
import { StickySectionHeader } from "./StickySectionHeader";

function DeltaArrow({ delta }: { delta: number }) {
  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-slate-600 text-xs font-black">
        <Minus size={12} />
      </span>
    );
  }

  if (delta > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-emerald-400 text-base font-black bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2 py-0.5">
        <TrendingUp size={14} />+{delta}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-0.5 text-red-400 text-base font-black bg-red-500/10 border border-red-500/30 rounded-full px-2 py-0.5">
      <TrendingDown size={14} />
      {delta}
    </span>
  );
}

interface RankingTopTenProps {
  top: LiveRankingRow[];
  lanterna: LiveRankingRow | null;
  relegationZone?: LiveRankingRow[];
  provisional?: boolean;
  onSeeAll?: () => void;
}

const podiumCards = [
  { icon: "🏆", color: "text-yellow-400", title: "Líder" },
  { icon: "🥈", color: "text-slate-300", title: "Vice-líder" },
  { icon: "🥉", color: "text-orange-300", title: "Terceiro" },
];

const ROW_HEIGHT_PX = 56;

function deltaOf(row: LiveRankingRow, provisional: boolean) {
  if (provisional) return row.officialPosition - row.position;
  return row.lastRoundDelta;
}

function RankingRow({
  player,
  provisional,
  variant = "default",
}: {
  player: LiveRankingRow;
  provisional: boolean;
  variant?: "default" | "relegation" | "lanterna";
}) {
  const delta = deltaOf(player, provisional);
  const isLanterna = variant === "lanterna";
  const isRelegation = variant === "relegation" || isLanterna;

  return (
    <div
      className={`grid grid-cols-12 px-3 border-b border-slate-800 items-center min-h-14 ${
        isRelegation ? "bg-red-500/10" : ""
      }`}
    >
      <div
        className={`col-span-2 font-black flex items-center gap-1 ${
          isRelegation ? "text-red-300" : "text-yellow-400"
        }`}
      >
        {isLanterna && <span className="text-xl">🔦</span>}
        {player.position}º
      </div>

      <div className="col-span-5 font-semibold truncate">
        {isLanterna && (
          <span className="text-base uppercase tracking-wider text-red-300 font-black mr-2">
            Lanterna
          </span>
        )}
        {!isLanterna && isRelegation && (
          <span className="mr-1 text-red-300">⬇</span>
        )}
        {player.name}
      </div>

      <div className="col-span-2 flex justify-center">
        <DeltaArrow delta={delta} />
      </div>

      <div
        className={`col-span-2 text-right font-bold ${
          isRelegation ? "text-red-300" : ""
        }`}
      >
        {player.total}
      </div>

      <div className="col-span-1 text-right text-base text-slate-500">
        {player.exacts}✓
      </div>
    </div>
  );
}

export function RankingTopTen({
  top,
  lanterna,
  relegationZone = [],
  provisional = false,
  onSeeAll,
}: RankingTopTenProps) {
  const podium = top.slice(0, 3);
  const tail = top.slice(3, 10);

  const allRows = useMemo(() => [...podium, ...tail], [podium, tail]);
  const stable = useMemo(
    () => [...allRows].sort((a, b) => a.id.localeCompare(b.id)),
    [allRows]
  );
  const visualIndexById = useMemo(() => {
    const m = new Map<string, number>();
    allRows.forEach((row, idx) => m.set(row.id, idx));
    return m;
  }, [allRows]);

  const relegationWithoutLanterna = relegationZone.filter(
    (player) => player.id !== lanterna?.id
  );

  return (
    <div className="space-y-3">
      <StickySectionHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black">Top do Ranking</h2>
          {onSeeAll && (
            <button
              type="button"
              onClick={onSeeAll}
              className="text-base font-bold text-yellow-400 hover:text-yellow-300"
            >
              Ver ranking completo →
            </button>
          )}
        </div>
      </StickySectionHeader>

      {podium.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800 text-white rounded-3xl">
          <CardContent className="p-6 text-center text-slate-400">
            Aguardando primeiros pontos
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          {podium.map((player, i) => {
            const card = podiumCards[i];
            const delta = deltaOf(player, provisional);
            const liveMove = provisional && delta !== 0;

            return (
              <Card
                key={player.id}
                data-moved={liveMove ? (delta > 0 ? "up" : "down") : undefined}
                className="bg-slate-900 border-slate-800 text-white rounded-2xl md:rounded-3xl transition-all duration-500 data-[moved=up]:ring-2 data-[moved=up]:ring-emerald-400/60 data-[moved=down]:ring-2 data-[moved=down]:ring-red-400/60"
              >
                <CardContent className="p-2 md:p-4 text-center space-y-1 md:space-y-2">
                  <div className="text-2xl md:text-5xl leading-none">
                    {card.icon}
                  </div>

                  <div
                    className={`text-base md:text-2xl font-black ${card.color} flex items-center justify-center gap-1 md:gap-2`}
                  >
                    {player.position}º
                    <DeltaArrow delta={delta} />
                  </div>

                  <div className="hidden md:block text-base uppercase tracking-wide text-slate-400 font-black">
                    {card.title}
                  </div>

                  <div className="text-base font-bold truncate">
                    {player.name}
                  </div>

                  <div className="text-yellow-400 font-black text-base md:text-lg">
                    {player.total} pts
                  </div>

                  <div className="hidden md:block text-base text-slate-400">
                    {player.exacts} placares exatos
                  </div>

                  <div className="md:hidden text-base text-slate-400">
                    {player.exacts}✓
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {tail.length > 0 && (
        <Card className="bg-slate-900 border-slate-800 text-white rounded-3xl">
          <CardContent className="p-0 relative">
            <div
              className="relative"
              style={{ height: `${tail.length * ROW_HEIGHT_PX}px` }}
            >
              {stable
                .filter((p) => (visualIndexById.get(p.id) ?? -1) >= 3)
                .map((player) => {
                  const visualIdx = visualIndexById.get(player.id) ?? 0;
                  const tailIdx = visualIdx - 3;
                  const delta = deltaOf(player, provisional);
                  const liveMove = provisional && delta !== 0;

                  return (
                    <div
                      key={player.id}
                      data-moved={liveMove ? (delta > 0 ? "up" : "down") : undefined}
                      className="absolute left-0 right-0 transition-all duration-500 data-[moved=up]:bg-emerald-500/10 data-[moved=down]:bg-red-500/10"
                      style={{
                        top: `${tailIdx * ROW_HEIGHT_PX}px`,
                        height: `${ROW_HEIGHT_PX}px`,
                      }}
                    >
                      <RankingRow
                        player={player}
                        provisional={provisional}
                      />
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {relegationZone.length > 0 && (
        <div className="space-y-2 pt-1">
          <div>
            <h3 className="text-base font-black text-red-300">
              Zona do Rebaixamento
            </h3>
            <p className="text-xs text-slate-500">
              Os 5 últimos colocados do bolão.
            </p>
          </div>

          <Card className="bg-slate-900 border-red-900/60 text-white rounded-3xl">
            <CardContent className="p-0 overflow-hidden">
              {relegationWithoutLanterna.map((player) => (
                <RankingRow
                  key={player.id}
                  player={player}
                  provisional={provisional}
                  variant="relegation"
                />
              ))}

              {lanterna && (
                <RankingRow
                  player={lanterna}
                  provisional={provisional}
                  variant="lanterna"
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}