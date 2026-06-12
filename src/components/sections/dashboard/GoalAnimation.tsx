"use client";

import { useEffect, useState } from "react";

interface GoalAnimationProps {
  /** Trigger value — every change to this string fires the animation */
  trigger: string | null;
}

const BALL_COUNT = 24;
const ANIMATION_MS = 2200;

interface Ball {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  rotateTo: number;
}

function generateBalls(seed: string): Ball[] {
  const balls: Ball[] = [];
  for (let i = 0; i < BALL_COUNT; i++) {
    const phase =
      (i / BALL_COUNT + parseFloat("0." + seed.charCodeAt(i % seed.length))) % 1;
    balls.push({
      id: i,
      left: phase * 100,
      delay: (i * 60) % 800,
      duration: 1400 + ((i * 137) % 700),
      size: 28 + ((i * 13) % 28),
      rotateTo: ((i * 211) % 720) - 360,
    });
  }
  return balls;
}

interface ActiveAnimation {
  key: string;
  balls: Ball[];
}

export function GoalAnimation({ trigger }: GoalAnimationProps) {
  const [active, setActive] = useState<ActiveAnimation | null>(null);

  useEffect(() => {
    if (!trigger) return;
    const next: ActiveAnimation = { key: trigger, balls: generateBalls(trigger) };
    setActive(next);
    const t = setTimeout(() => {
      setActive((curr) => (curr?.key === next.key ? null : curr));
    }, ANIMATION_MS);
    return () => clearTimeout(t);
  }, [trigger]);

  if (!active) return null;

  return (
    <div
      className="goal-overlay pointer-events-none fixed left-0 right-0 top-0 z-50 overflow-hidden"
      style={{ height: "100dvh", minHeight: "100vh" }}
      aria-hidden="true"
    >
      <div className="goal-banner">
        <span>⚽ GOOOOL!</span>
      </div>
      {active.balls.map((ball) => (
        <span
          key={ball.id}
          className="goal-ball"
          style={{
            left: `${ball.left}%`,
            fontSize: `${ball.size}px`,
            animationDelay: `${ball.delay}ms`,
            animationDuration: `${ball.duration}ms`,
            ["--rotate-to" as string]: `${ball.rotateTo}deg`,
          }}
        >
          ⚽
        </span>
      ))}

      <style jsx>{`
        .goal-overlay {
          animation: goal-flash ${ANIMATION_MS}ms ease-out forwards;
        }

        @keyframes goal-flash {
          0% {
            background: radial-gradient(
              circle at center,
              rgba(245, 158, 11, 0.25),
              transparent 70%
            );
          }
          50% {
            background: radial-gradient(
              circle at center,
              rgba(245, 158, 11, 0.18),
              transparent 60%
            );
          }
          100% {
            background: transparent;
          }
        }

        .goal-banner {
          position: absolute;
          top: 35%;
          left: 50%;
          transform: translate(-50%, -50%) scale(0);
          color: #facc15;
          font-weight: 900;
          font-size: clamp(48px, 10vw, 120px);
          letter-spacing: 0.05em;
          text-shadow:
            0 0 20px rgba(250, 204, 21, 0.6),
            0 0 40px rgba(245, 158, 11, 0.4),
            0 4px 0 #1f2937;
          animation: goal-banner ${ANIMATION_MS}ms ease-out forwards;
        }

        @keyframes goal-banner {
          0% {
            transform: translate(-50%, -50%) scale(0) rotate(-12deg);
            opacity: 0;
          }
          15% {
            transform: translate(-50%, -50%) scale(1.3) rotate(8deg);
            opacity: 1;
          }
          25% {
            transform: translate(-50%, -50%) scale(1) rotate(-4deg);
            opacity: 1;
          }
          80% {
            transform: translate(-50%, -50%) scale(1) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(0.9) rotate(0deg);
            opacity: 0;
          }
        }

        .goal-ball {
          position: absolute;
          top: -15vh;
          animation-name: goal-ball-fall;
          animation-timing-function: cubic-bezier(0.55, 0, 0.6, 1);
          animation-fill-mode: forwards;
        }

        /* Wave physics: balls fall, bounce off the floor twice with
           progressively dampened amplitudes, then settle at the bottom
           edge before fading out. */
        @keyframes goal-ball-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          5% {
            opacity: 1;
          }
          35% {
            transform: translateY(105vh) rotate(calc(var(--rotate-to) * 0.55));
          }
          50% {
            transform: translateY(70vh) rotate(calc(var(--rotate-to) * 0.7));
          }
          65% {
            transform: translateY(105vh) rotate(calc(var(--rotate-to) * 0.85));
          }
          80% {
            transform: translateY(90vh) rotate(var(--rotate-to));
          }
          92% {
            transform: translateY(105vh) rotate(var(--rotate-to));
            opacity: 1;
          }
          100% {
            transform: translateY(105vh) rotate(var(--rotate-to));
            opacity: 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .goal-overlay,
          .goal-banner,
          .goal-ball {
            animation: none;
          }
          .goal-ball {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
