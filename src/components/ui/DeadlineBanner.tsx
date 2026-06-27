"use client";

import { useState, useEffect } from "react";
import { GROUPS_PHASE_DEADLINE, PLAYOFFS_AVOS_DEADLINE } from "@/config/scoring";
import { AlertTriangle, Lock, Trophy, X } from "lucide-react";

const LOCKED_BANNER_KEY = "bolao_locked_banner_dismissed";
const PLAYOFF_OPEN_BANNER_KEY = "bolao_playoff_open_banner_dismissed_v2";

function BlinkingAlert() {
  return <AlertTriangle size={16} className="shrink-0 animate-blink" />;
}

function getTimeLeft(deadline: Date) {
  const diff = deadline.getTime() - Date.now();
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
    setTimeLeft(getTimeLeft(GROUPS_PHASE_DEADLINE));
    const id = setInterval(() => setTimeLeft(getTimeLeft(GROUPS_PHASE_DEADLINE)), 1000);
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

interface LockedBannerProps {
  onGoToPlayoff?: () => void;
}

export function LockedBanner({ onGoToPlayoff }: LockedBannerProps) {
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<"playoff-open" | "locked" | null>(null);
  const [timeLeft, setTimeLeft] = useState<ReturnType<typeof getTimeLeft>>(null);

  useEffect(() => {
    const now = Date.now();
    const groupsPassed = now > GROUPS_PHASE_DEADLINE.getTime();
    const playoffOpen = groupsPassed && now < PLAYOFFS_AVOS_DEADLINE.getTime();

    if (!groupsPassed) return;

    if (playoffOpen) {
      const dismissed = sessionStorage.getItem(PLAYOFF_OPEN_BANNER_KEY) === "1";
      if (!dismissed) {
        setMode("playoff-open");
        setVisible(true);
        setTimeLeft(getTimeLeft(PLAYOFFS_AVOS_DEADLINE));
        const id = setInterval(() => setTimeLeft(getTimeLeft(PLAYOFFS_AVOS_DEADLINE)), 1000);
        return () => clearInterval(id);
      }
    } else {
      const dismissed = sessionStorage.getItem(LOCKED_BANNER_KEY) === "1";
      if (!dismissed) {
        setMode("locked");
        setVisible(true);
      }
    }
  }, []);

  const dismiss = () => {
    const key = mode === "playoff-open" ? PLAYOFF_OPEN_BANNER_KEY : LOCKED_BANNER_KEY;
    sessionStorage.setItem(key, "1");
    setVisible(false);
  };

  if (!visible || !mode) return null;

  if (mode === "playoff-open") {
    const urgency = timeLeft ? timeLeft.days === 0 && timeLeft.hours < 3 : false;
    return (
      <div
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-3 px-4 py-2 text-white text-sm font-bold shadow-lg ${
          urgency ? "bg-yellow-700/95 animate-pulse" : "bg-yellow-800/95"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Trophy size={15} className="shrink-0 text-yellow-300" />
          <span className="truncate">
            Palpites dos{" "}
            <span className="text-yellow-300">16 avos de final</span>{" "}
            abertos!{" "}
            {timeLeft && (
              <span className="text-white/90">
                Prazo: dom 28/jun às 15h BRT —{" "}
                {timeLeft.days > 0 && <span className="tabular-nums">{timeLeft.days}d </span>}
                <span className="tabular-nums tracking-widest">
                  {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
                </span>
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onGoToPlayoff && (
            <button
              onClick={onGoToPlayoff}
              className="rounded-lg bg-white/20 hover:bg-white/30 px-3 py-1 text-xs font-black transition cursor-pointer"
            >
              Palpitar agora →
            </button>
          )}
          <button
            onClick={dismiss}
            aria-label="Fechar aviso"
            className="rounded-lg p-1 hover:bg-white/10 transition cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-3 px-4 py-2 bg-slate-800/95 border-b border-slate-700 text-white text-sm font-bold shadow-lg">
      <div className="flex items-center gap-2 min-w-0">
        <Lock size={15} className="shrink-0 text-yellow-400" />
        <span className="truncate">
          Palpites da fase de grupos encerrados.{" "}
          <span className="text-yellow-400">Playoffs encerrados.</span>
        </span>
      </div>
      <button
        onClick={dismiss}
        aria-label="Fechar aviso"
        className="shrink-0 rounded-lg p-1 hover:bg-white/10 transition cursor-pointer"
      >
        <X size={15} />
      </button>
    </div>
  );
}
