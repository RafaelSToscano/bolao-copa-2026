"use client";

import { forwardRef } from "react";
import { Player } from "@/types/player";
import { Insight } from "@/utils/roundInsights";

interface RankingShareCardProps {
  ranking: (Player & { total: number; exacts: number })[];
  insights: Insight[];
  date: string;
  positionChanges?: Map<string, number>;
}

function ChangeTag({ change }: { change: number | undefined }) {
  if (change === undefined || change === 0)
    return <span style={{ color: "#475569", fontSize: 11 }}>–</span>;
  if (change > 0)
    return <span style={{ color: "#34d399", fontSize: 11, fontWeight: 700 }}>▲+{change}</span>;
  return <span style={{ color: "#f87171", fontSize: 11, fontWeight: 700 }}>▼{change}</span>;
}

const podium = [
  { medal: "🥇", color: "#facc15", bg: "#1c1917" },
  { medal: "🥈", color: "#cbd5e1", bg: "#1c1917" },
  { medal: "🥉", color: "#fb923c", bg: "#1c1917" },
];

export const RankingShareCard = forwardRef<HTMLDivElement, RankingShareCardProps>(
  function RankingShareCard({ ranking, insights, date, positionChanges }, ref) {
    const top3 = ranking.slice(0, 3);
    const middle = ranking.slice(3, 10);
    const last = ranking.length > 3 ? ranking[ranking.length - 1] : null;
    const showLast = last && !middle.find((p) => p.id === last.id);

    return (
      <div
        ref={ref}
        style={{
          width: 600,
          background: "#0f172a",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "#f8fafc",
          borderRadius: 24,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #1e3a8a 0%, #065f46 100%)",
            padding: "20px 28px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 32 }}>🏆</span>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: -0.5 }}>
                BOLÃO COPA 2026
              </div>
              <div style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>
                Ranking Geral
              </div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>
            📅 {date}
          </div>
        </div>

        {/* Top 3 */}
        <div style={{ padding: "20px 28px 0" }}>
          {top3.map((player, i) => {
            const p = podium[i];
            return (
              <div
                key={player.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: p.bg,
                  borderRadius: 14,
                  padding: "12px 16px",
                  marginBottom: 8,
                  border: `1px solid ${p.color}33`,
                }}
              >
                <span style={{ fontSize: 26, width: 36, flexShrink: 0 }}>
                  {p.medal}
                </span>
                <div style={{ flex: 1, marginLeft: 10 }}>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: p.color,
                    }}
                  >
                    {i + 1}º {player.name}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", display: "flex", gap: 6, alignItems: "center" }}>
                    <span>{player.exacts} placar{player.exacts !== 1 ? "es" : ""} exato{player.exacts !== 1 ? "s" : ""}</span>
                    <ChangeTag change={positionChanges?.get(player.id)} />
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 900,
                    color: p.color,
                  }}
                >
                  {player.total} pts
                </div>
              </div>
            );
          })}
        </div>

        {/* 4th–10th */}
        {middle.length > 0 && (
          <div
            style={{
              margin: "12px 28px 0",
              background: "#1e293b",
              borderRadius: 14,
              overflow: "hidden",
              border: "1px solid #334155",
            }}
          >
            {middle.map((player, i) => (
              <div
                key={player.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "9px 16px",
                  borderBottom: i < middle.length - 1 ? "1px solid #2d3f55" : "none",
                }}
              >
                <span
                  style={{
                    width: 28,
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#64748b",
                    flexShrink: 0,
                  }}
                >
                  {i + 4}º
                </span>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>
                  {player.name}
                </span>
                <ChangeTag change={positionChanges?.get(player.id)} />
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: "#e2e8f0",
                    marginLeft: 8,
                  }}
                >
                  {player.total} pts
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Lantern */}
        {showLast && (
          <div
            style={{
              margin: "10px 28px 0",
              background: "#1a0a0a",
              borderRadius: 14,
              padding: "10px 16px",
              border: "1px solid #7f1d1d55",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 22 }}>🔦</span>
            <span style={{ fontSize: 13, color: "#f87171", fontWeight: 700 }}>
              Lanterna: {last!.name} • {last!.total} pts
            </span>
          </div>
        )}

        {/* Insights */}
        {insights.length > 0 && (
          <div
            style={{
              margin: "14px 28px 20px",
              background: "#1e293b",
              borderRadius: 14,
              overflow: "hidden",
              border: "1px solid #334155",
            }}
          >
            <div
              style={{
                padding: "8px 16px",
                fontSize: 11,
                fontWeight: 800,
                color: "#64748b",
                letterSpacing: 1,
                textTransform: "uppercase",
                borderBottom: "1px solid #334155",
              }}
            >
              Destaques da Rodada
            </div>
            {insights.map((ins, i) => (
              <div
                key={`${ins.emoji}-${i}`}
                style={{
                  padding: "9px 16px",
                  fontSize: 13,
                  display: "flex",
                  gap: 8,
                  alignItems: "flex-start",
                  borderBottom: i < insights.length - 1 ? "1px solid #2d3f55" : "none",
                  color: "#cbd5e1",
                }}
              >
                <span style={{ flexShrink: 0 }}>{ins.emoji}</span>
                <span>{ins.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);
