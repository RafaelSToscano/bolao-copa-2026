"use client";

import { Card, CardContent } from "@/components/ui/card";

export function RulesSection() {
  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 text-white rounded-3xl shadow-2xl">
        <CardContent className="p-6 lg:p-8 space-y-6">
          <div>
            <h2 className="text-4xl lg:text-5xl font-black tracking-tight">
              Regras do Bolão
            </h2>

            <p className="text-slate-300 text-lg lg:text-xl mt-3">
              Resumo das principais regras do Bolão Copa 2026.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RuleCard title="💰 Inscrição" text="Valor de R$ 30,00 por participante. O valor arrecadado será destinado integralmente à premiação." />

            <RuleCard title="⏳ Prazo" text="Os palpites da fase de grupos e os palpites finais devem ser preenchidos até 10/06/2026 às 23h59." />

            <RuleCard title="📱 Plataforma oficial" text="Todos os palpites devem ser feitos exclusivamente pelo app. Palpites enviados por WhatsApp, e-mail ou mensagem privada não serão aceitos." />

            <RuleCard title="🎲 Palpites aleatórios" text="O participante pode usar a geração automática de palpites, mas é responsável por revisar e confirmar tudo antes do prazo." />

            <RuleCard title="🥇 Palpites finais" text="Cada participante deve informar campeão, vice-campeão e terceiro colocado." />

            <RuleCard title="🏆 Premiação" text="A premiação será distribuída entre os três primeiros colocados: 1º lugar 60%, 2º lugar 30% e 3º lugar 10%." />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800 text-white rounded-3xl shadow-2xl">
        <CardContent className="p-6 lg:p-8 space-y-4">
          <h3 className="text-3xl font-black">Pontuação</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ScoreItem label="Placar exato" points="15 pts" />
            <ScoreItem label="Resultado correto" points="7 pts" />
            <ScoreItem label="Gols do vencedor" points="2 pts" />
            <ScoreItem label="Gols do perdedor" points="2 pts" />
            <ScoreItem label="Campeão correto" points="40 pts" />
            <ScoreItem label="Vice-campeão correto" points="25 pts" />
            <ScoreItem label="Terceiro colocado correto" points="15 pts" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RuleCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-5">
      <h3 className="text-xl font-black mb-2">{title}</h3>
      <p className="text-slate-300 text-base">{text}</p>
    </div>
  );
}

function ScoreItem({ label, points }: { label: string; points: string }) {
  return (
    <div className="flex items-center justify-between bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
      <span className="font-bold text-slate-200">{label}</span>
      <span className="font-black text-yellow-400">{points}</span>
    </div>
  );
}