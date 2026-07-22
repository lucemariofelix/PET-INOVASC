const { getSupabaseUsuario, supabaseAdmin } = require("../config/supabase");

class UsuarioRepository {
  async listarTodos(authHeader) {
    const supabaseClient = getSupabaseUsuario(authHeader);
    const { data, error } = await supabaseClient
      .from("perfis_usuarios")
      .select("id, nome, email, funcao, created_at")
      .order("nome"); // Traz a lista em ordem alfabética

    if (error) throw error;
    return data;
  }

  async listarACS(authHeader) {
    const supabaseClient = getSupabaseUsuario(authHeader);
    const { data, error } = await supabaseClient
      .from("perfis_usuarios")
      .select("id, nome, funcao")
      .eq("funcao", "ACS")
      .order("nome");

    if (error) throw error;
    return data;
  }

  async buscarPorId(id, authHeader) {
    const supabaseClient = getSupabaseUsuario(authHeader);
    const { data, error } = await supabaseClient
      .from("perfis_usuarios")
      .select("id, nome, email, funcao")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async criar(dados, authHeader) {
    const supabaseClient = getSupabaseUsuario(authHeader);
    const { data, error } = await supabaseClient
      .from("perfis_usuarios")
      .insert([dados])
      .select("id, nome, email, funcao");

    if (error) throw error;
    return data[0];
  }

  async criarComAdmin(dados) {
    const { data, error } = await supabaseAdmin
      .from("perfis_usuarios")
      .insert([dados])
      .select("id, nome, email, funcao");

    if (error) throw error;
    return data[0];
  }

  async atualizar(id, dados, authHeader) {
    const supabaseClient = getSupabaseUsuario(authHeader);

    const payloadLimpo = { ...dados };
    delete payloadLimpo.id;
    delete payloadLimpo.created_at;

    const { data, error } = await supabaseClient
      .from("perfis_usuarios")
      .update(payloadLimpo)
      .eq("id", id)
      .select("id, nome, email, funcao");

    if (error) throw error;
    
    // Se o array vier vazio, o RLS do Supabase bloqueou ou o ID não existe
    if (!data || data.length === 0) throw new Error("Usuário não encontrado ou sem permissão para atualizar.");
    
    return data[0];
  }

  async excluir(id, authHeader) {
    const supabaseClient = getSupabaseUsuario(authHeader);
    const { data, error } = await supabaseClient
      .from("perfis_usuarios")
      .delete()
      .eq("id", id)
      .select("id");

    if (error) throw error;
    if (!data || data.length === 0) {
      const error = new Error("Usuário não encontrado.");
      error.code = "USER_NOT_FOUND";
      throw error;
    }
    return true;
  }
}

module.exports = new UsuarioRepository();
