import { fetchComAutenticacao, lerErro } from "./client";

const pacientesApi = {
  getPacientes: async () => {
    const res = await fetchComAutenticacao("/pacientes");
    if (!res.ok) {
      throw new Error(await lerErro(res, "Erro ao buscar pacientes"));
    }
    return res.json();
  },

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
};

export { pacientesApi };
