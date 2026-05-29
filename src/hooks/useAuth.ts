import { useState, useEffect } from "react";
import { Player } from "@/types/player";
import { playersService } from "@/services/supabase/playersService";

const LOCAL_STORAGE_KEY = "bolao_user";

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<Player | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    }
    setIsChecking(false);
  }, []);

  const login = async (
  name: string,
  password: string
): Promise<boolean> => {
    setError(null);
    try {
      const user = await playersService.findPlayerByCredentials(
      name,
     password
);

      if (!user || !user.approved) {
        setError(
          user
            ? "Usuário aguardando aprovação do administrador."
            : "Usuário não encontrado."
        );
        return false;
      }

      setCurrentUser(user);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(user));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao fazer login.";
      setError(message);
      return false;
    }
  };
const requestAccess = async (
  name: string,
  accessCode: string,
  password: string
): Promise<boolean> => {
  setError(null);

  try {
    const existingUser = await playersService.findPlayerByCredentials(
  name,
  password
);

    if (existingUser) {
      setError(
        existingUser.approved
          ? "Usuário já cadastrado. Faça login."
          : "Solicitação já enviada. Aguarde aprovação do administrador."
      );
      return false;
    }

    await playersService.createPendingPlayer(
    name,
    accessCode,
    password
);

    setError(
      "Solicitação enviada com sucesso. Aguarde aprovação do administrador."
    );

    return true;
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Erro ao solicitar acesso.";

    setError(message);
    return false;
  }
};
  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  return {
  currentUser,
  isChecking,
  error,
  login,
  requestAccess,
  logout,
};
}
