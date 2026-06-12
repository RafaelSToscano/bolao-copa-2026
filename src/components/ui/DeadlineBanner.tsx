"use client";

import { useState, useEffect } from "react";
import { GROUPS_PHASE_DEADLINE } from "@/config/scoring";
import { AlertTriangle, Lock, X } from "lucide-react";

const LOCKED_BANNER_KEY = "bolao_locked_banner_dismissed";

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

const LOCKED_BANNER_AUTO_DISMISS_MS = 10_000;

export function LockedBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const passed = Date.now() > GROUPS_PHASE_DEADLINE.getTime();
    const dismissed = sessionStorage.getItem(LOCKED_BANNER_KEY) === "1";
    setVisible(passed && !dismissed);
  }, []);

  // Auto-dismiss after 10s so the banner doesn't permanently steal
  // viewport space. Persists the dismissal in sessionStorage like the
  // manual close button does, so the same tab won't re-show it.
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => {
      sessionStorage.setItem(LOCKED_BANNER_KEY, "1");
      setVisible(false);
    }, LOCKED_BANNER_AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [visible]);

  const dismiss = () => {
    sessionStorage.setItem(LOCKED_BANNER_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-3 px-4 py-2 bg-slate-800/95 border-b border-slate-700 text-white text-sm font-bold shadow-lg">
      <div className="flex items-center gap-2 min-w-0">
        <Lock size={15} className="shrink-0 text-yellow-400" />
        <span className="truncate">
          Palpites da fase de grupos encerrados.{" "}
          <span className="text-yellow-400">Playoffs abrem em 28 de junho.</span>
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
