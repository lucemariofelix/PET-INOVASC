const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// 1. Pega o crachá
const getAuthHeaders = () => {
  const token = localStorage.getItem("sgr_token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// 2. O NOVO VIGIA GLOBAL: Toda requisição passa por aqui primeiro
const fetchComAutenticacao = async (endpoint, options = {}) => {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers, // Mescla com outros headers se houver
    },
  });

  // A TRAVA GLOBAL: Se bater 401 em QUALQUER lugar do sistema, cai aqui!
  if (res.status === 401) {
    localStorage.removeItem("sgr_token");
    localStorage.removeItem("sgr_usuario");
    window.location.reload(); // Ativa a trava do App.jsx

    // Trava a execução para não quebrar o React
    throw new Error("Sessão expirada. Redirecionando para login...");
  }

  return res;
};

// 3. Suas rotas agora ficam super limpas, chamando o vigia
export const api = {
  getConsultasAtrasadas: async () => {
    const res = await fetchComAutenticacao("/consultas/atrasadas");
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.erro || "Erro ao buscar consultas atrasadas");
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

  criarPaciente: async (payload) => {
    const res = await fetchComAutenticacao("/pacientes", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.erro || "Erro ao cadastrar paciente");
    }
    return res.json();
  },

  atualizarPaciente: async (id, payload) => {
    const res = await fetchComAutenticacao(`/pacientes/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.erro || "Erro ao atualizar paciente");
    }
    return res.json();
  },

  criarConsulta: async (payload) => {
    const res = await fetchComAutenticacao("/consultas", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.erro || "Erro ao agendar consulta");
    }
    return res.json();
  },

  dispararWhatsApp: async (payload) => {
    const res = await fetchComAutenticacao("/mensagens/enviar", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.erro || "Erro ao disparar mensagem");
    }
    return res.json();
  },

  // ==========================================
  // NOTIFICAÇÕES E MENSAGERIA
  // ==========================================
  dispararMensagensLote: async (payload) => {
    const res = await fetchComAutenticacao('/notificacoes/lote', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.erro || 'Erro ao iniciar os disparos');
    }
    return res.json();
  },

  login: async (credenciais) => {
    // O login continua usando o fetch normal porque ele não tem token ainda
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credenciais),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.erro || "Falha na autenticação");
    }
    return res.json();
  }, // <--- A VÍRGULA QUE ESTAVA FALTANDO FOI ADICIONADA AQUI

  // NOVO: Chamada para buscar o status do WhatsApp usando o Vigia Global
  getWhatsAppStatus: async () => {
    const res = await fetchComAutenticacao("/whatsapp/status");
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.erro || "Erro ao verificar status do WhatsApp");
    }
    return res.json();
  },

  // ==========================================
  // GESTÃO DE USUÁRIOS (EQUIPE DA UBS)
  // ==========================================
  getUsuarios: async () => {
    const res = await fetchComAutenticacao("/usuarios");
    if (!res.ok) throw new Error("Erro ao buscar usuários");
    return res.json();
  },

  criarUsuario: async (payload) => {
    const res = await fetchComAutenticacao("/usuarios", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.erro || "Erro ao criar usuário");
    }
    return res.json();
  },

  atualizarUsuario: async (id, payload) => {
    const res = await fetchComAutenticacao(`/usuarios/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.erro || "Erro ao atualizar usuário");
    }
    return res.json();
  },

  excluirUsuario: async (id) => {
    const res = await fetchComAutenticacao(`/usuarios/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      // ENVIANDO UM CORPO VAZIO PARA PASSAR PELO VALIDATOR DO FASTIFY
      body: JSON.stringify({}) 
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.erro || 'Erro ao excluir usuário');
    }
    return res.json();
  },
};
