const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const notificarSessaoExpirada = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("sgr:sessao-expirada"));
  }
};

const fetchComAutenticacao = async (endpoint, options = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers,
  });

  if (res.status === 401) {
    notificarSessaoExpirada();
    throw new Error("Sessão expirada. Redirecionando para login...");
  }

  return res;
};

const lerErro = async (res, fallback) => {
  const errorData = await res.json().catch(() => ({}));
  return errorData.erro || fallback;
};

const api = {
  getMe: async () => {
    const res = await fetch(`${API_URL}/auth/me`, {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      throw new Error(await lerErro(res, "Erro ao validar sessão"));
    }
    return res.json();
  },

  login: async (credenciais) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credenciais),
    });
    if (!res.ok) {
      throw new Error(await lerErro(res, "Falha na autenticação"));
    }
    return res.json();
  },

  logout: async () => {
    const res = await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      throw new Error(await lerErro(res, "Erro ao encerrar sessão"));
    }
    return res.json();
  },

  getConsultasAtrasadas: async () => {
    const res = await fetchComAutenticacao("/consultas/atrasadas");
    if (!res.ok) {
      throw new Error(await lerErro(res, "Erro ao buscar consultas atrasadas"));
    }
    return res.json();
  },

  getTodasConsultas: async () => {
    const res = await fetchComAutenticacao("/consultas");
    if (!res.ok) throw new Error("Erro ao buscar histórico de consultas");
    return res.json();
  },

  getPacientes: async () => {
    const res = await fetchComAutenticacao("/pacientes");
    if (!res.ok) throw new Error("Erro ao buscar pacientes");
    return res.json();
  },

  getGrupos: async () => {
    const res = await fetchComAutenticacao("/grupos-acompanhamento");
    if (!res.ok) throw new Error("Erro ao buscar grupos de acompanhamento");
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
    api.dispararMensagemGrupo(grupoId, { mensagem }),

  criarPaciente: async (payload) => {
    const res = await fetchComAutenticacao("/pacientes", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(await lerErro(res, "Erro ao cadastrar paciente"));
    }
    return res.json();
  },

  atualizarPaciente: async (id, payload) => {
    const res = await fetchComAutenticacao(`/pacientes/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(await lerErro(res, "Erro ao atualizar paciente"));
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

  getUsuarios: async () => {
    const res = await fetchComAutenticacao("/usuarios");
    if (!res.ok) throw new Error("Erro ao buscar usuários");
    return res.json();
  },

  getACS: async () => {
    const res = await fetchComAutenticacao("/usuarios/acs");
    if (!res.ok) throw new Error("Erro ao buscar agentes ACS");
    return res.json();
  },

  criarUsuario: async (payload) => {
    const res = await fetchComAutenticacao("/usuarios", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(await lerErro(res, "Erro ao criar usuário"));
    }
    return res.json();
  },

  atualizarUsuario: async (id, payload) => {
    const res = await fetchComAutenticacao(`/usuarios/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(await lerErro(res, "Erro ao atualizar usuário"));
    }
    return res.json();
  },

  excluirUsuario: async (id) => {
    const res = await fetchComAutenticacao(`/usuarios/${id}`, {
      method: "DELETE",
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      throw new Error(await lerErro(res, "Erro ao excluir usuário"));
    }
    return res.json();
  },

  getLogs: async () => {
    const res = await fetchComAutenticacao("/logs");
    if (!res.ok) throw new Error("Erro ao buscar logs do sistema");
    return res.json();
  },
};

export { api };
export default api;
