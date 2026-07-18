"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EyeOff, MessageSquare, Shield, Trophy } from "lucide-react";

interface SuspenseModeScreenProps {
  message?: string | null;
}

export function SuspenseModeScreen({ message }: SuspenseModeScreenProps) {
  const router = useRouter();

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-yellow-400/20 bg-gradient-to-br from-slate-900 via-slate-950 to-black px-5 py-12 text-center shadow-2xl md:px-10 md:py-16">
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-yellow-400/20 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl space-y-7">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-yellow-400/30 bg-yellow-400/10 text-yellow-300 shadow-xl">
          <EyeOff size={38} />
        </div>

        <div className="space-y-3">
          <div className="text-xs font-black uppercase tracking-[0.35em] text-yellow-300">
            Bolão Copa 2026
          </div>
          <h2 className="text-4xl font-black tracking-tight text-white md:text-6xl">
            Modo Suspense ativado
          </h2>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg">
            {message ||
              "O ranking e as estatísticas estão temporariamente ocultos para preservar a emoção desta reta final. O resultado oficial será divulgado após a grande final."}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <Trophy className="mx-auto mb-2 text-yellow-300" size={22} />
            <div className="font-black text-white">Ranking oculto</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <Shield className="mx-auto mb-2 text-blue-300" size={22} />
            <div className="font-black text-white">Palpites liberados</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <MessageSquare className="mx-auto mb-2 text-emerald-300" size={22} />
            <div className="font-black text-white">Galera visível</div>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button
            onClick={() => router.push("/palpites")}
            className="h-12 rounded-2xl bg-yellow-400 px-6 font-black text-slate-950 hover:bg-yellow-300"
          >
            Fazer meus palpites
          </Button>
          <Button
            onClick={() => router.push("/palpites-da-galera")}
            className="h-12 rounded-2xl border border-slate-700 bg-slate-900 px-6 font-black text-white hover:bg-slate-800"
          >
            Ver Palpites da Galera
          </Button>
        </div>
      </div>
    </div>
  );
}
