import { fetchComAutenticacao, lerErro } from "./client";

const sessaoApi = {
  getLogs: async () => {
    const res = await fetchComAutenticacao("/logs");
    if (!res.ok) {
      throw new Error(await lerErro(res, "Erro ao buscar logs do sistema"));
    }
    return res.json();
  },
};

export { sessaoApi };
