"use client";

import { forwardRef } from "react";
import { Player } from "@/types/player";
import { Insight } from "@/utils/roundInsights";

interface RankingShareCardProps {
  ranking: (Player & { total: number; exacts: number; position: number })[];
  insights: Insight[];
  date: string;
  positionChanges?: Map<string, number>;
}

function ChangeTag({ change }: { change: number | undefined }) {
  if (change === undefined || change === 0)
    return <span style={{ color: "#334155", fontSize: 10 }}>–</span>;
  if (change > 0)
    return <span style={{ color: "#34d399", fontSize: 10, fontWeight: 700 }}>▲+{change}</span>;
  return <span style={{ color: "#f87171", fontSize: 10, fontWeight: 700 }}>▼{change}</span>;
}

const SECTION_GAP = 16;

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: SECTION_GAP }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          color: "#334155",
          letterSpacing: 1.5,
          textTransform: "uppercase",
          padding: "0 28px",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

const podium = [
  { medal: "🥇", color: "#facc15", bg: "#1c1917", border: "#facc1533" },
  { medal: "🥈", color: "#cbd5e1", bg: "#1c1917", border: "#cbd5e133" },
  { medal: "🥉", color: "#fb923c", bg: "#1c1917", border: "#fb923c33" },
];

export const RankingShareCard = forwardRef<HTMLDivElement, RankingShareCardProps>(
  function RankingShareCard({ ranking, insights, date, positionChanges }, ref) {
    const top3   = ranking.slice(0, 3);
    const middle = ranking.slice(3, 10);
    const last   = ranking.length > 10 ? ranking[ranking.length - 1] : null;

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
          paddingBottom: 20,
        }}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
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

        {/* ── Pódio (top 3) ─────────────────────────────────────────────── */}
        {top3.length > 0 && (
          <Section label="🏅 Pódio">
            <div style={{ padding: "0 28px" }}>
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
                      padding: "11px 16px",
                      marginBottom: i < 2 ? 7 : 0,
                      border: `1px solid ${p.border}`,
                    }}
                  >
                    <span style={{ fontSize: 24, width: 34, flexShrink: 0 }}>{p.medal}</span>
                    <div style={{ flex: 1, marginLeft: 10 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: p.color }}>
                        {player.position}º {player.name}
                      </div>
                      <div style={{ fontSize: 11, color: "#475569", display: "flex", gap: 6, alignItems: "center" }}>
                        <span>{player.exacts} exato{player.exacts !== 1 ? "s" : ""}</span>
                        <ChangeTag change={positionChanges?.get(player.id)} />
                      </div>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: p.color }}>
                      {player.total} pts
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* ── 4º ao 10º ─────────────────────────────────────────────────── */}
        {middle.length > 0 && (
          <Section label="📊 4º ao 10º">
            <div
              style={{
                margin: "0 28px",
                background: "#1e293b",
                borderRadius: 14,
                overflow: "hidden",
                border: "1px solid #273449",
              }}
            >
              {middle.map((player, i) => (
                <div
                  key={player.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "8px 14px",
                    borderBottom: i < middle.length - 1 ? "1px solid #1e2d42" : "none",
                  }}
                >
                  <span style={{ width: 26, fontSize: 12, fontWeight: 700, color: "#64748b", flexShrink: 0 }}>
                    {player.position}º
                  </span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>
                    {player.name}
                  </span>
                  <ChangeTag change={positionChanges?.get(player.id)} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#cbd5e1", marginLeft: 8 }}>
                    {player.total} pts
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── Lanterna ──────────────────────────────────────────────────── */}
        {last && (
          <div style={{ padding: "10px 28px 0" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "#1a0808",
                borderRadius: 14,
                padding: "9px 14px",
                border: "1px solid #7f1d1d33",
              }}
            >
              <span style={{ fontSize: 16, width: 28, flexShrink: 0 }}>🔦</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#f87171", marginLeft: 6 }}>
                {ranking.length}º {last.name}
              </span>
              <ChangeTag change={positionChanges?.get(last.id)} />
              <span style={{ fontSize: 13, fontWeight: 800, color: "#f87171", marginLeft: 8 }}>
                {last.total} pts
              </span>
            </div>
          </div>
        )}

        {/* ── Destaques da Rodada ────────────────────────────────────────── */}
        {insights.length > 0 && (
          <Section label="💬 Destaques da Rodada">
            <div
              style={{
                margin: "0 28px",
                background: "#1e293b",
                borderRadius: 14,
                overflow: "hidden",
                border: "1px solid #273449",
              }}
            >
              {insights.map((ins, i) => (
                <div
                  key={`${ins.emoji}-${i}`}
                  style={{
                    padding: "8px 14px",
                    fontSize: 12,
                    display: "flex",
                    gap: 8,
                    alignItems: "flex-start",
                    borderBottom: i < insights.length - 1 ? "1px solid #1e2d42" : "none",
                    color: "#94a3b8",
                  }}
                >
                  <span style={{ flexShrink: 0 }}>{ins.emoji}</span>
                  <span>{ins.text}</span>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    );
  }
);
