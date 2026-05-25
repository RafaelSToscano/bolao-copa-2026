"use client";

import { Player } from "@/types/player";
import { Button } from "@/components/ui/button";
import { Shield, Trophy, BarChart3, Lock, LogOut } from "lucide-react";

type TabType = "palpites" | "classificacao" | "matamata" | "ranking" | "admin";

interface AppLayoutProps {
  currentUser: Player;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export function AppLayout({
  currentUser,
  activeTab,
  onTabChange,
  onLogout,
  children,
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-emerald-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto p-4 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <img
                src="/brand/bolao-logo.jpg"
                alt="Bolão Copa 2026"
                className="h-14 w-14 rounded-2xl object-cover shadow-lg"
              />

              <div>
                <h1 className="text-2xl md:text-4xl font-black tracking-tight">
                  Bolão Copa 2026
                </h1>
                <p className="text-slate-300 text-sm">
                  Bem-vindo, {currentUser.name}
                </p>
              </div>
            </div>
          </div>

          <Button
            variant="secondary"
            onClick={onLogout}
            className="bg-white/10 text-white hover:bg-white/20 border border-white/10"
          >
            <LogOut className="mr-2" size={16} />
            Sair
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Button
            onClick={() => onTabChange("palpites")}
            className={
              activeTab === "palpites"
                ? "bg-yellow-500 text-slate-950 hover:bg-yellow-400 font-bold"
                : "bg-slate-900 border border-slate-800 text-white hover:bg-slate-800"
            }
          >
            <Shield className="mr-2" size={16} />
            Palpites
          </Button>

          <Button
            onClick={() => onTabChange("classificacao")}
            className={
              activeTab === "classificacao"
                ? "bg-yellow-500 text-slate-950 hover:bg-yellow-400 font-bold"
                : "bg-slate-900 border border-slate-800 text-white hover:bg-slate-800"
            }
          >
            <Trophy className="mr-2" size={16} />
            Classificação
          </Button>

          <Button
            onClick={() => onTabChange("matamata")}
            className={
              activeTab === "matamata"
                ? "bg-yellow-500 text-slate-950 hover:bg-yellow-400 font-bold"
                : "bg-slate-900 border border-slate-800 text-white hover:bg-slate-800"
            }
          >
            <Trophy className="mr-2" size={16} />
            Mata-mata
          </Button>

          <Button
            onClick={() => onTabChange("ranking")}
            className={
              activeTab === "ranking"
                ? "bg-yellow-500 text-slate-950 hover:bg-yellow-400 font-bold"
                : "bg-slate-900 border border-slate-800 text-white hover:bg-slate-800"
            }
          >
            <BarChart3 className="mr-2" size={16} />
            Ranking
          </Button>

          {currentUser.is_admin && (
            <Button
              onClick={() => onTabChange("admin")}
              className={
                activeTab === "admin"
                  ? "bg-yellow-500 text-slate-950 hover:bg-yellow-400 font-bold"
                  : "bg-slate-900 border border-slate-800 text-white hover:bg-slate-800"
              }
            >
              <Lock className="mr-2" size={16} />
              Admin
            </Button>
          )}
        </div>

        {/* Content */}
        {children}
      </main>
    </div>
  );
}
