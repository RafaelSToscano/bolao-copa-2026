"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { LiveRankingRow } from "@/types/dashboard";
import { StickySectionHeader } from "./StickySectionHeader";

function DeltaArrow({ delta }: { delta: number }) {
  if (delta === 0) return null;
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
  /**
   * When the ranking includes provisional live-match points, parents
   * pass `true`. Drives which delta the row shows: the live-vs-DB
   * delta during a match, or the "since last round" delta otherwise
   * (matching the Ranking screen).
   */
  provisional?: boolean;
  onSeeAll?: () => void;
}

const podiumCards = [
  { icon: "🏆", color: "text-yellow-400", title: "Líder" },
  { icon: "🥈", color: "text-slate-300", title: "Vice-líder" },
  { icon: "🥉", color: "text-orange-300", title: "Terceiro" },
];

const ROW_HEIGHT_PX = 56;

/**
 * During a live match, show how the live computation moved the
 * player vs the DB position (positive = climbed). Otherwise mirror
 * the Ranking screen and show the "since last round" delta so both
 * surfaces agree.
 */
function deltaOf(row: LiveRankingRow, provisional: boolean) {
  if (provisional) return row.officialPosition - row.position;
  return row.lastRoundDelta;
}

export function RankingTopTen({
  top,
  lanterna,
  provisional = false,
  onSeeAll,
}: RankingTopTenProps) {
  const podium = top.slice(0, 3);
  const tail = top.slice(3, 10);

  // Sort tail+podium ALL together by player id so the DOM order stays
  // stable across re-renders, then transform each row to its current
  // visual slot. This is the FLIP idiom and lets CSS transitions
  // animate the slide.
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
            // Reserve the ring highlight for live-match swings — the
            // "since last round" delta is informational, not a live
            // event, so we keep it as a quiet arrow only.
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
                      className="absolute left-0 right-0 grid grid-cols-12 px-3 border-b border-slate-800 items-center transition-all duration-500 data-[moved=up]:bg-emerald-500/10 data-[moved=down]:bg-red-500/10"
                      style={{
                        top: `${tailIdx * ROW_HEIGHT_PX}px`,
                        height: `${ROW_HEIGHT_PX}px`,
                      }}
                    >
                      <div className="col-span-2 font-black text-yellow-400 flex items-center gap-1">
                        {player.position}º
                      </div>
                      <div className="col-span-5 font-semibold truncate">
                        {player.name}
                      </div>
                      <div className="col-span-2 flex justify-center">
                        <DeltaArrow delta={delta} />
                      </div>
                      <div className="col-span-2 text-right font-bold">
                        {player.total}
                      </div>
                      <div className="col-span-1 text-right text-base text-slate-500">
                        {player.exacts}✓
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {lanterna && top.length > 0 && top[top.length - 1].id !== lanterna.id && (
        <Card className="bg-slate-900 border-red-900/60 text-white rounded-3xl">
          <CardContent className="p-3 grid grid-cols-12 items-center">
            <div className="col-span-2 text-2xl">🔦</div>
            <div className="col-span-2 font-black text-red-400">
              {lanterna.position}º
            </div>
            <div className="col-span-6 font-semibold truncate">
              <span className="text-base uppercase tracking-wider text-red-300 font-black mr-2">
                Lanterna
              </span>
              {lanterna.name}
            </div>
            <div className="col-span-2 text-right font-bold text-red-400">
              {lanterna.total}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
