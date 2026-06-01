"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

export function FinalPredictionsCard({ playerId, games, disabled = false }: Props) {
  const [champion, setChampion] = useState("");
  const [runnerUp, setRunnerUp] = useState("");
  const [thirdPlace, setThirdPlace] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const teams = useMemo(() => {
    const allTeams = games.flatMap((game) => [game.team_a, game.team_b]);
    return Array.from(new Set(allTeams)).sort();
  }, [games]);

  useEffect(() => {
    async function load() {
      const data = await finalPredictionsService.getByPlayer(playerId);

      if (data) {
        setChampion(data.champion || "");
        setRunnerUp(data.runner_up || "");
        setThirdPlace(data.third_place || "");
      }
    }

    load();
  }, [playerId]);

  const handleSave = async () => {
    setMessage("");

    if (!champion || !runnerUp || !thirdPlace) {
      setMessage("Preencha campeão, vice e terceiro colocado.");
      return;
    }

    const picks = [champion, runnerUp, thirdPlace];

    if (new Set(picks).size !== picks.length) {
      setMessage("Escolha três seleções diferentes.");
      return;
    }

    setIsSaving(true);

    try {
      const payload: FinalPrediction = {
        player_id: playerId,
        champion,
        runner_up: runnerUp,
        third_place: thirdPlace,
      };

      await finalPredictionsService.upsert(payload);
      setMessage("Palpites finais salvos com sucesso!");
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Erro ao salvar palpites finais."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 text-white rounded-3xl shadow-2xl">
      <CardContent className="p-5 lg:p-6 space-y-4">
        <div>
          <h3 className="text-3xl lg:text-4xl font-black tracking-tight">Palpites Finais</h3>
          <p className="text-slate-400 text-base lg:text-lg mt-2">
            Informe campeão, vice-campeão e terceiro colocado.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            ["Campeão", champion, setChampion],
            ["Vice-campeão", runnerUp, setRunnerUp],
            ["Terceiro colocado", thirdPlace, setThirdPlace],
          ].map(([label, value, setter]) => (
            <div key={label as string} className="space-y-2">
              <label className="text-sm font-bold text-slate-300">
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
                className="w-full h-12 rounded-xl bg-slate-800 border border-slate-700 text-white px-3"
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

        <Button
          type="button"
          onClick={handleSave}
          disabled={disabled || isSaving}
          className="w-full md:w-auto bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black"
        >
          {isSaving ? "Salvando..." : "Salvar palpites finais"}
        </Button>

        {message && (
          <div className="text-sm text-slate-300">{message}</div>
        )}

        {disabled && (
          <div className="text-sm text-red-400 font-semibold">
            Palpites finais bloqueados.
          </div>
        )}
      </CardContent>
    </Card>
  );
}