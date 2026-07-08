"use client";

import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Game } from "@/types/game";
import {
  finalPredictionsService,
  FinalPrediction,
} from "@/services/supabase/finalPredictionsService";
import { AppShellContext } from "@/components/layouts/AppShell";
import { evictDashboardCache } from "@/lib/evictDashboardCache";

interface Props {
  playerId: string;
  games: Game[];
  disabled?: boolean;
}

type Draft = {
  champion: string;
  runnerUp: string;
  thirdPlace: string;
};

const EMPTY_DRAFT: Draft = { champion: "", runnerUp: "", thirdPlace: "" };

function draftFrom(row: FinalPrediction | null | undefined): Draft {
  if (!row) return EMPTY_DRAFT;
  return {
    champion: row.champion ?? "",
    runnerUp: row.runner_up ?? "",
    thirdPlace: row.third_place ?? "",
  };
}

export function FinalPredictionsCard({
  playerId,
  games,
  disabled = false,
}: Props) {
  // Read via context so this card can render outside AppShell (tests).
  // In production the shell is always mounted.
  const shell = useContext(AppShellContext);
  const finalPredictions: FinalPrediction[] = useMemo(
    () => shell?.finalPredictions ?? [],
    [shell?.finalPredictions]
  );

  // Seed inputs from the cached bootstrap snapshot. `userDraft` holds
  // the user's typed value once they interact; before that we render
  // straight from cache with no effect-driven state sync (which would
  // trip the react-hooks/set-state-in-effect rule).
  const cachedDraft: Draft = useMemo(() => {
    const mine =
      finalPredictions.find((p: FinalPrediction) => p.player_id === playerId) ??
      null;
    return draftFrom(mine);
  }, [finalPredictions, playerId]);

  const [userDraft, setUserDraft] = useState<Draft | null>(null);
  const draft = userDraft ?? cachedDraft;
  const { champion, runnerUp, thirdPlace } = draft;

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const userChangedRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const teams = useMemo(() => {
    const allTeams = games.flatMap((game) => [game.team_a, game.team_b]);
    return Array.from(new Set(allTeams)).sort();
  }, [games]);

  useEffect(() => {
    if (!userChangedRef.current) return;
    if (disabled) return;
    if (!playerId) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    if (!champion || !runnerUp || !thirdPlace) {
      setMessage("Preencha campeão, vice e terceiro colocado.");
      return;
    }

    const picks = [champion, runnerUp, thirdPlace];

    if (new Set(picks).size !== picks.length) {
      setMessage("Escolha três seleções diferentes.");
      return;
    }

    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      setMessage("Salvando automaticamente...");

      try {
        const payload: FinalPrediction = {
          player_id: playerId,
          champion,
          runner_up: runnerUp,
          third_place: thirdPlace,
        };

        await finalPredictionsService.upsert(payload);
        // The cached bootstrap payload just went stale — evict so the
        // next request rehydrates from Supabase once, and every other
        // viewer reads the fresh row from cache. Uses the user-scoped
        // eviction path since regular players (non-admin) trigger this.
        evictDashboardCache(playerId, { scope: "user-predictions" });
        setMessage("Palpites finais salvos automaticamente.");
      } catch (err) {
        setMessage(
          err instanceof Error
            ? err.message
            : "Erro ao salvar palpites finais."
        );
      } finally {
        setIsSaving(false);
      }
    }, 600);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [champion, runnerUp, thirdPlace, playerId, disabled]);

  const handleChampionChange = (value: string) => {
    userChangedRef.current = true;
    setUserDraft({ ...draft, champion: value });
  };

  const handleRunnerUpChange = (value: string) => {
    userChangedRef.current = true;
    setUserDraft({ ...draft, runnerUp: value });
  };

  const handleThirdPlaceChange = (value: string) => {
    userChangedRef.current = true;
    setUserDraft({ ...draft, thirdPlace: value });
  };

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 text-white rounded-3xl shadow-2xl">
      <CardContent className="p-6 lg:p-8 space-y-6">
        <div>
          <h3 className="text-3xl lg:text-4xl font-black tracking-tight">
            Palpites Finais
          </h3>

          <p className="text-slate-400 text-base lg:text-lg mt-2">
            Informe campeão, vice-campeão e terceiro colocado. O salvamento é
            automático após preencher os três campos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-base lg:text-lg font-black text-slate-300">
              🥇 Campeão
            </label>

            <select
              value={champion}
              onChange={(e) => handleChampionChange(e.target.value)}
              disabled={disabled || isSaving}
              className="w-full h-14 lg:h-16 rounded-2xl bg-slate-800 border border-slate-700 text-white text-lg font-semibold px-4"
            >
              <option value="">Selecione</option>
              {teams.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-base lg:text-lg font-black text-slate-300">
              🥈 Vice-campeão
            </label>

            <select
              value={runnerUp}
              onChange={(e) => handleRunnerUpChange(e.target.value)}
              disabled={disabled || isSaving}
              className="w-full h-14 lg:h-16 rounded-2xl bg-slate-800 border border-slate-700 text-white text-lg font-semibold px-4"
            >
              <option value="">Selecione</option>
              {teams.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-base lg:text-lg font-black text-slate-300">
              🥉 Terceiro colocado
            </label>

            <select
              value={thirdPlace}
              onChange={(e) => handleThirdPlaceChange(e.target.value)}
              disabled={disabled || isSaving}
              className="w-full h-14 lg:h-16 rounded-2xl bg-slate-800 border border-slate-700 text-white text-lg font-semibold px-4"
            >
              <option value="">Selecione</option>
              {teams.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
          </div>
        </div>

        {message && <div className="text-sm text-slate-300">{message}</div>}

        {disabled && (
          <div className="text-sm text-red-400 font-semibold">
            Palpites finais bloqueados.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
