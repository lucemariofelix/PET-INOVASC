import { fetchComAutenticacao, lerErro } from "./client.js";

const consultasApi = {
  getConsultasAtrasadas: async () => {
    const res = await fetchComAutenticacao("/consultas/atrasadas");
    if (!res.ok) {
      throw new Error(await lerErro(res, "Erro ao buscar consultas atrasadas"));
    }
    return res.json();
  },

  getTodasConsultas: async () => {
    const res = await fetchComAutenticacao("/consultas");
    if (!res.ok) {
      throw new Error(await lerErro(res, "Erro ao buscar historico de consultas"));
    }
    return res.json();
  },

  criarConsulta: async (payload) => {
    const res = await fetchComAutenticacao("/consultas", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(await lerErro(res, "Erro ao agendar consulta"));
    }
    return res.json();
  },

  efetivarCancelamento: async (consultaId) => {
    const res = await fetchComAutenticacao(
      `/consultas/${encodeURIComponent(consultaId)}/cancelamento`,
      { method: "PATCH" },
    );
    if (!res.ok) {
      throw new Error(await lerErro(res, "Erro ao cancelar consulta"));
    }
    return res.json();
  },
};

export { consultasApi };
