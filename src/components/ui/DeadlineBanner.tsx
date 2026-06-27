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

// ── Banner state machine ──────────────────────────────────────────────────────

type BannerMode =
  | { mode: "open"; phase: KnockoutPhase }
  | { mode: "blocked"; nextPhase: KnockoutPhase }
  | { mode: "done" }
  | null;

function computeBannerMode(now: number): BannerMode {
  if (now < GROUPS_PHASE_DEADLINE.getTime()) return null; // DeadlineBanner handles this

  for (const phase of KNOCKOUT_PHASES) {
    if (now < phase.opensAt.getTime()) return { mode: "blocked", nextPhase: phase };
    if (now < phase.deadline.getTime()) return { mode: "open", phase };
  }

  return { mode: "done" };
}

function dismissKey(bm: Exclude<BannerMode, null | { mode: "done" }>): string {
  return bm.mode === "open"
    ? `bolao_open_${bm.phase.name}`
    : `bolao_blocked_${bm.nextPhase.name}`;
}

// ── Groups-phase countdown banner ─────────────────────────────────────────────

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
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-3 px-4 py-2 text-white text-sm font-bold shadow-lg ${
        urgency ? "bg-red-900/90 animate-pulse" : "bg-red-950/90"
      }`}
    >
      <BlinkingAlert />
      <span>
        Prazo para palpites encerra em{" "}
        {days > 0 && <span className="tabular-nums">{days}d </span>}
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

// ── Knockout-phase banner (open / blocked) ────────────────────────────────────

interface LockedBannerProps {
  onGoToPlayoff?: () => void;
}

export function LockedBanner({ onGoToPlayoff }: LockedBannerProps) {
  const [bannerMode, setBannerMode] = useState<BannerMode>(null);
  const [visible, setVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState<ReturnType<typeof getTimeLeft>>(null);

  useEffect(() => {
    const bm = computeBannerMode(Date.now());
    if (!bm || bm.mode === "done") return;

    const key = dismissKey(bm);
    if (sessionStorage.getItem(key) === "1") return;

    setBannerMode(bm);
    setVisible(true);

    if (bm.mode === "open") {
      setTimeLeft(getTimeLeft(bm.phase.deadline));
      const id = setInterval(() => {
        const tl = getTimeLeft(bm.phase.deadline);
        setTimeLeft(tl);
        if (!tl) setVisible(false); // auto-hide when deadline passes
      }, 1000);
      return () => clearInterval(id);
    }
  }, []);

  const dismiss = () => {
    if (!bannerMode || bannerMode.mode === "done") return;
    sessionStorage.setItem(dismissKey(bannerMode), "1");
    setVisible(false);
  };

  if (!visible || !bannerMode || bannerMode.mode === "done") return null;

  // ── "Predictions open" banner ──
  if (bannerMode.mode === "open") {
    const urgency = timeLeft ? timeLeft.days === 0 && timeLeft.hours < 1 : false;
    return (
      <div
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-3 px-4 py-2 text-white text-sm font-bold shadow-lg ${
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

  // ── "Predictions blocked" banner ──
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-3 px-4 py-2 bg-slate-800/95 border-b border-slate-700 text-white text-sm font-bold shadow-lg">
      <div className="flex items-center gap-2 min-w-0">
        <Lock size={15} className="shrink-0 text-yellow-400" />
        <span className="truncate">
          Palpites bloqueados —{" "}
          <span className="text-yellow-400">
            voltam {bannerMode.nextPhase.opensAtLabel}
          </span>
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
