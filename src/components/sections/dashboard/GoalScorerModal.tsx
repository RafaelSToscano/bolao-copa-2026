"use client";

import { useEffect } from "react";
import { getFlagCode } from "@/lib/formatting";

const AUTO_DISMISS_MS = 5_000;

interface GoalScorerModalProps {
  team: string | null;
  onClose: () => void;
}

export function GoalScorerModal({ team, onClose }: GoalScorerModalProps) {
  useEffect(() => {
    if (!team) return;
    const t = setTimeout(onClose, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [team, onClose]);

  if (!team) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Gol para ${team}`}
      onClick={onClose}
      className="goal-scorer-modal fixed left-0 right-0 top-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm cursor-pointer"
      style={{
        // 100dvh = dynamic viewport height (collapses with mobile address bar);
        // fallback to 100vh for browsers without dvh support.
        height: "100dvh",
        minHeight: "100vh",
      }}
    >
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute top-6 right-6 text-white/70 hover:text-white text-3xl font-black w-12 h-12 rounded-full bg-slate-900/80 border border-slate-700 flex items-center justify-center"
      >
        ×
      </button>

      <div
        className="flex flex-col items-center text-center px-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* High-resolution flag — bypasses the standard Flag
            component's `w40` source and requests `w640` so the image
            stays crisp at modal sizes. Uses srcset to scale up further
            on retina displays. */}
        {(() => {
          const code = getFlagCode(team);
          if (!code) return null;
          return (
            <img
              src={`https://flagcdn.com/w640/${code}.png`}
              srcSet={`https://flagcdn.com/w640/${code}.png 1x, https://flagcdn.com/w1280/${code}.png 2x, https://flagcdn.com/w2560/${code}.png 3x`}
              alt={team}
              width={216}
              height={144}
              className="rounded-xl object-cover mb-8"
              style={{
                width: "216px",
                height: "144px",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
              }}
            />
          );
        })()}

        <div className="text-3xl md:text-5xl font-black text-white tracking-tight mb-6">
          {team}
        </div>

        <div
          className="text-5xl md:text-8xl font-black text-yellow-400"
          style={{
            textShadow:
              "0 0 30px rgba(250, 204, 21, 0.5), 0 0 60px rgba(245, 158, 11, 0.4), 0 6px 0 #1f2937",
          }}
        >
          GOOOOAL!
        </div>
      </div>

      <style jsx>{`
        .goal-scorer-modal {
          animation: scorer-fade-in 0.3s ease-out;
        }
        @keyframes scorer-fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .goal-scorer-modal {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
