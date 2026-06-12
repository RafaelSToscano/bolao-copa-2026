"use client";

import { forwardRef } from "react";
import { Player } from "@/types/player";

interface RankingFullCardProps {
  ranking: (Player & { total: number; exacts: number; position: number })[];
  positionChanges?: Map<string, number>;
  date: string;
}

function ChangeCell({ change }: { change: number | undefined }) {
  if (change === undefined || change === 0)
    return <span style={{ color: "#334155", fontSize: 12 }}>—</span>;
  if (change > 0)
    return <span style={{ color: "#34d399", fontSize: 11, fontWeight: 700 }}>▲+{change}</span>;
  return <span style={{ color: "#f87171", fontSize: 11, fontWeight: 700 }}>▼{change}</span>;
}

function posColor(i: number): string {
  if (i === 0) return "#facc15";
  if (i === 1) return "#cbd5e1";
  if (i === 2) return "#fb923c";
  return "#f59e0b";
}

export const RankingFullCard = forwardRef<HTMLDivElement, RankingFullCardProps>(
  function RankingFullCard({ ranking, positionChanges, date }, ref) {
    const isLanterna = (i: number) => i === ranking.length - 1 && ranking.length > 1;

    return (
      <div
        ref={ref}
        style={{
          width: 700,
          background: "#080e1a",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "#f8fafc",
          borderRadius: 20,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #1e3a8a 0%, #065f46 100%)",
            padding: "16px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 26 }}>🏆</span>
            <div>
              <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: -0.5 }}>
                BOLÃO COPA 2026
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, letterSpacing: 0.5 }}>
                RANKING COMPLETO
              </div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>
            📅 {date}
          </div>
        </div>

        {/* Column headers */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "6px 20px",
            borderBottom: "1px solid #0f1f35",
            background: "#0b1526",
          }}
        >
          <span style={{ width: 44, fontSize: 10, fontWeight: 700, color: "#1e3a5f", textTransform: "uppercase", letterSpacing: 1 }}>Pos</span>
          <span style={{ flex: 1, fontSize: 10, fontWeight: 700, color: "#1e3a5f", textTransform: "uppercase", letterSpacing: 1 }}>Participante</span>
          <span style={{ width: 46, fontSize: 10, fontWeight: 700, color: "#1e3a5f", textTransform: "uppercase", letterSpacing: 1, textAlign: "center" as const }}>Var</span>
          <span style={{ width: 64, fontSize: 10, fontWeight: 700, color: "#1e3a5f", textTransform: "uppercase", letterSpacing: 1, textAlign: "right" as const }}>Pts</span>
          <span style={{ width: 44, fontSize: 10, fontWeight: 700, color: "#1e3a5f", textTransform: "uppercase", letterSpacing: 1, textAlign: "right" as const }}>✓</span>
        </div>

        {/* Rows */}
        {ranking.map((player, i) => {
          const lanterna = isLanterna(i);
          const rowBg = lanterna ? "#150808" : i % 2 === 0 ? "#080e1a" : "#0b1220";
          return (
            <div
              key={player.id}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "10px 20px",
                background: rowBg,
                borderBottom: "1px solid #0d1b2e",
              }}
            >
              {/* Position */}
              <span
                style={{
                  width: 44,
                  fontSize: 14,
                  fontWeight: 900,
                  color: lanterna ? "#f87171" : posColor(i),
                  flexShrink: 0,
                }}
              >
                {lanterna ? "🔦" : `${player.position}º`}
              </span>

              {/* Name */}
              <span
                style={{
                  flex: 1,
                  fontSize: 14,
                  fontWeight: 600,
                  color: lanterna ? "#f87171" : "#e2e8f0",
                }}
              >
                {player.name}
              </span>

              {/* Change */}
              <span style={{ width: 46, textAlign: "center" as const }}>
                <ChangeCell change={positionChanges?.get(player.id)} />
              </span>

              {/* Points */}
              <span
                style={{
                  width: 64,
                  fontSize: 14,
                  fontWeight: 800,
                  color: lanterna ? "#f87171" : "#f8fafc",
                  textAlign: "right" as const,
                }}
              >
                {player.total}
              </span>

              {/* Exacts */}
              <span
                style={{
                  width: 44,
                  fontSize: 12,
                  fontWeight: 500,
                  color: lanterna ? "#7f1d1d" : "#1e3a5f",
                  textAlign: "right" as const,
                }}
              >
                {player.exacts}✓
              </span>
            </div>
          );
        })}

        {/* Footer */}
        <div
          style={{
            padding: "8px 20px",
            background: "#0b1220",
            fontSize: 10,
            color: "#1e3a5f",
            textAlign: "center" as const,
            fontWeight: 600,
            letterSpacing: 0.5,
          }}
        >
          {ranking.length} participantes · bolão-copa-2026
        </div>
      </div>
    );
  }
);
