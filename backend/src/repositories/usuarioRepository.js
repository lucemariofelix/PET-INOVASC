const { getSupabaseUsuario } = require("../config/supabase");

class UsuarioRepository {
  async listarTodos(authHeader) {
    const supabaseClient = getSupabaseUsuario(authHeader);
    const { data, error } = await supabaseClient
      .from("usuarios")
      .select("id, nome, email, funcao, created_at")
      .order("nome"); // Traz a lista em ordem alfabética

    if (error) throw error;
    return data;
  }

  async criar(dados, authHeader) {
    const supabaseClient = getSupabaseUsuario(authHeader);
    const { data, error } = await supabaseClient
      .from("usuarios")
      .insert([dados])
      .select("id, nome, email, funcao");

    if (error) throw error;
    return data[0];
  }

  async atualizar(id, dados, authHeader) {
    const supabaseClient = getSupabaseUsuario(authHeader);
    const { data, error } = await supabaseClient
      .from("usuarios")
      .update(dados)
      .eq("id", id)
      .select("id, nome, email, funcao");

    if (error) throw error;
    if (!data || data.length === 0) throw new Error("Usuário não encontrado.");
    return data[0];
  }

  async excluir(id, authHeader) {
    const supabaseClient = getSupabaseUsuario(authHeader);
    const { error } = await supabaseClient
      .from("usuarios")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  }
}

module.exports = new UsuarioRepository();
