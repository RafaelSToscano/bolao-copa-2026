"use client";

import { useState, useEffect } from "react";
import { GROUPS_PHASE_DEADLINE, KNOCKOUT_PHASES, type KnockoutPhase } from "@/config/scoring";
import { AlertTriangle, Lock, Trophy, X } from "lucide-react";

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

type BannerMode =
  | { mode: "open"; phase: KnockoutPhase }
  | { mode: "blocked"; nextPhase: KnockoutPhase }
  | { mode: "done" }
  | null;

function computeBannerMode(now: number): BannerMode {
  if (now < GROUPS_PHASE_DEADLINE.getTime()) return null;

  for (const phase of KNOCKOUT_PHASES) {
    if (now < phase.opensAt.getTime()) return { mode: "blocked", nextPhase: phase };
    if (now < phase.deadline.getTime()) return { mode: "open", phase };
  }

  return { mode: "done" };
}

function blockedDismissKey(nextPhase: KnockoutPhase): string {
  return `bolao_blocked_${nextPhase.name}`;
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
  const actionLabel =
    userCompletion === 0
      ? "Preencher palpites"
      : userCompletion < 100
        ? "Revisar palpites"
        : "Ver meus palpites";

  return (
    <div
      className={`fixed left-0 right-0 top-[56px] md:top-0 z-30 flex items-center justify-center gap-2 px-3 py-2 text-white text-xs md:text-sm font-bold shadow-lg ${
        urgency ? "bg-red-900/90 animate-pulse" : "bg-red-950/90"
      }`}
    >
      <BlinkingAlert />
      <span className="truncate">
        Prazo para palpites encerra em{" "}
        {days > 0 && <span className="tabular-nums">{days}d </span>}
        <span className="tabular-nums tracking-widest">
          {pad(hours)}:{pad(minutes)}:{pad(seconds)}
        </span>
      </span>
      <button
        onClick={onGoToPredictions}
        className="ml-1 rounded-lg bg-white/20 hover:bg-white/30 px-2 md:px-3 py-1 text-[11px] md:text-xs font-black transition shrink-0 cursor-pointer"
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
  const [bannerMode, setBannerMode] = useState<BannerMode>(null);
  const [visible, setVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState<ReturnType<typeof getTimeLeft>>(null);

  useEffect(() => {
    function tick() {
      const bm = computeBannerMode(Date.now());

      if (!bm || bm.mode !== "open") {
        setVisible(false);
        setBannerMode(null);
        setTimeLeft(null);
        return;
      }

      setBannerMode(bm);
      setVisible(true);
      setTimeLeft(getTimeLeft(bm.phase.deadline));
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (!visible || !bannerMode || bannerMode.mode !== "open") return null;

  const urgency = timeLeft ? timeLeft.days === 0 && timeLeft.hours < 1 : false;

  return (
    <div
      className={`fixed left-0 right-0 top-[56px] md:top-0 z-30 flex items-center justify-between gap-2 px-3 md:px-4 py-2 text-white text-xs md:text-sm font-bold shadow-lg ${
        urgency ? "bg-yellow-700/95 animate-pulse" : "bg-yellow-800/95"
      }`}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Trophy size={15} className="shrink-0 text-yellow-300" />
        <span className="truncate">
          Palpites{" "}
          <span className="text-yellow-300">{bannerMode.phase.name}</span>{" "}
          abertos!{" "}
          {timeLeft && (
            <span className="text-white/90">
              Prazo: {bannerMode.phase.deadlineLabel} —{" "}
              {timeLeft.days > 0 && (
                <span className="tabular-nums">{timeLeft.days}d </span>
              )}
              <span className="tabular-nums tracking-widest">
                {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
              </span>
            </span>
          )}
        </span>
      </div>

      {onGoToPlayoff && (
        <button
          onClick={onGoToPlayoff}
          className="shrink-0 rounded-lg bg-white/20 hover:bg-white/30 px-2 md:px-3 py-1 text-[11px] md:text-xs font-black transition cursor-pointer"
        >
          Palpitar agora →
        </button>
      )}
    </div>
  );
}