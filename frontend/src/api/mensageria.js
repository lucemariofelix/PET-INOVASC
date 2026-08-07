import { fetchComAutenticacao, lerErro } from "./client.js";

const mensageriaApi = {
  dispararWhatsApp: async (payload) => {
    const res = await fetchComAutenticacao("/mensagens/enviar", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(await lerErro(res, "Erro ao disparar mensagem"));
    }
    return res.json();
  },

  dispararMensagensLote: async (payload) => {
    const res = await fetchComAutenticacao("/notificacoes/lote", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(await lerErro(res, "Erro ao iniciar os disparos"));
    }
    return res.json();
  },

  getStatusMensagens: async (consultaIds, options = {}) => {
    const params = new URLSearchParams({
      consulta_ids: consultaIds.join(","),
    });
    const res = await fetchComAutenticacao(`/mensagens/status?${params}`, {
      signal: options.signal,
    });
    if (!res.ok) {
      throw new Error(
        await lerErro(res, "Erro ao atualizar status das mensagens"),
      );
    }
    return res.json();
  },

  getWhatsAppStatus: async (options = {}) => {
    const res = await fetchComAutenticacao("/whatsapp/status", {
      signal: options.signal,
    });
    if (!res.ok) {
      throw new Error(await lerErro(res, "Erro ao verificar status do WhatsApp"));
    }
    return res.json();
  },

  desconectarWhatsApp: async () => {
    const res = await fetchComAutenticacao("/whatsapp/conexao", {
      method: "DELETE",
    });
    if (!res.ok) {
      throw new Error(
        await lerErro(res, "Erro ao desconectar o WhatsApp"),
      );
    }
    return res.json();
  },
};

export { mensageriaApi };
