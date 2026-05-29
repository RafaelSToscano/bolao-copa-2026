"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw } from "lucide-react";

interface AuthFormProps {
  onLogin: (name: string, password: string) => Promise<void>;
  onRequestAccess: (
  name: string,
  accessCode: string,
  password: string
) => Promise<void>;
  onRefresh: () => Promise<void>;
  error?: string | null;
  isLoading?: boolean;
}

export function AuthForm({
  onLogin,
  onRequestAccess,
  onRefresh,
  error,
  isLoading = false,
}: AuthFormProps) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const [registerName, setRegisterName] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  const [isRegistering, setIsRegistering] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onLogin(name, password);
  };

  const handleRequestAccess = async () => {
  await onRequestAccess(
    registerName,
    registerPhone,
    registerPassword
  );

  setSuccessModalOpen(true);
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
              <p className="text-slate-300 mt-2 text-lg font-semibold">Copa do Mundo FIFA</p>
            </div>
          </div>

          {!isRegistering ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-lg font-bold text-slate-200">
                  Nome do jogador
                </label>
                <Input
                  placeholder="Exemplo: Rafael Toscano ou apelido (evitar  nomes iguais)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  className="bg-slate-800 border-slate-700 text-white h-14 text-lg"
                />
              </div>

              <div className="space-y-2">
                <label className="text-lg font-bold text-slate-200">
                  Senha
                </label>
                <Input
                  type="password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="bg-slate-800 border-slate-700 text-white h-14 text-lg"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || !name || !password}
                className="w-full h-12 text-lg bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold"
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>

              <Button
                type="button"
                onClick={() => setIsRegistering(true)}
                variant="outline"
                className="w-full h-12 text-base border-yellow-500/60 text-yellow-400 bg-slate-900 hover:bg-yellow-500 hover:text-slate-950 font-bold"
              >
                Primeiro acesso? Solicitar acesso
              </Button>
            </form>
          ) : (
            <div className="space-y-4 border-t border-slate-800 pt-5">
              <div className="text-center">
                <h3 className="text-3xl font-black text-white">
                  Solicitar acesso
                </h3>

                <p className="text-base text-slate-300 mt-2">
                  Preencha seus dados. O administrador precisa aprovar seu acesso.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-lg font-bold text-slate-200">
                  Nome do jogador
                </label>
                <Input
                  placeholder="Exemplo: Rafael Toscano ou apelido (evitar nomes iguais)"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  disabled={isLoading}
                  className="bg-slate-800 border-slate-700 text-white h-14 text-lg"
                />
              </div>

              <div className="space-y-2">
                <label className="text-lg font-bold text-slate-200">
                  Celular com DDD
                </label>
                <Input
                  placeholder="Exemplo: 51999999999"
                  value={registerPhone}
                  onChange={(e) => setRegisterPhone(e.target.value)}
                  disabled={isLoading}
                  className="bg-slate-800 border-slate-700 text-white h-14 text-lg"
                />
              </div>

              <div className="space-y-2">
                <label className="text-lg font-bold text-slate-200">
                  Senha
                </label>
                <Input
                  type="password"
                  placeholder="Crie uma senha"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  disabled={isLoading}
                  className="bg-slate-800 border-slate-700 text-white h-14 text-lg"
                />
              </div>

              <Button
                type="button"
                onClick={handleRequestAccess}
                disabled={
                  isLoading ||
                  !registerName ||
                  !registerPhone ||
                  !registerPassword
                }
                className="w-full h-14 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-lg font-bold"
              >
                Enviar solicitação
              </Button>

              <Button
                type="button"
                onClick={() => setIsRegistering(false)}
                variant="outline"
                className="w-full h-14 border-slate-700 bg-slate-800 text-white hover:bg-slate-700 text-lg font-bold"
                              >
                Voltar para login
              </Button>
            </div>
          )}

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
          {successModalOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
    <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 p-6 text-center shadow-2xl">
      <div className="text-4xl mb-3">✅</div>

      <h3 className="text-2xl font-black text-white">
        Solicitação enviada
      </h3>

      <p className="text-slate-300 text-base mt-3">
        Sua solicitação foi enviada com sucesso e está aguardando aprovação do administrador.
      </p>

      <Button
  type="button"
  onClick={() => {
    setSuccessModalOpen(false);
    setIsRegistering(false);
    setRegisterName("");
    setRegisterPhone("");
    setRegisterPassword("");
    setName("");
    setPassword("");
  }}
  className="mt-6 w-full h-12 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold"
>
  OK
</Button>
    </div>
  </div>
)}
        </CardContent>
      </Card>
    </div>
  );
}