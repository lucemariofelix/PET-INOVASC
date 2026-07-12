import { fetchComAutenticacao, lerErro } from "./client";

const gruposApi = {
  getGrupos: async () => {
    const res = await fetchComAutenticacao("/grupos-acompanhamento");
    if (!res.ok) {
      throw new Error(await lerErro(res, "Erro ao buscar grupos de acompanhamento"));
    }
    return res.json();
  },

  criarGrupo: async (payload) => {
    const res = await fetchComAutenticacao("/grupos-acompanhamento", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(await lerErro(res, "Erro ao criar grupo de acompanhamento"));
    }
    return res.json();
  },

  dispararMensagemGrupo: async (grupoId, payload) => {
    const res = await fetchComAutenticacao(
      `/grupos-acompanhamento/${grupoId}/disparo`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
    if (!res.ok) {
      throw new Error(await lerErro(res, "Erro ao disparar mensagem do grupo"));
    }
    return res.json();
  },

  dispararGrupo: async (grupoId, mensagem) =>
    gruposApi.dispararMensagemGrupo(grupoId, { mensagem }),
};

export { gruposApi };
