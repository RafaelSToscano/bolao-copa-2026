"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Flag } from "@/components/ui/Flag";
import { Crown } from "lucide-react";
import { DashboardGroupLeader } from "@/types/dashboard";
import { StickySectionHeader } from "./StickySectionHeader";

interface GroupLeadersCardProps {
  groups: DashboardGroupLeader[];
  onSeeAll?: () => void;
}

export function GroupLeadersCard({ groups, onSeeAll }: GroupLeadersCardProps) {
  return (
    <div className="space-y-3">
      <StickySectionHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black flex items-center gap-2">
            <Crown className="text-yellow-400" size={20} />
            Líderes dos grupos
          </h2>
          {onSeeAll && (
            <button
              type="button"
              onClick={onSeeAll}
              className="text-base font-bold text-yellow-400 hover:text-yellow-300"
            >
              Ver classificação →
            </button>
          )}
        </div>
      </StickySectionHeader>

      <Card className="bg-slate-900 border-slate-800 text-white rounded-3xl">
        <CardContent className="p-0 overflow-hidden">
          {groups.length === 0 ? (
            <div className="p-5 text-center text-base text-slate-400">
              Aguardando primeiros jogos.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {groups.map(({ group, leader }) => (
                <div
                  key={group}
                  className="flex items-center gap-3 p-3 border-b border-slate-800 last:border-b-0"
                >
                  <span className="text-base font-black text-yellow-400 bg-yellow-500/10 border border-yellow-500/25 rounded-full w-8 h-8 flex items-center justify-center shrink-0">
                    {group}
                  </span>
                  {leader ? (
                    <>
                      <Flag team={leader.team} size="small" />
                      <span className="font-bold text-base truncate flex-1">
                        {leader.team}
                      </span>
                      <span className="text-base text-slate-400 shrink-0">
                        {leader.points}p · {leader.goalDiff > 0 ? "+" : ""}
                        {leader.goalDiff}
                      </span>
                    </>
                  ) : (
                    <span className="text-base text-slate-500 italic">
                      Aguardando primeiro jogo
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
