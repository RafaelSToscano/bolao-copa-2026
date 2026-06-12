"use client";

import { Player } from "@/types/player";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Trophy,
  BarChart3,
  Lock,
  LogOut,
  Calculator,
  BookOpen,
  GitBranch,
  MessageSquare,
} from "lucide-react";
import { DeadlineBanner, LockedBanner } from "@/components/ui/DeadlineBanner";

type TabType =
  | "palpites"
  | "classificacao"
  | "matamata"
  | "ranking"
  | "simulador"
  | "regras"
  | "playoff"
  | "admin";

interface AppLayoutProps {
  currentUser: Player;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onLogout: () => void;
  children: React.ReactNode;
  userCompletion: number;
}

export function AppLayout({
  currentUser,
  activeTab,
  onTabChange,
  onLogout,
  children,
  userCompletion,
}: AppLayoutProps) {
  const menuItems = [
    {
      id: "palpites" as TabType,
      label: "Palpites",
      icon: Shield,
    },
    {
      id: "classificacao" as TabType,
      label: "Classificação",
      icon: Trophy,
    },
    {
      id: "matamata" as TabType,
      label: "Mata-mata",
      icon: Trophy,
    },
    {
      id: "ranking" as TabType,
      label: "Ranking",
      icon: BarChart3,
    },
    {
      id: "simulador" as TabType,
      label: "Simulador",
      icon: Calculator,
    },
    {
     id: "playoff" as TabType,
     label: "Palpites da Galera",
    icon: MessageSquare,
    },
    {
      id: "regras" as TabType,
      label: "Regras",
      icon: BookOpen,
    },
    ...(currentUser.is_admin
      ? [
          {
            id: "admin" as TabType,
            label: "Admin",
            icon: Lock,
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <LockedBanner />
      <DeadlineBanner
        userCompletion={userCompletion}
        onGoToPredictions={() => {
          const alreadyThere = activeTab === "palpites";
          if (!alreadyThere) onTabChange("palpites");
          setTimeout(
            () => document.getElementById("group-predictions")?.scrollIntoView({ behavior: "smooth" }),
            alreadyThere ? 0 : 150
          );
        }}
      />

      {/* MOBILE HEADER */}
      <div className="lg:hidden bg-gradient-to-r from-blue-900 via-slate-900 to-emerald-900 border-b border-slate-800 pt-9">
        <div className="p-4 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/brand/bolao-logo.jpg"
              alt="Bolão Copa 2026"
              className="h-14 w-14 rounded-2xl object-cover shadow-lg"
            />

            <div>
              <h1 className="text-2xl font-black tracking-tight">
                Bolão Copa 2026
              </h1>
              <p className="text-slate-300 text-sm">
                Bem-vindo, {currentUser.name}
              </p>
            </div>
          </div>

          <Button
            variant="secondary"
            onClick={onLogout}
            className="w-full bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 rounded-2xl h-14 font-bold shadow-lg"
          >
            <LogOut className="mr-2" size={18} />
            Sair
          </Button>
        </div>
      </div>

      <div className="lg:flex">
        {/* DESKTOP SIDEBAR */}
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
                const active = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left font-bold transition ${
                      active
                        ? "bg-yellow-500 text-slate-950"
                        : "bg-slate-900/70 text-slate-300 hover:bg-slate-800 border border-slate-800"
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </button>
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

        {/* MOBILE TABS */}
        <main className="lg:hidden max-w-7xl mx-auto p-4 md:p-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;

              return (
                <Button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={
                    active
                      ? "bg-yellow-500 text-slate-950 hover:bg-yellow-400 font-bold"
                      : "bg-slate-900 border border-slate-800 text-white hover:bg-slate-800"
                  }
                >
                  <Icon className="mr-2" size={16} />
                  {item.label}
                </Button>
              );
            })}
          </div>

          {children}
        </main>

        {/* DESKTOP CONTENT */}
        <main className="hidden lg:block ml-72 w-[calc(100%-18rem)] min-h-screen">
          <div className="pt-14 p-8 space-y-6 max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}