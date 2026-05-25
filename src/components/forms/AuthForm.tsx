"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw } from "lucide-react";

interface AuthFormProps {
  onLogin: (name: string, code: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  error?: string | null;
  isLoading?: boolean;
}

export function AuthForm({
  onLogin,
  onRefresh,
  error,
  isLoading = false,
}: AuthFormProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onLogin(name, code);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-800 text-white rounded-3xl shadow-2xl">
        <CardContent className="p-8 space-y-6">
          <div className="text-center space-y-4">
            <img
              src="/brand/bolao-logo.jpg"
              alt="Bolão Copa 2026"
              className="mx-auto h-24 w-24 rounded-2xl object-cover shadow-xl"
            />

            <div>
              <h1 className="text-4xl font-black">Bolão 2026</h1>
              <p className="text-slate-400 mt-2">Copa do Mundo FIFA</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              className="bg-slate-800 border-slate-700 text-white h-12"
            />

            <Input
              placeholder="51999999999"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={isLoading}
              className="bg-slate-800 border-slate-700 text-white h-12"
            />

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-lg bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold"
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <Button
            onClick={onRefresh}
            disabled={isLoading}
            variant="outline"
            className="w-full border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
          >
            <RefreshCw className="mr-2" size={16} />
            Atualizar
          </Button>

          {error && (
            <div className="text-center text-sm text-red-400">{error}</div>
          )}

          <div className="text-xs text-slate-500 text-center">
            Exemplo: Rafael / 51999999999
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
