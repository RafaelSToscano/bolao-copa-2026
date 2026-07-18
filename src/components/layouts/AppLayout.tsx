"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Player } from "@/types/player";
import { Button } from "@/components/ui/button";
import {
  Home,
  Shield,
  Trophy,
  BarChart3,
  Lock,
  LogOut,
  Calculator,
  BookOpen,
  MessageSquare,
  History,
  Menu,
  X,
} from "lucide-react";
import { DeadlineBanner, LockedBanner } from "@/components/ui/DeadlineBanner";
import { SuspenseModeScreen } from "@/components/ui/SuspenseModeScreen";

interface MenuItem {
  href: string;
  label: string;
  icon: typeof Home;
}

interface AppLayoutProps {
  currentUser: Player;
  onLogout: () => void;
  children: React.ReactNode;
  userCompletion: number;
  suspenseMode?: boolean;
  suspenseMessage?: string | null;
}

export function AppLayout({
  currentUser,
  onLogout,
  children,
  userCompletion,
  suspenseMode = false,
  suspenseMessage = null,
}: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const blockedRoutes = new Set([
    "/",
    "/ranking",
    "/historico",
    "/simulador",
    "/classificacao",
  ]);
  const suspenseActive =
    suspenseMode && !currentUser.is_admin && blockedRoutes.has(pathname);
  const pageContent = suspenseActive ? (
    <SuspenseModeScreen message={suspenseMessage} />
  ) : (
    children
  );


  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  useEffect(() => {
    setDrawerOpen((open) => (open ? false : open));
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const menuItems: MenuItem[] = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/palpites", label: "Palpites", icon: Shield },
    { href: "/mata-mata", label: "Mata-mata", icon: Trophy },
    { href: "/ranking", label: "Ranking", icon: BarChart3 },
    { href: "/historico", label: "Histórico", icon: History },
    { href: "/simulador", label: "Simulador", icon: Calculator },
    { href: "/palpites-da-galera", label: "Palpites da Galera", icon: MessageSquare },
    { href: "/classificacao", label: "Classificação", icon: Trophy },
    { href: "/regras", label: "Regras", icon: BookOpen },
    ...(currentUser.is_admin
      ? [{ href: "/admin", label: "Admin", icon: Lock }]
      : []),
  ];

  const goToPredictions = () => {
    if (pathname === "/palpites") {
      document
        .getElementById("group-predictions")
        ?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    router.push("/palpites?focus=group-predictions");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <LockedBanner onGoToPlayoff={() => router.push("/palpites")} />
      <DeadlineBanner
        userCompletion={userCompletion}
        onGoToPredictions={goToPredictions}
      />

      <header className="lg:hidden sticky top-0 z-30 bg-slate-950/95 backdrop-blur border-b border-slate-800">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            aria-label="Abrir menu"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-white hover:bg-slate-800"
          >
            <Menu size={20} />
          </button>

          <Link
            href="/"
            aria-label="Ir para o dashboard"
            className="flex items-center gap-3 flex-1 min-w-0 rounded-xl"
          >
            <img
              src="/brand/bolao-logo.jpg"
              alt="Bolão Copa 2026"
              className="h-9 w-9 rounded-xl object-cover shadow shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-black tracking-tight truncate">
                Bolão Copa 2026
              </h1>
              <p className="text-slate-400 text-xs truncate">
                Olá, {currentUser.name}
              </p>
            </div>
          </Link>
        </div>
      </header>

      {drawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navegação"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm app-drawer-fade"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="relative ml-0 mr-auto h-full w-[85vw] max-w-sm bg-slate-950 border-r border-slate-800 flex flex-col app-drawer-slide">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src="/brand/bolao-logo.jpg"
                  alt="Bolão Copa 2026"
                  className="h-12 w-12 rounded-2xl object-cover shadow-lg shrink-0"
                />
                <div className="min-w-0">
                  <h2 className="text-lg font-black truncate">Bolão Copa 2026</h2>
                  <p className="text-slate-400 text-xs truncate">
                    Olá, {currentUser.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setDrawerOpen(false)}
                className="ml-2 flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left font-bold transition ${
                      active
                        ? "bg-yellow-500 text-slate-950"
                        : "bg-slate-900/70 text-slate-300 hover:bg-slate-800 border border-slate-800"
                    }`}
                  >
                    <Icon size={18} />
                    <span className="flex-1">{item.label}</span>
                    {suspenseMode && !currentUser.is_admin && blockedRoutes.has(item.href) && (
                      <Lock size={14} className="opacity-70" />
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-800">
              <Button
                variant="secondary"
                onClick={onLogout}
                className="w-full bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 rounded-2xl h-12 font-bold"
              >
                <LogOut className="mr-2" size={18} />
                Sair
              </Button>
            </div>

            <style jsx>{`
              .app-drawer-fade {
                animation: drawer-fade-in 0.2s ease-out;
              }
              .app-drawer-slide {
                animation: drawer-slide-in 0.25s cubic-bezier(0.32, 0.72, 0, 1);
              }
              @keyframes drawer-fade-in {
                from {
                  opacity: 0;
                }
                to {
                  opacity: 1;
                }
              }
              @keyframes drawer-slide-in {
                from {
                  transform: translateX(-100%);
                }
                to {
                  transform: translateX(0);
                }
              }
              @media (prefers-reduced-motion: reduce) {
                .app-drawer-fade,
                .app-drawer-slide {
                  animation: none;
                }
              }
            `}</style>
          </aside>
        </div>
      )}

      <div className="lg:flex">
        <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-72 bg-slate-950 border-r border-slate-800 pt-14 pb-6 px-6 flex-col justify-between">
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <img
                src="/brand/bolao-logo.jpg"
                alt="Bolão Copa 2026"
                className="mx-auto h-20 w-20 rounded-2xl object-cover shadow-lg"
              />

              <div>
                <h1 className="text-2xl font-black leading-tight">
                  Bolão Copa 2026
                </h1>
                <p className="text-slate-400 text-sm">
                  Bem-vindo, {currentUser.name}
                </p>
              </div>
            </div>

            <nav className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left font-bold transition ${
                      active
                        ? "bg-yellow-500 text-slate-950"
                        : "bg-slate-900/70 text-slate-300 hover:bg-slate-800 border border-slate-800"
                    }`}
                  >
                    <Icon size={18} />
                    <span className="flex-1">{item.label}</span>
                    {suspenseMode && !currentUser.is_admin && blockedRoutes.has(item.href) && (
                      <Lock size={14} className="opacity-70" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <Button
            variant="secondary"
            onClick={onLogout}
            className="w-full bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 rounded-2xl h-14 font-bold shadow-lg"
          >
            <LogOut className="mr-2" size={18} />
            Sair
          </Button>
        </aside>

        <main className="lg:hidden max-w-7xl mx-auto p-4 md:p-6 space-y-6">
          {pageContent}
        </main>

        <main className="hidden lg:block ml-72 w-[calc(100%-18rem)] min-h-screen">
          <div className="pt-14 p-8 space-y-6 max-w-[1600px] mx-auto">
            {pageContent}
          </div>
        </main>
      </div>
    </div>
  );
}