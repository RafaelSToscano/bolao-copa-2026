"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Target } from "lucide-react";
import { DashboardMyStatusPayload } from "@/types/dashboard";
import { StickySectionHeader } from "./StickySectionHeader";

interface MyStatusCardProps {
  myStatus: DashboardMyStatusPayload | null;
  onSeeAll?: () => void;
}

export function MyStatusCard({ myStatus, onSeeAll }: MyStatusCardProps) {
  return (
    <div className="space-y-3">
      <StickySectionHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black flex items-center gap-2">
            <Target className="text-yellow-400" size={20} />
            Meu desempenho
          </h2>
          {onSeeAll && (
            <button
              type="button"
              onClick={onSeeAll}
              className="text-base font-bold text-yellow-400 hover:text-yellow-300"
            >
              Ver palpites →
            </button>
          )}
        </div>
      </StickySectionHeader>

      <Card className="bg-gradient-to-br from-yellow-500/10 via-slate-900 to-slate-950 border-yellow-500/20 text-white rounded-3xl">
        <CardContent className="p-5">
          {myStatus === null ? (
            <div className="text-center text-slate-400 text-base">
              Carregando...
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-base uppercase tracking-wide text-slate-400 font-bold">
                  Posição
                </div>
                <div className="text-3xl font-black text-yellow-400">
                  {myStatus.position !== null ? `${myStatus.position}º` : "—"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-base uppercase tracking-wide text-slate-400 font-bold">
                  Pontos
                </div>
                <div className="text-3xl font-black">{myStatus.total}</div>
              </div>
              <div className="text-center">
                <div className="text-base uppercase tracking-wide text-slate-400 font-bold">
                  Exatos
                </div>
                <div className="text-3xl font-black text-emerald-400">
                  {myStatus.exacts}
                </div>
              </div>
              <div className="text-center">
                <div className="text-base uppercase tracking-wide text-slate-400 font-bold">
                  Completo
                </div>
                <div className="text-3xl font-black">{myStatus.completion}%</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
