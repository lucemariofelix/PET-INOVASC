import { fetchComAutenticacao, lerErro } from "./client";

const usuariosApi = {
  getUsuarios: async () => {
    const res = await fetchComAutenticacao("/usuarios");
    if (!res.ok) {
      throw new Error(await lerErro(res, "Erro ao buscar usuarios"));
    }
    return res.json();
  },

  getACS: async () => {
    const res = await fetchComAutenticacao("/usuarios/acs");
    if (!res.ok) {
      throw new Error(await lerErro(res, "Erro ao buscar agentes ACS"));
    }
    return res.json();
  },

  criarUsuario: async (payload) => {
    const res = await fetchComAutenticacao("/usuarios", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(await lerErro(res, "Erro ao criar usuario"));
    }
    return res.json();
  },

  atualizarUsuario: async (id, payload) => {
    const res = await fetchComAutenticacao(`/usuarios/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(await lerErro(res, "Erro ao atualizar usuario"));
    }
    return res.json();
  },

  atualizarAvatar: async (arquivo) => {
    const formData = new FormData();
    formData.append("avatar", arquivo);
    const res = await fetchComAutenticacao("/usuarios/me/avatar", {
      method: "PATCH",
      body: formData,
    });
    if (!res.ok) {
      throw new Error(await lerErro(res, "Erro ao atualizar foto de perfil"));
    }
    return res.json();
  },

  excluirUsuario: async (id) => {
    const res = await fetchComAutenticacao(`/usuarios/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error(await lerErro(res, "Erro ao excluir usuario"));
    }
    return res.json();
  },
};

export { usuariosApi };
