const API_URL = import.meta.env?.VITE_API_URL || "http://localhost:3000";

const montarHeaders = (options = {}) => {
  const headers = { ...options.headers };
  const possuiContentType = Object.keys(headers).some(
    (nome) => nome.toLowerCase() === "content-type",
  );
  const possuiCorpo =
    options.body !== undefined && options.body !== null && options.body !== "";
  const corpoMultipart =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  if (possuiCorpo && !possuiContentType && !corpoMultipart) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
};

const notificarSessaoExpirada = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("sgr:sessao-expirada"));
  }
};

const fetchComAutenticacao = async (endpoint, options = {}) => {
  const headers = montarHeaders(options);

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
    headers: montarHeaders(options),
  });
};

const lerErro = async (res, fallback) => {
  const errorData = await res.json().catch(() => ({}));
  return errorData.erro || fallback;
};

export { API_URL, fetchComAutenticacao, fetchPublico, lerErro };
