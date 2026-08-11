import { fetchComAutenticacao, lerErro } from "./client.js";

const sessaoApi = {
  getLogs: async ({ pagina = 1, limite = 5 } = {}) => {
    const params = new URLSearchParams({
      pagina: String(pagina),
      limite: String(limite),
    });
    const res = await fetchComAutenticacao(`/logs?${params}`);
    if (!res.ok) {
      throw new Error(await lerErro(res, "Erro ao buscar logs do sistema"));
    }
    return res.json();
  },
};

export { sessaoApi };
