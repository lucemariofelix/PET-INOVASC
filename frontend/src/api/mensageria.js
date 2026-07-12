import { fetchComAutenticacao, lerErro } from "./client";

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

  getWhatsAppStatus: async () => {
    const res = await fetchComAutenticacao("/whatsapp/status");
    if (!res.ok) {
      throw new Error(await lerErro(res, "Erro ao verificar status do WhatsApp"));
    }
    return res.json();
  },
};

export { mensageriaApi };
