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
    throw new Error("Sessao expirada. Redirecionando para login...");
  }

  return res;
};

const fetchPublico = async (endpoint, options = {}) => {
  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
};

const lerErro = async (res, fallback) => {
  const errorData = await res.json().catch(() => ({}));
  return errorData.erro || fallback;
};

export { API_URL, fetchComAutenticacao, fetchPublico, lerErro };
