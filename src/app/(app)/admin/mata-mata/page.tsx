"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppShell } from "@/components/layouts/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Flag } from "@/components/ui/Flag";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { KnockoutMatchRecord, KnockoutRound } from "@/types/knockout";
import { slotLabel } from "@/lib/knockoutSlotLabel";
import { useKnockoutAdmin } from "@/hooks/useKnockoutAdmin";

const ROUND_LABELS: Record<KnockoutRound, string> = {
  r32: "Rodada de 32",
  r16: "Oitavas de Final",
  qf: "Quartas de Final",
  sf: "Semifinais",
  third_place: "Disputa de 3º Lugar",
  final: "Final",
};

const ROUND_ORDER: KnockoutRound[] = ["r32", "r16", "qf", "sf", "third_place", "final"];

type Draft = {
  scoreHome: string;
  scoreAway: string;
  winner: "home" | "away" | "";
};

function draftFromMatch(match: KnockoutMatchRecord): Draft {
  const winner =
    match.winner_team && match.winner_team === match.home_team
      ? "home"
      : match.winner_team && match.winner_team === match.away_team
      ? "away"
      : "";

  return {
    scoreHome: match.official_score_home?.toString() ?? "",
    scoreAway: match.official_score_away?.toString() ?? "",
    winner,
  };
}

function matchSignature(match: KnockoutMatchRecord): string {
  return [
    match.home_team,
    match.away_team,
    match.official_score_home,
    match.official_score_away,
    match.winner_team,
  ].join("|");
}

function AdminMatchCard({
  match,
  isSaving,
  onSave,
}: {
  match: KnockoutMatchRecord;
  isSaving: boolean;
  onSave: (scoreHome: number | null, scoreAway: number | null, winnerTeam: string | null) => void;
}) {
  const [draft, setDraft] = useState<Draft>(() => draftFromMatch(match));
  const [syncedSignature, setSyncedSignature] = useState(() => matchSignature(match));

  // Re-sync the draft whenever the persisted match changes (e.g. after a
  // cascade from a different match fills in this one's teams). Adjusting
  // state during render — rather than in an effect — avoids an extra
  // render pass; see https://react.dev/learn/you-might-not-need-an-effect.
  const currentSignature = matchSignature(match);
  if (currentSignature !== syncedSignature) {
    setSyncedSignature(currentSignature);
    setDraft(draftFromMatch(match));
  }

  const teamsKnown = Boolean(match.home_team && match.away_team);

  const impliedWinner: "home" | "away" | null =
    draft.scoreHome !== "" && draft.scoreAway !== "" && draft.scoreHome !== draft.scoreAway
      ? Number(draft.scoreHome) > Number(draft.scoreAway)
        ? "home"
        : "away"
      : null;

  const effectiveWinner = impliedWinner ?? (draft.winner || null);

  const handleSave = () => {
    const scoreHome = draft.scoreHome === "" ? null : Number(draft.scoreHome);
    const scoreAway = draft.scoreAway === "" ? null : Number(draft.scoreAway);
    const winner = effectiveWinner;
    const winnerTeam =
      winner === "home" ? match.home_team : winner === "away" ? match.away_team : null;

    onSave(scoreHome, scoreAway, winnerTeam);
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="px-4 py-1.5 bg-slate-800/50 flex items-center justify-between">
        <span className="text-xs text-slate-500 font-semibold uppercase tracking-wide">
          Jogo {match.id}
        </span>
        {match.locked && (
          <span className="text-xs text-yellow-500 font-semibold">Bloqueado</span>
        )}
      </div>

      <div className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-500 leading-none mb-1">
              {slotLabel(match.home_slot)}
            </div>
            <div className="flex items-center gap-1.5">
              {match.home_team && <Flag team={match.home_team} size="small" />}
              <span
                className={`font-bold text-sm truncate ${effectiveWinner === "home" ? "text-yellow-400" : ""}`}
              >
                {match.home_team ?? "---"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Input
              type="number"
              min="0"
              disabled={!teamsKnown}
              value={draft.scoreHome}
              onChange={(e) => setDraft({ ...draft, scoreHome: e.target.value })}
              className="h-10 w-11 rounded-xl bg-slate-900 border-slate-700 text-center text-base font-black text-white p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-slate-500 font-black text-sm">x</span>
            <Input
              type="number"
              min="0"
              disabled={!teamsKnown}
              value={draft.scoreAway}
              onChange={(e) => setDraft({ ...draft, scoreAway: e.target.value })}
              className="h-10 w-11 rounded-xl bg-slate-900 border-slate-700 text-center text-base font-black text-white p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          <div className="flex-1 min-w-0 text-right">
            <div className="text-xs text-slate-500 leading-none mb-1">
              {slotLabel(match.away_slot)}
            </div>
            <div className="flex items-center justify-end gap-1.5">
              <span
                className={`font-bold text-sm truncate ${effectiveWinner === "away" ? "text-yellow-400" : ""}`}
              >
                {match.away_team ?? "---"}
              </span>
              {match.away_team && <Flag team={match.away_team} size="small" />}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-3 border-t border-slate-800/60 pt-2.5 space-y-2.5">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              setDraft({ ...draft, winner: draft.winner === "home" ? "" : "home" })
            }
            disabled={!teamsKnown || impliedWinner === "away"}
            className={`flex-1 rounded-xl py-2 text-xs font-bold transition-colors truncate px-2
              ${
                effectiveWinner === "home"
                  ? "bg-yellow-500 text-slate-950"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }
              disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            {match.home_team ?? "---"}
          </button>
          <button
            type="button"
            onClick={() =>
              setDraft({ ...draft, winner: draft.winner === "away" ? "" : "away" })
            }
            disabled={!teamsKnown || impliedWinner === "home"}
            className={`flex-1 rounded-xl py-2 text-xs font-bold transition-colors truncate px-2
              ${
                effectiveWinner === "away"
                  ? "bg-yellow-500 text-slate-950"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }
              disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            {match.away_team ?? "---"}
          </button>
        </div>

        <Button
          type="button"
          size="sm"
          className="w-full"
          disabled={!teamsKnown || isSaving}
          onClick={handleSave}
        >
          Salvar resultado
        </Button>
      </div>
    </div>
  );
}

export default function AdminMataMataPage() {
  const router = useRouter();
  const { currentUser, games } = useAppShell();
  const { matches, isLoading, isSaving, recordResult, populateRound32, clearAllResults } =
    useKnockoutAdmin();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    if (!currentUser.is_admin) router.replace("/");
  }, [currentUser.is_admin, router]);

  if (!currentUser.is_admin) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black">Resultados do Mata-mata</h2>
          <p className="text-slate-400 text-sm">
            Preencha os times e resultados oficiais de cada fase eliminatória.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
            disabled={isSaving}
            onClick={() => populateRound32(games)}
          >
            Popular Rodada de 32 a partir dos grupos
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-red-800 bg-slate-900 text-red-400 hover:bg-red-950"
            disabled={isSaving}
            onClick={() => setShowClearConfirm(true)}
          >
            Limpar dados oficiais
          </Button>
        </div>
      </div>

      {showClearConfirm && (
        <ConfirmModal
          title="Limpar dados oficiais"
          message="Isso remove times, placares e vencedores de todos os 32 jogos do mata-mata, voltando ao estado inicial. Use apenas para testes. Esta ação não pode ser desfeita."
          confirmLabel="Limpar tudo"
          cancelLabel="Cancelar"
          variant="danger"
          onConfirm={() => {
            setShowClearConfirm(false);
            clearAllResults();
          }}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}

      {isLoading ? (
        <p className="text-slate-500 text-sm">Carregando jogos...</p>
      ) : (
        ROUND_ORDER.map((round) => {
          const roundMatches = matches
            .filter((m) => m.round === round)
            .sort((a, b) => a.match_number - b.match_number);

          if (roundMatches.length === 0) return null;

          return (
            <Card key={round} className="bg-slate-900 border-slate-800 text-white rounded-3xl">
              <CardContent className="p-5 space-y-3">
                <h3 className="text-base font-black text-yellow-400 uppercase tracking-wide">
                  {ROUND_LABELS[round]}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {roundMatches.map((match) => (
                    <AdminMatchCard
                      key={match.id}
                      match={match}
                      isSaving={isSaving}
                      onSave={(scoreHome, scoreAway, winnerTeam) =>
                        recordResult(match.id, scoreHome, scoreAway, winnerTeam)
                      }
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
