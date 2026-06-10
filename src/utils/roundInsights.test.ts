import { describe, it, expect } from "vitest";
import { generateRoundInsights } from "./roundInsights";
import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";
import { Player } from "@/types/player";

const TODAY = "2026-06-10";
const YESTERDAY = "2026-06-09";

const makeGame = (id: string, date: string, scoreA: number | null, scoreB: number | null): Game => ({
  id,
  phase: "groups",
  group_name: "A",
  match_order: 1,
  match_date: `${date}T15:00:00`,
  team_a: "Brasil",
  team_b: "Argentina",
  official_score_a: scoreA,
  official_score_b: scoreB,
  locked: scoreA !== null,
});

const makePred = (playerId: string, gameId: string, a: number, b: number): Prediction => ({
  player_id: playerId,
  game_id: gameId,
  predicted_score_a: a,
  predicted_score_b: b,
});

const players: Player[] = [
  { id: "p1", name: "Ana",    access_code: "1", is_admin: false, approved: true },
  { id: "p2", name: "Bruno",  access_code: "2", is_admin: false, approved: true },
  { id: "p3", name: "Carla",  access_code: "3", is_admin: false, approved: true },
  { id: "p4", name: "Admin",  access_code: "0", is_admin: true,  approved: true },
];

describe("generateRoundInsights", () => {
  it("returns empty array when no scored games", () => {
    const games = [makeGame("g1", TODAY, null, null)];
    expect(generateRoundInsights(games, [], players)).toEqual([]);
  });

  it("ignores admin players in all insights", () => {
    const games = [makeGame("g1", YESTERDAY, 2, 1)];
    const predictions = [
      makePred("p4", "g1", 2, 1), // admin — exact match, should be ignored
      makePred("p1", "g1", 0, 0), // non-admin — wrong
    ];
    const insights = generateRoundInsights(games, predictions, players);
    expect(insights.every((i) => !i.text.includes("Admin"))).toBe(true);
  });

  it("detects round top scorer ⭐", () => {
    const games = [makeGame("g1", YESTERDAY, 2, 1)];
    // p1 gets outcome right (7pts), p2 and p3 wrong (0pts)
    const predictions = [
      makePred("p1", "g1", 2, 0),
      makePred("p2", "g1", 0, 2),
      makePred("p3", "g1", 0, 2),
    ];
    const insights = generateRoundInsights(games, predictions, players);
    const star = insights.find((i) => i.emoji === "⭐");
    expect(star).toBeDefined();
    expect(star?.text).toContain("Ana");
  });

  it("detects single exact score hit 🎯", () => {
    const games = [makeGame("g1", YESTERDAY, 2, 1)];
    const predictions = [
      makePred("p1", "g1", 2, 1), // exact
      makePred("p2", "g1", 2, 0),
      makePred("p3", "g1", 1, 0),
    ];
    const insights = generateRoundInsights(games, predictions, players);
    const exact = insights.find((i) => i.emoji === "🎯");
    expect(exact).toBeDefined();
    expect(exact?.text).toContain("Ana");
  });

  it("detects multiple exact score hits 🎯", () => {
    const games = [makeGame("g1", YESTERDAY, 2, 1)];
    const predictions = [
      makePred("p1", "g1", 2, 1),
      makePred("p2", "g1", 2, 1),
      makePred("p3", "g1", 0, 0),
    ];
    const insights = generateRoundInsights(games, predictions, players);
    const exact = insights.find((i) => i.emoji === "🎯");
    expect(exact).toBeDefined();
    expect(exact?.text).toMatch(/Ana|Bruno/);
  });

  it("detects biggest miss 😬 (error >= 4)", () => {
    const games = [makeGame("g1", YESTERDAY, 0, 0)];
    const predictions = [
      makePred("p1", "g1", 4, 0), // error = 4
      makePred("p2", "g1", 1, 0),
      makePred("p3", "g1", 0, 0),
    ];
    const insights = generateRoundInsights(games, predictions, players);
    const miss = insights.find((i) => i.emoji === "😬");
    expect(miss).toBeDefined();
    expect(miss?.text).toContain("Ana");
  });

  it("does not emit biggest miss when max error < 4", () => {
    const games = [makeGame("g1", YESTERDAY, 1, 0)];
    const predictions = [
      makePred("p1", "g1", 2, 1), // error = 2
      makePred("p2", "g1", 0, 0),
    ];
    const insights = generateRoundInsights(games, predictions, players);
    expect(insights.find((i) => i.emoji === "😬")).toBeUndefined();
  });

  it("detects game that fooled everyone 🤯", () => {
    const games = [makeGame("g1", YESTERDAY, 1, 0)]; // Brasil wins
    const predictions = [
      makePred("p1", "g1", 0, 1), // Argentina win — wrong outcome
      makePred("p2", "g1", 0, 2), // Argentina win — wrong outcome
      makePred("p3", "g1", 1, 2), // Argentina win — wrong outcome
    ];
    const insights = generateRoundInsights(games, predictions, players);
    expect(insights.find((i) => i.emoji === "🤯")).toBeDefined();
  });

  it("detects consensus wrong prediction 🐑", () => {
    const games = [makeGame("g1", YESTERDAY, 1, 0)];
    const predictions = [
      makePred("p1", "g1", 0, 1),
      makePred("p2", "g1", 0, 1),
      makePred("p3", "g1", 0, 1),
    ];
    const insights = generateRoundInsights(games, predictions, players);
    expect(insights.find((i) => i.emoji === "🐑")).toBeDefined();
  });

  it("top-10 entry is based on actual ranking, not insertion order", () => {
    // Build 12 non-admin players; p1 starts outside top 10, gains pts this round
    const manyPlayers: Player[] = Array.from({ length: 12 }, (_, i) => ({
      id: `p${i + 1}`,
      name: `Player${i + 1}`,
      access_code: String(i),
      is_admin: false,
      approved: true,
    }));

    // Previous round game (already scored) — p1 gets 0, p2-p12 all get 7
    const prevGame = makeGame("gPrev", "2026-06-08", 1, 0);
    // Last round game — p1 gets 15 (exact), everyone else gets 0
    const lastGame = makeGame("gLast", YESTERDAY, 2, 1);

    const predictions: Prediction[] = [
      // Previous game: p2-p12 get outcome right, p1 wrong
      ...manyPlayers.slice(1).map((p) => makePred(p.id, "gPrev", 2, 0)),
      makePred("p1", "gPrev", 0, 1),
      // Last game: p1 exact, everyone else wrong
      makePred("p1", "gLast", 2, 1),
      ...manyPlayers.slice(1).map((p) => makePred(p.id, "gLast", 0, 3)),
    ];

    const insights = generateRoundInsights([prevGame, lastGame], predictions, manyPlayers);
    const entry = insights.find((i) => i.emoji === "🚪");
    expect(entry).toBeDefined();
    expect(entry?.text).toContain("Player1");
  });

  it("returns empty when no predictions exist", () => {
    const games = [makeGame("g1", YESTERDAY, 2, 1)];
    expect(generateRoundInsights(games, [], players)).toEqual([]);
  });

  it("prioritises ⭐ and 🎯 at the front of results", () => {
    const games = [makeGame("g1", YESTERDAY, 0, 0)];
    const predictions = [
      makePred("p1", "g1", 0, 0), // exact
      makePred("p2", "g1", 4, 0), // big miss
      makePred("p3", "g1", 0, 4),
    ];
    const insights = generateRoundInsights(games, predictions, players);
    expect(insights.length).toBeGreaterThan(0);
    const firstTwoEmojis = insights.slice(0, 2).map((i) => i.emoji);
    expect(firstTwoEmojis).toContain("⭐");
    expect(firstTwoEmojis).toContain("🎯");
  });
});
