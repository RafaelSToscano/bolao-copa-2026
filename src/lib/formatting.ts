import { TEAM_FLAG_CODES } from "@/config/scoring";
import { getSupabaseClient } from "@/services/supabase/supabaseClient";
import { calculateKnockoutPredictionPoints } from "@/services/scoring/knockoutPredictionScoring";
import { slotLabel } from "@/lib/knockoutSlotLabel";

/**
 * Gets the flag country code for a team name
 */
export function getFlagCode(team: string): string {
  return TEAM_FLAG_CODES[team] || "";
}

/**
 * True when `value` falls on the same calendar day as `now` in the
 * viewer's local timezone. The dashboard uses this to discreetly flag
 * matches happening today in the upcoming/recent lists.
 */
export function isToday(value: string | null, now: Date = new Date()): boolean {
  if (!value) return false;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

/**
 * True when `value` is strictly before `now`. Used by /palpites to tint
 * already-kicked-off match rows (the user can no longer change the
 * palpite for them, regardless of the lock state).
 */
export function isPast(value: string | null, now: Date = new Date()): boolean {
  if (!value) return false;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  return d.getTime() < now.getTime();
}

/**
 * Formats a date string for display
 */
export function formatDate(value: string | null): string {
  if (!value) return "Data a definir";

  try {
    return new Date(value).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Data a definir";
  }
}

/**
 * Long form: short weekday + day/month · HH:mm in pt-BR (e.g. "Sex
 * 20/06 · 17:00"). Used in recent-results headers where a quick "what
 * day was this?" cue is more useful than the bare DD/MM.
 */
export function formatWeekdayDate(value: string | null): string {
  if (!value) return "Data a definir";

  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "Data a definir";
    const weekday = d
      .toLocaleString("pt-BR", { weekday: "short" })
      .replace(/\.$/, "");
    const day = d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
    const time = d.toLocaleString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const capitalizedWeekday =
      weekday.charAt(0).toUpperCase() + weekday.slice(1);
    return `${capitalizedWeekday} ${day} · ${time}`;
  } catch {
    return "Data a definir";
  }
}

/**
 * Date-only short form: short weekday + day/month in pt-BR (e.g. "Sex
 * 20/06"). Used in the upcoming-matches list where the kickoff time
 * is already shown as the row's headline, so repeating it in the
 * meta row would be noise.
 */
export function formatWeekdayShort(value: string | null): string {
  if (!value) return "Data a definir";

  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "Data a definir";
    const weekday = d
      .toLocaleString("pt-BR", { weekday: "short" })
      .replace(/\.$/, "");
    const day = d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
    const capitalizedWeekday =
      weekday.charAt(0).toUpperCase() + weekday.slice(1);
    return `${capitalizedWeekday} ${day}`;
  } catch {
    return "Data a definir";
  }
}

/**
 * Time-only kickoff in pt-BR (e.g. "17:00"). Used by the upcoming-
 * matches list as the row headline when there's no score yet — the
 * meta row above it already shows the weekday+date.
 */
export function formatKickoffTime(value: string | null): string {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

/**
 * Exports audit CSV with all predictions and results
 */
export async function exportAuditCsv(
  players: any[],
  games: any[],
  predictions: any[],
  calculatePoints: (pred: any, game: any) => any
): Promise<void> {
  const supabase = getSupabaseClient();

  const { data: finalPredictions, error } = await supabase
    .from("final_predictions")
    .select("player_id, champion, runner_up, third_place");

  if (error) {
    throw new Error(`Erro ao buscar palpites finais: ${error.message}`);
  }

  const { data: knockoutMatches, error: knockoutMatchesError } = await supabase
    .from("knockout_matches")
    .select(
      "id, round, match_number, home_slot, away_slot, home_team, away_team, official_score_home, official_score_away, winner_team, match_date, locked"
    )
    .eq("round", "r32")
    .order("match_number", { ascending: true });

  if (knockoutMatchesError) {
    throw new Error(
      `Erro ao buscar jogos do mata-mata: ${knockoutMatchesError.message}`
    );
  }

  const { data: knockoutPredictions, error: knockoutPredictionsError } =
    await supabase
      .from("knockout_predictions")
      .select(
        "player_id, match_id, predicted_score_home, predicted_score_away, predicted_winner"
      );

  if (knockoutPredictionsError) {
    throw new Error(
      `Erro ao buscar palpites do mata-mata: ${knockoutPredictionsError.message}`
    );
  }

  const finalPredictionsByPlayer = new Map(
    (finalPredictions ?? []).map((fp: any) => [fp.player_id, fp])
  );
  const rows: (string | number)[][] = [
    [
      "Participante",
      "Celular",
      "Grupo",
      "Jogo",
      "Time A",
      "Palpite A",
      "Palpite B",
      "Time B",
      "Resultado Oficial A",
      "Resultado Oficial B",
      "Pontos",
      "Placar Exato",
      "Campeão",
      "Vice",
      "Terceiro",
    ],
  ];

    players.forEach((player) => {
    const finalPrediction = finalPredictionsByPlayer.get(player.id);

    games.forEach((game) => {
      const prediction = predictions.find(
        (p: any) => p.player_id === player.id && p.game_id === game.id
      );

      const result = calculatePoints(prediction, game);

      rows.push([
        player.name,
        player.access_code,
        game.group_name || "",
        String(game.match_order || ""),
        game.team_a,
        prediction?.predicted_score_a?.toString() ?? "",
        prediction?.predicted_score_b?.toString() ?? "",
        game.team_b,
        game.official_score_a?.toString() ?? "",
        game.official_score_b?.toString() ?? "",
        result.points.toString(),
        result.exact.toString(),
        finalPrediction?.champion ?? "",
        finalPrediction?.runner_up ?? "",
        finalPrediction?.third_place ?? "",
      ]);
    });

    (knockoutMatches ?? []).forEach((match: any) => {
      const prediction = (knockoutPredictions ?? []).find(
        (p: any) => p.player_id === player.id && p.match_id === match.id
      );

      const result = calculateKnockoutPredictionPoints(prediction, match);

      rows.push([
        player.name,
        player.access_code,
        "Mata-mata",
        `16 avos - Jogo ${match.match_number}`,
        match.home_team ?? slotLabel(match.home_slot),
        prediction?.predicted_score_home?.toString() ?? "",
        prediction?.predicted_score_away?.toString() ?? "",
        match.away_team ?? slotLabel(match.away_slot),
        match.official_score_home?.toString() ?? "",
        match.official_score_away?.toString() ?? "",
        result.points.toString(),
        result.exact.toString(),
        finalPrediction?.champion ?? "",
        finalPrediction?.runner_up ?? "",
        finalPrediction?.third_place ?? "",
      ]);
    });
  });

  const csvContent = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(";")
    )
    .join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "auditoria-bolao-copa-2026.csv";
  link.click();

  URL.revokeObjectURL(url);
}
