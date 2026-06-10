"use client";

import { useState, useEffect } from "react";
import { GROUPS_PHASE_DEADLINE } from "@/config/scoring";
import { AlertTriangle } from "lucide-react";

function BlinkingAlert() {
  return <AlertTriangle size={16} className="shrink-0 animate-blink" />;
}

function getTimeLeft() {
  const diff = GROUPS_PHASE_DEADLINE.getTime() - Date.now();
  if (diff <= 0) return null;

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

interface DeadlineBannerProps {
  userCompletion: number;
  onGoToPredictions: () => void;
}

export function DeadlineBanner({ userCompletion, onGoToPredictions }: DeadlineBannerProps) {
  const [timeLeft, setTimeLeft] = useState<ReturnType<typeof getTimeLeft>>(null);

  useEffect(() => {
    setTimeLeft(getTimeLeft());
    const id = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!timeLeft) return null;

  const { days, hours, minutes, seconds } = timeLeft;
  const urgency = days === 0 && hours < 3;
  const actionLabel = userCompletion === 0
    ? "Preencher palpites"
    : userCompletion < 100
    ? "Revisar palpites"
    : "Ver meus palpites";

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-3 px-4 py-2 text-white text-sm font-bold shadow-lg ${
        urgency ? "bg-red-900/90 animate-pulse" : "bg-red-950/90"
      }`}
    >
      <BlinkingAlert />

      <span>
        Prazo para palpites encerra em{" "}
        {days > 0 && (
          <span className="tabular-nums">{days}d </span>
        )}
        <span className="tabular-nums tracking-widest">
          {pad(hours)}:{pad(minutes)}:{pad(seconds)}
        </span>
      </span>

      <button
        onClick={onGoToPredictions}
        className="ml-2 rounded-lg bg-white/20 hover:bg-white/30 px-3 py-1 text-xs font-black transition shrink-0 cursor-pointer"
      >
        {actionLabel} →
      </button>
    </div>
  );
}
