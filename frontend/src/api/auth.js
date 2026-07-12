import { fetchPublico, lerErro } from "./client";

const authApi = {
  getMe: async () => {
    const res = await fetchPublico("/auth/me", { method: "GET" });
    if (!res.ok) {
      throw new Error(await lerErro(res, "Erro ao validar sessao"));
    }
    return res.json();
  },

  login: async (credenciais) => {
    const res = await fetchPublico("/auth/login", {
      method: "POST",
      body: JSON.stringify(credenciais),
    });
    if (!res.ok) {
      throw new Error(await lerErro(res, "Falha na autenticacao"));
    }
    return res.json();
  },

  logout: async () => {
    const res = await fetchPublico("/auth/logout", { method: "POST" });
    if (!res.ok) {
      throw new Error(await lerErro(res, "Erro ao encerrar sessao"));
    }
    return res.json();
  },
};

export { authApi };
