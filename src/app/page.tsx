"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Trophy,
  Shield,
  BarChart3,
  Lock,
  LogOut,
  RefreshCw,
  Medal,
  Crown,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const COLORS = {
  green: "#3CAC3B",
  blue: "#2A398D",
  red: "#E61D25",
  lightGray: "#D1D4D1",
  darkGray: "#474A4A",
};
function getFlagCode(team: string) {
  const flags: Record<string, string> = {
    "México": "mx",
    "África do Sul": "za",
    "Coreia do Sul": "kr",
    "Rep. Checa": "cz",
    "Canadá": "ca",
    "Catar": "qa",
    "Suíça": "ch",
    "Bósnia": "ba",
    "Brasil": "br",
    "Marrocos": "ma",
    "Haiti": "ht",
    "Escócia": "gb-sct",
    "EUA": "us",
    "Paraguai": "py",
    "Austrália": "au",
    "Turquia": "tr",
    "Alemanha": "de",
    "Curaçau": "cw",
    "Costa do Marfim": "ci",
    "Equador": "ec",
    "Holanda": "nl",
    "Japão": "jp",
    "Suécia": "se",
    "Tunísia": "tn",
    "Portugal": "pt",
    "Egito": "eg",
    "Irã": "ir",
    "Cabo Verde": "cv",
    "Bélgica": "be",
    "Argélia": "dz",
    "Arábia Saudita": "sa",
    "Iraque": "iq",
    "Argentina": "ar",
    "Jordânia": "jo",
    "Croácia": "hr",
    "Nigéria": "ng",
    "França": "fr",
    "Chile": "cl",
    "Senegal": "sn",
    "Costa Rica": "cr",
    "Inglaterra": "gb-eng",
    "Camarões": "cm",
    "Uruguai": "uy",
    "Emirados Árabes": "ae",
    "Espanha": "es",
    "Gana": "gh",
    "Colômbia": "co",
    "Nova Zelândia": "nz",
  };

  return flags[team] || "";
}
function Flag({ team }: { team: string }) {
  const code = getFlagCode(team);

  if (!code) return null;

  return (
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      alt={team}
      className="inline-block h-4 w-6 rounded-sm object-cover mr-2"
    />
  );
}
type Player = {
  id: string;
  name: string;
  access_code: string;
  is_admin: boolean;
  approved: boolean;
};

type Game = {
  id: string;
  phase: string;
  group_name: string | null;
  match_order: number | null;
  match_date: string | null;
  team_a: string;
  team_b: string;
  official_score_a: number | null;
  official_score_b: number | null;
  locked: boolean;
};

type Prediction = {
  id?: string;
  player_id: string;
  game_id: string;
  predicted_score_a: number | null;
  predicted_score_b: number | null;
};

type DraftPrediction = {
  predicted_score_a: string;
  predicted_score_b: string;
};

function outcome(a: number, b: number) {
  if (a > b) return "A";
  if (a < b) return "B";
  return "E";
}

function calculatePoints(pred?: Prediction, game?: Game) {
  if (!pred || !game) return { points: 0, exact: 0 };

  if (
    pred.predicted_score_a === null ||
    pred.predicted_score_b === null ||
    game.official_score_a === null ||
    game.official_score_b === null
  ) {
    return { points: 0, exact: 0 };
  }

  const pa = Number(pred.predicted_score_a);
  const pb = Number(pred.predicted_score_b);
  const ra = Number(game.official_score_a);
  const rb = Number(game.official_score_b);

  if (pa === ra && pb === rb) {
    return { points: 15, exact: 1 };
  }

  let points = 0;

  if (outcome(pa, pb) === outcome(ra, rb)) points += 7;
  if (pa === ra) points += 2;
  if (pb === rb) points += 2;

  return { points, exact: 0 };
}

function formatDate(value: string | null) {
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
function isGroupsLocked() {
  const deadline = new Date("2026-06-10T23:59:00-03:00");
  return new Date() > deadline;
}
function calculateGroupStandings(groupGames: Game[]) {
  const table: Record<string, any> = {};

  function ensureTeam(team: string) {
    if (!table[team]) {
      table[team] = {
        team,
        points: 0,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDiff: 0,
      };
    }
  }

  for (const game of groupGames) {
    if (
      game.official_score_a === null ||
      game.official_score_b === null
    ) {
      continue;
    }

    ensureTeam(game.team_a);
    ensureTeam(game.team_b);

    const a = table[game.team_a];
    const b = table[game.team_b];

    const goalsA = game.official_score_a;
    const goalsB = game.official_score_b;

    a.played += 1;
    b.played += 1;

    a.goalsFor += goalsA;
    a.goalsAgainst += goalsB;

    b.goalsFor += goalsB;
    b.goalsAgainst += goalsA;

    if (goalsA > goalsB) {
      a.points += 3;
      a.wins += 1;
      b.losses += 1;
    } else if (goalsA < goalsB) {
      b.points += 3;
      b.wins += 1;
      a.losses += 1;
    } else {
      a.points += 1;
      b.points += 1;
      a.draws += 1;
      b.draws += 1;
    }
  }

  return Object.values(table)
    .map((team: any) => ({
      ...team,
      goalDiff: team.goalsFor - team.goalsAgainst,
    }))
    .sort((a: any, b: any) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.team.localeCompare(b.team);
    });
}
function calculateGroupStandingsFromPredictions(
  groupGames: Game[],
  playerPredictions: Prediction[],
  playerId: string
) {
  const simulatedGames = groupGames.map((game) => {
    const prediction = playerPredictions.find(
      (p) => p.player_id === playerId && p.game_id === game.id
    );

    return {
      ...game,
      official_score_a: prediction?.predicted_score_a ?? null,
      official_score_b: prediction?.predicted_score_b ?? null,
    };
  });

  return calculateGroupStandings(simulatedGames);
}
function buildGamesFromPredictions(
  games: Game[],
  playerPredictions: Prediction[],
  playerId: string
) {
  return games.map((game) => {
    const prediction = playerPredictions.find(
      (p) => p.player_id === playerId && p.game_id === game.id
    );

    return {
      ...game,
      official_score_a: prediction?.predicted_score_a ?? null,
      official_score_b: prediction?.predicted_score_b ?? null,
    };
  });
}
function calculateBestThirds(games: Game[]) {
  const grouped = games.reduce((acc: Record<string, Game[]>, game) => {
    const group = game.group_name || "Outros";

    if (!acc[group]) acc[group] = [];

    acc[group].push(game);

    return acc;
  }, {});

  const thirds = Object.entries(grouped)
    .map(([group, groupGames]) => {
      const standings = calculateGroupStandings(groupGames);
      const third = standings[2];

      if (!third) return null;

      return {
        ...third,
        group,
      };
    })
    .filter(Boolean) as any[];

  return thirds.sort((a: any, b: any) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.team.localeCompare(b.team);
  });
}

function calculateQualifiedTeams(games: Game[]) {
  const grouped = games.reduce((acc: Record<string, Game[]>, game) => {
    const group = game.group_name || "Outros";

    if (!acc[group]) acc[group] = [];

    acc[group].push(game);

    return acc;
  }, {});

  const qualified: any[] = [];

  Object.entries(grouped).forEach(([group, groupGames]) => {
    const standings = calculateGroupStandings(groupGames);

    if (standings[0]) {
      qualified.push({
        position: "1",
        group,
        ...standings[0],
      });
    }

    if (standings[1]) {
      qualified.push({
        position: "2",
        group,
        ...standings[1],
      });
    }
  });

  return qualified.sort((a, b) => a.group.localeCompare(b.group));
}

function generateRound32(games: Game[]) {
  const qualified = calculateQualifiedTeams(games);

  function findTeam(position: string, group: string) {
    return qualified.find(
      (t) => t.position === position && t.group === group
    );
  }

  return [
    {
      home: findTeam("1", "A"),
      away: findTeam("2", "B"),
    },
    {
      home: findTeam("1", "B"),
      away: findTeam("2", "A"),
    },
    {
      home: findTeam("1", "C"),
      away: findTeam("2", "D"),
    },
    {
      home: findTeam("1", "D"),
      away: findTeam("2", "C"),
    },
    {
      home: findTeam("1", "E"),
      away: findTeam("2", "F"),
    },
    {
      home: findTeam("1", "F"),
      away: findTeam("2", "E"),
    },
    {
      home: findTeam("1", "G"),
      away: findTeam("2", "H"),
    },
    {
      home: findTeam("1", "H"),
      away: findTeam("2", "G"),
    },
  ];
}
export default function Home() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DraftPrediction>>({});

  const [currentUser, setCurrentUser] = useState<Player | null>(null);
  const [loginName, setLoginName] = useState("");
  const [loginCode, setLoginCode] = useState("");

  const [tab, setTab] =
  useState<"palpites" | "classificacao" | "matamata" | "ranking" | "admin">("palpites");
  const [loading, setLoading] = useState(false);
  const [checkingLogin, setCheckingLogin] = useState(true);
  const [message, setMessage] = useState("");
const groupsLocked = isGroupsLocked();
  async function loadData() {
    setLoading(true);
    setMessage("");

    const [playersRes, gamesRes, predictionsRes] = await Promise.all([
      supabase.from("players").select("*").order("created_at", { ascending: true }),
      supabase
        .from("games")
        .select("*")
        .order("group_name", { ascending: true })
        .order("match_order", { ascending: true }),
      supabase.from("predictions").select("*"),
    ]);

    if (playersRes.error || gamesRes.error || predictionsRes.error) {
      setMessage("Erro ao carregar dados. Verifique o Supabase.");
      setLoading(false);
      return;
    }

    setPlayers(playersRes.data || []);
    setGames(gamesRes.data || []);
    setPredictions(predictionsRes.data || []);
    setLoading(false);
  }
    useEffect(() => {
    const savedUser = localStorage.getItem("bolao_user");

    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }

    loadData().finally(() => {
      setCheckingLogin(false);
    });
  }, []);

  function login() {
    const found = players.find(
      (p) =>
        p.name.toLowerCase().trim() === loginName.toLowerCase().trim() &&
        p.access_code === loginCode
    );

    if (found && found.approved) {
      setCurrentUser(found);
      localStorage.setItem("bolao_user", JSON.stringify(found));
      setMessage("");
    } else {
      setMessage("Usuário não encontrado ou aguardando aprovação do administrador.");
    }
  }

  const ranking = useMemo(() => {
    return players
      .map((player) => {
        let total = 0;
        let exacts = 0;

        for (const game of games) {
          const pred = predictions.find(
            (p) => p.player_id === player.id && p.game_id === game.id
          );

          const result = calculatePoints(pred, game);

          total += result.points;
          exacts += result.exact;
        }

        return {
          ...player,
          total,
          exacts,
        };
      })
      .sort((a, b) => {
        if (b.total !== a.total) return b.total - a.total;
        return b.exacts - a.exacts;
      });
  }, [players, predictions, games]);

  const totalPlayers = players.filter(
  (p) => !p.is_admin
).length;

const playersWithPredictions =
  players.filter((player) =>
    predictions.some(
      (prediction) =>
        prediction.player_id === player.id
    )
  ).length;

const totalPredictions =
  predictions.length;
const expectedPredictions =
  totalPlayers * games.length;

const currentUserPredictions = currentUser
  ? predictions.filter(
      (prediction) =>
        prediction.player_id === currentUser.id &&
        prediction.predicted_score_a !== null &&
        prediction.predicted_score_b !== null
    )
  : [];

const totalUserGames = games.length;

const userPredictedGames =
  currentUserPredictions.length;

const userPendingGames =
  totalUserGames - userPredictedGames;

const userCompletion =
  totalUserGames > 0
    ? Math.round((userPredictedGames / totalUserGames) * 100)
    : 0;
    const approvedPlayers =
  players.filter(
    (p) => !p.is_admin && p.approved
  ).length;

const pendingPlayers =
  players.filter(
    (p) => !p.is_admin && !p.approved
  ).length;

const activePlayers =
  players.filter(
    (player) =>
      !player.is_admin &&
      predictions.some(
        (prediction) =>
          prediction.player_id === player.id
      )
  ).length;
  async function savePredictions() {
    if (!currentUser) return;

    setLoading(true);

    const payload = Object.entries(drafts).map(([gameId, values]) => ({
      player_id: currentUser.id,
      game_id: gameId,
      predicted_score_a:
        values.predicted_score_a === ""
          ? null
          : Number(values.predicted_score_a),

      predicted_score_b:
        values.predicted_score_b === ""
          ? null
          : Number(values.predicted_score_b),
    }));

    if (payload.length === 0) {
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("predictions")
      .upsert(payload, {
        onConflict: "player_id,game_id",
      });

    if (error) {
      setMessage("Erro ao salvar palpites.");
      setLoading(false);
      return;
    }

    await loadData();

    setMessage("Palpites salvos com sucesso.");
    setLoading(false);
  }
async function saveSinglePrediction(
  gameId: string,
  field: "predicted_score_a" | "predicted_score_b",
  value: string
) {
  if (!currentUser) return;

  const parsedValue = value === "" ? null : Number(value);

  const existing = predictions.find(
    (p) => p.player_id === currentUser.id && p.game_id === gameId
  );

  const updatedPrediction = {
    player_id: currentUser.id,
    game_id: gameId,
    predicted_score_a:
      field === "predicted_score_a"
        ? parsedValue
        : existing?.predicted_score_a ?? null,
    predicted_score_b:
      field === "predicted_score_b"
        ? parsedValue
        : existing?.predicted_score_b ?? null,
  };

  setPredictions((prev) => {
    const filtered = prev.filter(
      (p) => !(p.player_id === currentUser.id && p.game_id === gameId)
    );

    return [...filtered, updatedPrediction];
  });

  await supabase.from("predictions").upsert(updatedPrediction, {
    onConflict: "player_id,game_id",
  });
}
  async function updateOfficialResult(
    gameId: string,
    field: "official_score_a" | "official_score_b",
    value: string
  ) {
    const parsed = value === "" ? null : Number(value);

    await supabase
      .from("games")
      .update({
        [field]: parsed,
      })
      .eq("id", gameId);

    setGames((prev) =>
      prev.map((g) =>
        g.id === gameId
          ? {
              ...g,
              [field]: parsed,
            }
          : g
      )
    );
  }
function exportAuditCsv() {
  const rows = [
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
      "Placar Exato"
    ],
  ];

  players.forEach((player) => {
    games.forEach((game) => {
      const prediction = predictions.find(
        (p) => p.player_id === player.id && p.game_id === game.id
      );
const result = calculatePoints(
  prediction,
  game
);
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
  if (checkingLogin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="animate-pulse text-xl font-semibold">
          Carregando Bolão Copa 2026...
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-900 border-slate-800 text-white rounded-3xl shadow-2xl">
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-4">
             <img
  src="/brand/bolao-logo.jpg"
  alt="Bolão Copa 2026"
  className="mx-auto h-24 w-24 rounded-2xl object-cover shadow-xl"
/>

              <div>
                <h1 className="text-4xl font-black">
                  Bolão 2026
                </h1>

                <p className="text-slate-400 mt-2">
                  Copa do Mundo FIFA
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <Input
                placeholder="Nome"
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white h-12"
              />

              <Input
  placeholder="51999999999"
                value={loginCode}
                onChange={(e) => setLoginCode(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white h-12"
              />

              <Button
                onClick={login}
                className="w-full h-12 text-lg bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold"
              >
                Entrar
              </Button>

              <Button
  variant="outline"
  onClick={loadData}
  className="w-full border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
>
                <RefreshCw className="mr-2" size={16} />
                Atualizar
              </Button>
            </div>


            {message && (
              <div className="text-center text-sm text-red-400">
                {message}
              </div>
            )}

            <div className="text-xs text-slate-500 text-center">
  Exemplo: Rafael / 51999999999
</div>
          </CardContent>
        </Card>
      </div>
    );
  }
    return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-emerald-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto p-4 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <img
  src="/brand/bolao-logo.jpg"
  alt="Bolão Copa 2026"
  className="h-14 w-14 rounded-2xl object-cover shadow-lg"
/>

              <div>
                <h1 className="text-2xl md:text-4xl font-black tracking-tight">
                  Bolão Copa 2026
                </h1>
                <p className="text-slate-300 text-sm">
                  Bem-vindo, {currentUser.name}
                </p>
              </div>
            </div>
          </div>

          <Button
            variant="secondary"
            onClick={() => {
              localStorage.removeItem("bolao_user");
              setCurrentUser(null);
            }}
            className="bg-white/10 text-white hover:bg-white/20 border border-white/10"
          >
            <LogOut className="mr-2" size={16} />
            Sair
          </Button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Button
  onClick={() => {
  setTab("palpites");
  loadData();
}}
  className={
    tab === "palpites"
      ? "bg-yellow-500 text-slate-950 hover:bg-yellow-400 font-bold"
      : "bg-slate-900 border border-slate-800 text-white hover:bg-slate-800"
  }
>
  <Shield className="mr-2" size={16} />
  Palpites
</Button>

<Button
  onClick={() => {
  setTab("classificacao");
  loadData();
}}
  className={
    tab === "classificacao"
      ? "bg-yellow-500 text-slate-950 hover:bg-yellow-400 font-bold"
      : "bg-slate-900 border border-slate-800 text-white hover:bg-slate-800"
  }
>
  <Trophy className="mr-2" size={16} />
  Classificação
</Button>
<Button
  onClick={() => {
  setTab("matamata");
  loadData();
}}
  className={
    tab === "matamata"
      ? "bg-yellow-500 text-slate-950 hover:bg-yellow-400 font-bold"
      : "bg-slate-900 border border-slate-800 text-white hover:bg-slate-800"
  }
>
  <Trophy className="mr-2" size={16} />
  Mata-mata
</Button>
<Button
  onClick={() => setTab("ranking")}
  className={
    tab === "ranking"
      ? "bg-yellow-500 text-slate-950 hover:bg-yellow-400 font-bold"
      : "bg-slate-900 border border-slate-800 text-white hover:bg-slate-800"
  }
>
  <BarChart3 className="mr-2" size={16} />
  Ranking
</Button>
          {currentUser.is_admin && (
            <Button
              onClick={() => setTab("admin")}
              className={
                tab === "admin"
                  ? "bg-yellow-500 text-slate-950 hover:bg-yellow-400 font-bold"
                  : "bg-slate-900 border border-slate-800 text-white hover:bg-slate-800"
              }
            >
              <Lock className="mr-2" size={16} />
              Admin
            </Button>
          )}
        </div>
{tab === "palpites" && (
<div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
  <Card className="bg-slate-900 border-slate-800 text-white rounded-2xl min-h-[105px] md:min-h-0 flex items-center justify-center">
    <CardContent className="p-3 md:p-4 text-center">
      <div className="text-xs md:text-sm text-slate-400">Jogos</div>
      <div className="text-2xl md:text-3xl font-black text-yellow-400">
        {totalUserGames}
      </div>
    </CardContent>
  </Card>

  <Card className="bg-slate-900 border-slate-800 text-white rounded-2xl min-h-[105px] md:min-h-0 flex items-center justify-center">
    <CardContent className="p-3 md:p-4 text-center">
      <div className="text-xs md:text-sm text-slate-400">Jogos palpitados</div>
      <div className="text-2xl md:text-3xl font-black text-emerald-400">
        {userPredictedGames}
      </div>
    </CardContent>
  </Card>

  <Card className="bg-slate-900 border-slate-800 text-white rounded-2xl min-h-[105px] md:min-h-0 flex items-center justify-center">
    <CardContent className="p-3 md:p-4 text-center">
      <div className="text-xs md:text-sm text-slate-400">Jogos não palpitados</div>
      <div className="text-2xl md:text-3xl font-black text-red-400">
        {userPendingGames}
      </div>
    </CardContent>
  </Card>

  <Card className="bg-slate-900 border-slate-800 text-white rounded-2xl min-h-[105px] md:min-h-0 flex items-center justify-center">
    <CardContent className="p-3 md:p-4 text-center">
      <div className="text-xs md:text-sm text-slate-400">% concluído</div>
      <div className="text-2xl md:text-3xl font-black text-blue-400">
        {userCompletion}%
      </div>
    </CardContent>
  </Card>
</div>
)}
{message && (
  <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 text-sm text-yellow-400">
    {message}
  </div>
)}

        {tab === "palpites" && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black">Meus Palpites</h2>
               <div>
  <p className="text-slate-400 text-sm">
    Preencha os placares. O salvamento é automático.
  </p>

  {groupsLocked && (
    <p className="text-red-400 text-sm font-semibold mt-1">
      Palpites encerrados para a fase de grupos.
    </p>
  )}
</div>
              </div>

              
            </div>

            <div className="space-y-8">
  {Object.entries(
    games.reduce((acc: any, game) => {
      const group = game.group_name || "Outros";

      if (!acc[group]) {
        acc[group] = [];
      }

      acc[group].push(game);

      return acc;
    }, {})
  ).map(([group, groupGames]: any) => (
    <div key={group} className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-yellow-500 text-slate-950 flex items-center justify-center font-black">
          {group}
        </div>

        <div>
          <h3 className="text-2xl font-black">
            Grupo {group}
          </h3>

          <p className="text-slate-400 text-sm">
            Fase de grupos
          </p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
  <div className="bg-[#2A398D] text-white text-center font-black text-xs py-2 tracking-wide">
    GRUPO {group}
  </div>

<div className="space-y-4">
  <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
    <div className="bg-[#2A398D] text-white text-center font-black text-sm md:text-base py-3 tracking-wide">
      CLASSIFICAÇÃO - GRUPO {group}
    </div>

    <div className="grid grid-cols-12 bg-slate-950 text-slate-400 text-xs md:text-sm uppercase font-bold px-4 py-3 border-b border-slate-800">
      <div className="col-span-1">#</div>
      <div className="col-span-4">Seleção</div>
      <div className="col-span-1 text-center">P</div>
      <div className="col-span-1 text-center">J</div>
      <div className="col-span-1 text-center">V</div>
      <div className="col-span-1 text-center">E</div>
      <div className="col-span-1 text-center">D</div>
      <div className="col-span-1 text-center">SG</div>
      <div className="col-span-1 text-center">GP</div>
    </div>

    {calculateGroupStandingsFromPredictions(
      groupGames,
      predictions,
      currentUser.id
    ).map((team: any, index: number) => (
      <div
        key={team.team}
        className={`grid grid-cols-12 items-center px-4 py-4 border-b border-slate-800 text-sm md:text-base ${
          index < 2 ? "bg-slate-800/70" : "bg-slate-900"
        }`}
      >
        <div className="col-span-1 text-yellow-400 font-black">{index + 1}º</div>

        <div className="col-span-4 font-bold flex items-center gap-3">
          <Flag team={team.team} />
          {team.team}
        </div>

        <div className="col-span-1 text-center font-bold">{team.points}</div>
        <div className="col-span-1 text-center">{team.played}</div>
        <div className="col-span-1 text-center">{team.wins}</div>
        <div className="col-span-1 text-center">{team.draws}</div>
        <div className="col-span-1 text-center">{team.losses}</div>
        <div className="col-span-1 text-center">{team.goalDiff}</div>
        <div className="col-span-1 text-center">{team.goalsFor}</div>
      </div>
    ))}
  </div>

  <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
    <div className="bg-[#2A398D] text-white text-center font-black text-sm md:text-base py-3 tracking-wide">
      JOGOS - GRUPO {group}
    </div>

    {groupGames.map((game: Game) => {
      const existing = predictions.find(
        (p) => p.player_id === currentUser.id && p.game_id === game.id
      );

      const draft = drafts[game.id] || {
        predicted_score_a: existing?.predicted_score_a?.toString() ?? "",
        predicted_score_b: existing?.predicted_score_b?.toString() ?? "",
      };

      return (
        <div
          key={game.id}
          className="grid grid-cols-[58px_minmax(70px,1fr)_24px_36px_16px_36px_24px_minmax(70px,1fr)] items-center"
        >
          <div className="text-slate-300 text-[10px] md:text-sm whitespace-nowrap">
            {formatDate(game.match_date)}
          </div>

          <div className="text-right font-semibold truncate pr-1 text-xs md:text-base">
            {game.team_a}
          </div>

          <div className="flex justify-center">
            <Flag team={game.team_a} />
          </div>

          <div className="flex justify-center">
            <Input
              type="number"
              min="0"
              disabled={groupsLocked || game.locked}
              value={draft.predicted_score_a}
              onChange={(e) => {
                const value = e.target.value;
                setDrafts((prev) => ({
                  ...prev,
                  [game.id]: { ...draft, predicted_score_a: value },
                }));
                saveSinglePrediction(game.id, "predicted_score_a", value);
              }}
              className="h-8 w-9 rounded-lg border border-[#2A398D] bg-slate-950 text-center text-lg font-bold text-white p-0"
            />
          </div>

          <div className="text-center font-bold text-slate-300">x</div>

          <div className="flex justify-center">
            <Input
              type="number"
              min="0"
              disabled={groupsLocked || game.locked}
              value={draft.predicted_score_b}
              onChange={(e) => {
                const value = e.target.value;
                setDrafts((prev) => ({
                  ...prev,
                  [game.id]: { ...draft, predicted_score_b: value },
                }));
                saveSinglePrediction(game.id, "predicted_score_b", value);
              }}
              className="h-8 w-9 rounded-lg border border-[#2A398D] bg-slate-950 text-center text-lg font-bold text-white p-0"
            />
          </div>

          <div className="flex justify-center">
            <Flag team={game.team_b} />
          </div>

          <div className="font-semibold truncate pl-1 text-xs md:text-base">
            {game.team_b}
          </div>
        </div>
      );
    })}
  </div>
</div>
      </div>
    </div>
  ))}
</div>
          </div>
        )}
{tab === "classificacao" && games.length > 0 && (
  <Card className="bg-slate-900 border-slate-800 text-white rounded-3xl">
    <CardContent className="p-5 space-y-4">
      <div>
  <h2 className="text-2xl font-black">
    Classificação dos Grupos
  </h2>
  <p className="text-slate-400 text-sm">
    Tabelas calculadas automaticamente com base nos resultados oficiais.
  </p>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {Object.entries(
    games.reduce((acc: any, game) => {
      const group = game.group_name || "Outros";

      if (!acc[group]) {
        acc[group] = [];
      }

      acc[group].push(game);

      return acc;
    }, {})
  ).map(([group, groupGames]: any) => {
    const standings = calculateGroupStandings(groupGames);

    return (
      <Card
        key={group}
        className="bg-slate-950 border-slate-800 text-white rounded-2xl overflow-hidden"
      >
        <CardContent className="p-0">
          <div className="bg-slate-800 p-3 font-black text-yellow-400">
            Grupo {group}
          </div>

          <div className="grid grid-cols-12 text-xs uppercase tracking-wide text-slate-400 p-3 font-bold">
            <div className="col-span-5">Seleção</div>
            <div className="col-span-1 text-center">P</div>
            <div className="col-span-1 text-center">J</div>
            <div className="col-span-1 text-center">V</div>
            <div className="col-span-1 text-center">E</div>
            <div className="col-span-1 text-center">D</div>
            <div className="col-span-1 text-center">SG</div>
            <div className="col-span-1 text-center">GP</div>
          </div>

          {standings.map((team: any, index: number) => (
            <div
              key={team.team}
              className={`grid grid-cols-12 p-3 border-t border-slate-800 items-center ${
                index < 2 ? "bg-emerald-900/20" : ""
              }`}
            >
              <div className="col-span-5 font-semibold text-sm flex items-center gap-2">
                <span className="text-yellow-400 font-black">
                  {index + 1}º
                </span>
                {team.team}
              </div>

              <div className="col-span-1 text-center font-bold">{team.points}</div>
              <div className="col-span-1 text-center">{team.played}</div>
              <div className="col-span-1 text-center">{team.wins}</div>
              <div className="col-span-1 text-center">{team.draws}</div>
              <div className="col-span-1 text-center">{team.losses}</div>
              <div className="col-span-1 text-center">{team.goalDiff}</div>
              <div className="col-span-1 text-center">{team.goalsFor}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  })}
</div>
      <div>
        <h2 className="text-2xl font-black">
          Melhores 3º colocados
        </h2>
        <p className="text-slate-400 text-sm">
          Os 8 melhores avançam para o mata-mata.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800">
        <div className="grid grid-cols-12 bg-slate-800 text-xs uppercase tracking-wide text-slate-400 p-3 font-bold">
          <div className="col-span-1">#</div>
          <div className="col-span-2">Grupo</div>
          <div className="col-span-4">Seleção</div>
          <div className="col-span-1 text-center">P</div>
          <div className="col-span-1 text-center">SG</div>
          <div className="col-span-1 text-center">GP</div>
          <div className="col-span-2 text-center">Status</div>
        </div>

        {calculateBestThirds(games).map((team: any, index: number) => (
          <div
            key={`${team.group}-${team.team}`}
            className={`grid grid-cols-12 p-3 border-t border-slate-800 items-center ${
              index < 8 ? "bg-emerald-900/20" : ""
            }`}
          >
            <div className="col-span-1 font-black text-yellow-400">
              {index + 1}º
            </div>

            <div className="col-span-2">
              Grupo {team.group}
            </div>

            <div className="col-span-4 font-semibold">
              {team.team}
            </div>

            <div className="col-span-1 text-center font-bold">
              {team.points}
            </div>

            <div className="col-span-1 text-center">
              {team.goalDiff}
            </div>

            <div className="col-span-1 text-center">
              {team.goalsFor}
            </div>

            <div className="col-span-2 text-center text-xs font-bold">
              {index < 8 ? "Classificado" : "Eliminado"}
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)}
{tab === "matamata" && (
  <div className="space-y-4">
    <div>
      <h2 className="text-2xl font-black">Mata-mata</h2>
      <p className="text-slate-400 text-sm">
        Classificados automáticos com base na fase de grupos.
      </p>
    </div>

    <Card className="bg-slate-900 border-slate-800 text-white rounded-3xl">
      <CardContent className="p-5 space-y-4">
        <h3 className="text-xl font-black text-yellow-400">
  1ª fase eliminatória
</h3>

<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
  {generateRound32(
  buildGamesFromPredictions(games, predictions, currentUser.id)
).map((match: any, index: number) => (
    <Card
      key={index}
      className="bg-slate-950 border border-slate-800 text-white rounded-2xl"
    >
      <CardContent className="p-4 space-y-3">
        <div className="text-xs text-slate-500 uppercase tracking-wide">
          Jogo {index + 1}
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="text-xs text-slate-500">
              {match.home
                ? `${match.home.position}º Grupo ${match.home.group}`
                : "A definir"}
            </div>
            <div className="font-bold">
              {match.home?.team || "---"}
            </div>
          </div>

          <div className="text-yellow-400 font-black">x</div>

          <div className="flex-1 text-right">
            <div className="text-xs text-slate-500">
              {match.away
                ? `${match.away.position}º Grupo ${match.away.group}`
                : "A definir"}
            </div>
            <div className="font-bold">
              {match.away?.team || "---"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  ))}
</div>
        <h3 className="text-xl font-black text-yellow-400">
          Classificados diretos
        </h3>
<div className="space-y-3">
  <h3 className="text-lg font-black text-white">
    Oitavas de Final
  </h3>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
    {generateRound32(games).map(
      (match: any, index: number) => (
        <Card
          key={index}
          className="bg-slate-950 border border-slate-800 text-white rounded-2xl"
        >
          <CardContent className="p-4 space-y-3">
            <div className="text-xs text-slate-400 uppercase tracking-wide">
              Confronto {index + 1}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500">
                  {match.home?.position}º Grupo {match.home?.group}
                </div>

                <div className="font-bold text-lg">
                  {match.home?.team || "---"}
                </div>
              </div>

              <div className="text-slate-500 font-black">
                X
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-500">
                  {match.away?.position}º Grupo {match.away?.group}
                </div>

                <div className="font-bold text-lg">
                  {match.away?.team || "---"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    )}
  </div>
</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
         {calculateQualifiedTeams(
  buildGamesFromPredictions(games, predictions, currentUser.id)
).map((team: any) => (
            <div
              key={`${team.position}-${team.group}-${team.team}`}
              className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex justify-between"
            >
              <div>
                <div className="text-xs text-slate-400">
                  {team.position}º do Grupo {team.group}
                </div>
                <div className="font-bold">{team.team}</div>
              </div>

              <div className="text-yellow-400 font-black">
                {team.points} pts
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
)}
        {tab === "ranking" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-black">Ranking Geral</h2>
              <p className="text-slate-400 text-sm">
                Classificação atual do bolão.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ranking.slice(0, 3).map((player, index) => (
                <Card
                  key={player.id}
                  className="bg-slate-900 border-slate-800 text-white rounded-3xl"
                >
                  <CardContent className="p-5 text-center space-y-3">
                    <img
  src="/brand/bolao-logo.jpg"
  alt="Ranking"
  className="mx-auto h-16 w-16 rounded-2xl object-cover shadow-lg"
/>

                    <div className="text-2xl md:text-3xl font-black">{index + 1}º</div>
                    <div className="font-bold">{player.name}</div>
                    <div className="text-yellow-400 font-black text-xl">
                      {player.total} pts
                    </div>
                    <div className="text-xs text-slate-400">
                      {player.exacts} placares exatos
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-slate-900 border-slate-800 text-white rounded-3xl">
              <CardContent className="p-0 overflow-hidden">
                {ranking.map((player, index) => (
                  <div
                    key={player.id}
                    className="grid grid-cols-12 p-4 border-b border-slate-800 items-center"
                  >
                    <div className="col-span-2 font-black text-yellow-400">
                      {index + 1}º
                    </div>
                    <div className="col-span-6 font-semibold">
                      {player.name}
                    </div>
                    <div className="col-span-2 text-right font-bold">
                      {player.total}
                    </div>
                    <div className="col-span-2 text-right text-xs text-slate-400">
                      {player.exacts} exatos
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {tab === "admin" && currentUser.is_admin && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-black">Painel Admin</h2>
              <p className="text-slate-400 text-sm">
                Lance os resultados oficiais dos jogos.
              </p>
              <Button
  onClick={exportAuditCsv}
  className="mt-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
>
  Exportar auditoria CSV
</Button>
<div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
  <Card className="bg-slate-900 border-slate-800 text-white rounded-2xl min-h-[105px] md:min-h-0 flex items-center justify-center">
    <CardContent className="p-3 md:p-4 text-center">
      <div className="text-xs md:text-sm text-slate-400">Participantes</div>
      <div className="text-2xl md:text-3xl font-black text-yellow-400">
        {totalPlayers}
      </div>
    </CardContent>
  </Card>

  <Card className="bg-slate-900 border-slate-800 text-white rounded-2xl min-h-[105px] md:min-h-0 flex items-center justify-center">
    <CardContent className="p-3 md:p-4 text-center">
      <div className="text-xs md:text-sm text-slate-400">Aprovados</div>
      <div className="text-2xl md:text-3xl font-black text-emerald-400">
        {approvedPlayers}
      </div>
    </CardContent>
  </Card>

  <Card className="bg-slate-900 border-slate-800 text-white rounded-2xl min-h-[105px] md:min-h-0 flex items-center justify-center">
    <CardContent className="p-3 md:p-4 text-center">
      <div className="text-xs md:text-sm text-slate-400">Pendentes</div>
      <div className="text-2xl md:text-3xl font-black text-red-400">
        {pendingPlayers}
      </div>
    </CardContent>
  </Card>

  <Card className="bg-slate-900 border-slate-800 text-white rounded-2xl min-h-[105px] md:min-h-0 flex items-center justify-center">
    <CardContent className="p-3 md:p-4 text-center">
      <div className="text-xs md:text-sm text-slate-400">Já palpitou</div>
      <div className="text-2xl md:text-3xl font-black text-blue-400">
        {activePlayers}
      </div>
    </CardContent>
  </Card>
</div>
            </div>

            <div className="space-y-3">
              {games.map((game) => (
                <Card
                  key={game.id}
                  className="bg-slate-900 border-slate-800 text-white rounded-2xl"
                >
                    <CardContent className="p-0">
  <div className="grid grid-cols-[120px_160px_34px_34px_24px_34px_34px_160px] items-center justify-center bg-[#F1F1F1] border-b border-white text-[#111] text-[12px] min-h-[24px]">
    
    <div className="px-1 text-[10px] whitespace-nowrap text-center text-slate-400">
      {formatDate(game.match_date)}
    </div>

    <div className="pr-1 text-right font-semibold truncate text-[12px]">
      {game.team_a}
    </div>

    <div className="flex justify-center">
      <Flag team={game.team_a} />
    </div>

    <div className="flex justify-center">
      <Input
        type="number"
        min="0"
        value={game.official_score_a ?? ""}
        onChange={(e) =>
          updateOfficialResult(
            game.id,
            "official_score_a",
            e.target.value
          )
        }
        className="h-6 w-7 rounded-none border border-[#2A398D] bg-white text-center text-[12px] font-semibold text-[#111] p-0"
      />
    </div>

    <div className="text-center text-xs font-bold text-[#2A398D]">
      x
    </div>

    <div className="flex justify-center">
      <Input
        type="number"
        min="0"
        value={game.official_score_b ?? ""}
        onChange={(e) =>
          updateOfficialResult(
            game.id,
            "official_score_b",
            e.target.value
          )
        }
        className="h-6 w-7 rounded-none border border-[#2A398D] bg-white text-center text-[12px] font-semibold text-[#111] p-0"
      />
    </div>

    <div className="flex justify-center">
      <Flag team={game.team_b} />
    </div>

    <div className="pl-1 font-semibold truncate text-[12px]">
      {game.team_b}
    </div>

  </div>
</CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}