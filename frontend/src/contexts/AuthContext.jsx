import { useCallback, useEffect, useMemo, useState } from "react";
import { authApi } from "../api/auth";
import { AuthContext } from "./authContext";

export default function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    const resposta = await authApi.getMe();
    setUsuario(resposta.usuario);
    return resposta.usuario;
  }, []);

  useEffect(() => {
    let cancelado = false;

    const validarSessao = async () => {
      try {
        const resposta = await authApi.getMe();
        if (!cancelado) {
          setUsuario(resposta.usuario);
        }
      } catch {
        if (!cancelado) {
          setUsuario(null);
        }
      } finally {
        if (!cancelado) {
          setLoading(false);
        }
      }
    };

    validarSessao();

    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    const handleSessaoExpirada = () => {
      setUsuario(null);
    };

    window.addEventListener("sgr:sessao-expirada", handleSessaoExpirada);

    return () => {
      window.removeEventListener("sgr:sessao-expirada", handleSessaoExpirada);
    };
  }, []);

  const login = useCallback(async (credenciais) => {
    const resposta = await authApi.login(credenciais);
    setUsuario(resposta.usuario);
    return resposta.usuario;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUsuario(null);
    }
  }, []);

  const valor = useMemo(
    () => ({
      usuario,
      loading,
      login,
      logout,
      refreshSession,
    }),
    [loading, login, logout, refreshSession, usuario],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
