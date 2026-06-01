"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Game } from "@/types/game";
import {
  finalPredictionsService,
  FinalPrediction,
} from "@/services/supabase/finalPredictionsService";

interface Props {
  playerId: string;
  games: Game[];
  disabled?: boolean;
}

export function FinalPredictionsCard({
  playerId,
  games,
  disabled = false,
}: Props) {
  const [champion, setChampion] = useState("");
  const [runnerUp, setRunnerUp] = useState("");
  const [thirdPlace, setThirdPlace] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const hasLoadedRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const teams = useMemo(() => {
    const allTeams = games.flatMap((game) => [game.team_a, game.team_b]);
    return Array.from(new Set(allTeams)).sort();
  }, [games]);

  useEffect(() => {
    async function load() {
      if (!playerId) return;

      try {
        const data = await finalPredictionsService.getByPlayer(playerId);

        if (data) {
          setChampion(data.champion || "");
          setRunnerUp(data.runner_up || "");
          setThirdPlace(data.third_place || "");
        }
      } catch {
        setMessage("Erro ao carregar palpites finais.");
      } finally {
        hasLoadedRef.current = true;
      }
    }

    load();
  }, [playerId]);

  useEffect(() => {
    if (!hasLoadedRef.current) return;
    if (disabled) return;
    if (!playerId) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    if (!champion && !runnerUp && !thirdPlace) {
      setMessage("");
      return;
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
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [champion, runnerUp, thirdPlace, playerId, disabled]);

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
          {[
            ["🥇 Campeão", champion, setChampion],
            ["🥈 Vice-campeão", runnerUp, setRunnerUp],
            ["🥉 Terceiro colocado", thirdPlace, setThirdPlace],
          ].map(([label, value, setter]) => (
            <div key={label as string} className="space-y-2">
              <label className="text-base lg:text-lg font-black text-slate-300">
                {label as string}
              </label>

              <select
                value={value as string}
                onChange={(e) =>
                  (setter as React.Dispatch<React.SetStateAction<string>>)(
                    e.target.value
                  )
                }
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
          ))}
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