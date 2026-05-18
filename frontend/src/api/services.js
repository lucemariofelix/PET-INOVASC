const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// FUNÇÃO NOVA: Pega o crachá (token) do navegador para liberar o acesso
const getAuthHeaders = () => {
  const token = localStorage.getItem('sgr_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }) // Se tiver token, anexa na requisição
  };
};

export const api = {
  getConsultasAtrasadas: async () => {
    const res = await fetch(`${API_URL}/consultas/atrasadas`, { 
      headers: getAuthHeaders() // Mostrando o crachá
    });
    if (!res.ok) {
      // NOVO: Se o backend devolver 401 (Sessão Expirada), força o logout
      if (res.status === 401) {
        localStorage.removeItem('sgr_token');
        localStorage.removeItem('sgr_usuario');
        window.location.reload(); // Recarrega a página, ativando a trava do App.jsx
      }
      
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.erro || 'Erro ao buscar consultas');
    }
    
    return res.json();
  },

  getTodasConsultas: async () => {
    const res = await fetch(`${API_URL}/consultas`, { 
      headers: getAuthHeaders() // Mostrando o crachá
    });
    if (!res.ok) throw new Error('Erro ao buscar histórico de consultas');
    return res.json();
  },

  getPacientes: async () => {
    const res = await fetch(`${API_URL}/pacientes`, { 
      headers: getAuthHeaders() // Mostrando o crachá
    });
    if (!res.ok) throw new Error('Erro ao buscar pacientes');
    return res.json();
  },

  criarPaciente: async (payload) => {
    const res = await fetch(`${API_URL}/pacientes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.erro || 'Erro ao cadastrar paciente');
    }
    return res.json();
  },

  criarConsulta: async (payload) => {
    const res = await fetch(`${API_URL}/consultas`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.erro || 'Erro ao agendar consulta');
    }
    return res.json();
  },

  dispararWhatsApp: async (payload) => {
    const res = await fetch(`${API_URL}/mensagens/enviar`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.erro || 'Erro ao disparar mensagem');
    }
    return res.json();
  },

  login: async (credenciais) => {
    // O login é a única rota que NÃO pede token, pois é aqui que ele é gerado
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credenciais)
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.erro || 'Falha na autenticação');
    }
    return res.json();
  }
};