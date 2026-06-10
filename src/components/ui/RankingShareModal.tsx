"use client";

import { useRef, useState, useEffect } from "react";
import { toPng } from "html-to-image";
import { Player } from "@/types/player";
import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";
import { RankingShareCard } from "./RankingShareCard";
import { generateRoundInsights } from "@/utils/roundInsights";
import { calculatePositionChanges } from "@/services/ranking/leaderboardCalculations";
import { Button } from "./button";
import { Download, Share2, X, Loader2 } from "lucide-react";

const WA_GROUP_LINK = "https://chat.whatsapp.com/BlFvuzUh0imESvzXvR8UOB";

interface RankingShareModalProps {
  ranking: (Player & { total: number; exacts: number })[];
  games: Game[];
  predictions: Prediction[];
  players: Player[];
  onClose: () => void;
}

function formatDate(d: Date) {
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function RankingShareModal({
  ranking,
  games,
  predictions,
  players,
  onClose,
}: RankingShareModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [capturing, setCapturing] = useState(false);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const insights = generateRoundInsights(games, predictions, players);
  const positionChanges = calculatePositionChanges(ranking, games, predictions, players);
  const date = formatDate(new Date());

  useEffect(() => {
    const timer = setTimeout(() => captureCard(), 200);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function captureCard() {
    if (!cardRef.current) return;
    setCapturing(true);
    setError(null);
    try {
      const url = await toPng(cardRef.current, {
        pixelRatio: 2,
        backgroundColor: "#0f172a",
      });
      setDataUrl(url);
    } catch {
      setError("Não foi possível gerar a imagem. Tente novamente.");
    } finally {
      setCapturing(false);
    }
  }

  async function handleShare() {
    if (!dataUrl) return;
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], "ranking-bolao.png", { type: "image/png" });

    if (
      typeof navigator.share === "function" &&
      navigator.canShare?.({ files: [file] })
    ) {
      try {
        await navigator.share({
          files: [file],
          title: "Ranking Bolão Copa 2026",
          text: "Ranking atualizado do Bolão Copa 2026 🏆",
        });
        return;
      } catch {
        // user cancelled or share failed — fall through
      }
    }

    // Fallback: download + open WhatsApp
    handleDownload();
    window.open(WA_GROUP_LINK, "_blank", "noopener,noreferrer");
  }

  function handleDownload() {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `ranking-bolao-${new Date().toISOString().slice(0, 10)}.png`;
    a.click();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <div>
            <h3 className="text-lg font-black text-white">Compartilhar Ranking</h3>
            <p className="text-slate-400 text-xs">
              {capturing ? "Gerando imagem…" : dataUrl ? "Pronto para compartilhar" : "Prévia do card"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 hover:bg-slate-800 transition cursor-pointer text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Preview / loading */}
        <div className="overflow-y-auto flex-1 p-6 flex flex-col items-center gap-4">
          {capturing && (
            <div className="flex items-center gap-2 text-slate-400 py-8">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm">Gerando imagem…</span>
            </div>
          )}

          {!capturing && dataUrl && (
            <img
              src={dataUrl}
              alt="Card de ranking"
              className="w-full rounded-2xl border border-slate-700 shadow-xl"
            />
          )}

          {!capturing && error && (
            <div className="text-red-400 text-sm text-center py-4">{error}</div>
          )}

          {/* Hidden card used for capture */}
          <div style={{ position: "absolute", left: -9999, top: 0, pointerEvents: "none" }}>
            <RankingShareCard
              ref={cardRef}
              ranking={ranking}
              insights={insights}
              date={date}
              positionChanges={positionChanges}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-6 py-4 border-t border-slate-800 flex gap-3 shrink-0">
          {error && (
            <Button
              onClick={captureCard}
              disabled={capturing}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold border border-slate-600"
            >
              Tentar novamente
            </Button>
          )}

          <Button
            onClick={handleDownload}
            disabled={!dataUrl || capturing}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold gap-2 border border-slate-600"
          >
            <Download size={16} />
            Baixar imagem
          </Button>

          <Button
            onClick={handleShare}
            disabled={!dataUrl || capturing}
            className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold gap-2"
          >
            <Share2 size={16} />
            Compartilhar no WhatsApp
          </Button>
        </div>
      </div>
    </div>
  );
}
