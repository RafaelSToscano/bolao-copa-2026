"use client";

import { useState, useEffect } from "react";
import { Player } from "@/types/player";
import { FinalPrediction, finalPredictionsService } from "@/services/supabase/finalPredictionsService";
import { Flag } from "@/components/ui/Flag";
import { ChevronDown, ChevronUp, Trophy } from "lucide-react";
import { readCache, writeCache, CACHE_FRESH_TTL_MS } from "@/lib/clientCache";

const CACHE_KEY = "finalPredictions:all";

type PositionKey = "champion" | "runner_up" | "third_place";

const POSITIONS: {
  key: PositionKey;
  label: string;
  points: number;
  medal: string;
  barColor: string;
  accentColor: string;
}[] = [
  {
    key: "champion",
    label: "Campeão",
    points: 40,
    medal: "🥇",
    barColor: "bg-yellow-500",
    accentColor: "text-yellow-400",
  },
  {
    key: "runner_up",
    label: "Vice-campeão",
    points: 25,
    medal: "🥈",
    barColor: "bg-slate-400",
    accentColor: "text-slate-300",
  },
  {
    key: "third_place",
    label: "Terceiro Lugar",
    points: 15,
    medal: "🥉",
    barColor: "bg-amber-600",
    accentColor: "text-amber-500",
  },
];

function aggregateVotes(
  predictions: FinalPrediction[],
  key: PositionKey,
  players: Player[]
): { team: string; voters: string[] }[] {
  const map = new Map<string, string[]>();

  for (const pred of predictions) {
    const team = pred[key];
    if (!team) continue;
    const name = players.find((p) => p.id === pred.player_id)?.name ?? "?";
    if (!map.has(team)) map.set(team, []);
    map.get(team)!.push(name);
  }

  return [...map.entries()]
    .map(([team, voters]) => ({ team, voters: voters.sort((a, b) => a.localeCompare(b)) }))
    .sort((a, b) => b.voters.length - a.voters.length);
}

interface PodiumVotesPanelProps {
  players: Player[];
  currentUserId: string;
}

export function PodiumVotesPanel({ players, currentUserId }: PodiumVotesPanelProps) {
  const [open, setOpen] = useState(false);
  const [predictions, setPredictions] = useState<FinalPrediction[]>(
    () => readCache<FinalPrediction[]>(CACHE_KEY)?.data ?? []
  );

  useEffect(() => {
    const cached = readCache<FinalPrediction[]>(CACHE_KEY);
    const now = Date.now();
    if (cached && now - cached.ts < CACHE_FRESH_TTL_MS) {
      setPredictions(cached.data);
      return;
    }
    finalPredictionsService.getAll().then((data) => {
      setPredictions(data);
      writeCache(CACHE_KEY, data, now);
    }).catch(() => {});
  }, []);

  const approvedIds = new Set(players.filter((p) => p.approved).map((p) => p.id));
  const approvedPredictions = predictions.filter((p) => approvedIds.has(p.player_id));
  const totalWithPrediction = approvedPredictions.length;
  const totalApproved = players.filter((p) => p.approved).length;

  const myPrediction = approvedPredictions.find((p) => p.player_id === currentUserId);

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 lg:px-6 lg:py-5 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Trophy size={18} className="text-yellow-400 shrink-0" />
          <span className="font-black text-white text-base lg:text-lg">
            Palpites do Pódio
          </span>
          {totalWithPrediction > 0 && (
            <span className="text-xs text-slate-500 font-semibold hidden sm:inline">
              {totalWithPrediction}/{totalApproved} jogadores
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-800 px-5 py-5 lg:px-6 lg:py-6 space-y-6">
          {totalWithPrediction === 0 ? (
            <p className="text-slate-500 text-sm italic text-center py-4">
              Nenhum palpite do pódio registrado ainda.
            </p>
          ) : (
            POSITIONS.map(({ key, label, points, medal, barColor, accentColor }) => {
              const votes = aggregateVotes(approvedPredictions, key, players);
              const maxVotes = votes[0]?.voters.length ?? 1;

              return (
                <div key={key}>
                  <div className={`text-xs font-black uppercase tracking-widest mb-3 ${accentColor}`}>
                    {medal} {label}
                    <span className="text-slate-600 font-semibold normal-case tracking-normal ml-1.5">
                      {points}pts
                    </span>
                  </div>

                  <div className="space-y-3">
                    {votes.map(({ team, voters }) => {
                      const pct = (voters.length / maxVotes) * 100;
                      const isMyPick = myPrediction?.[key] === team;

                      return (
                        <div key={team} className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 w-28 shrink-0">
                              <Flag team={team} size="small" />
                              <span
                                className={`text-sm font-bold truncate ${
                                  isMyPick ? "text-yellow-300" : "text-white"
                                }`}
                              >
                                {team}
                              </span>
                            </div>

                            <div className="flex-1 bg-slate-800/80 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full ${barColor} rounded-full`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>

                            <span className="text-xs font-black text-slate-400 w-5 text-right shrink-0">
                              {voters.length}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1 pl-28">
                            {voters.map((name) => {
                              const firstName = name.split(" ")[0];
                              const isMe = name === players.find((p) => p.id === currentUserId)?.name;
                              return (
                                <span
                                  key={name}
                                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                    isMe
                                      ? "bg-yellow-500/20 text-yellow-300 ring-1 ring-yellow-500/30"
                                      : "bg-slate-800 text-slate-400"
                                  }`}
                                >
                                  {firstName}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    {votes.length === 0 && (
                      <p className="text-sm text-slate-500 italic">
                        Nenhum palpite ainda
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
